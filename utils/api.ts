import AsyncStorage from "@react-native-async-storage/async-storage";

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
const STORAGE_KEYS = {
  ACCESS_TOKEN: "auth_access_token",
  REFRESH_TOKEN: "auth_refresh_token",
  USER_ID: "user_id",
};

type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  statusCode?: number;
};

type SignupData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

type LoginData = {
  email: string;
  password: string;
};

type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get stored access token from AsyncStorage
   */
  private async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error("Error retrieving access token:", error);
      return null;
    }
  }

  /**
   * Get stored refresh token from AsyncStorage
   */
  private async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error("Error retrieving refresh token:", error);
      return null;
    }
  }

  /**
   * Store tokens in AsyncStorage
   */
  private async storeTokens(tokens: AuthTokens, userId: number): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken],
        [STORAGE_KEYS.USER_ID, userId.toString()],
      ]);

      // Optional: only store refresh token if provided
      if (tokens.refreshToken) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          tokens.refreshToken,
        );
      }
    } catch (error) {
      console.error("Error storing tokens:", error);
      throw error;
    }
  }

  /**
   * Clear all stored tokens
   */
  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_ID,
      ]);
    } catch (error) {
      console.error("Error clearing tokens:", error);
    }
  }

  /**
   * Get stored user ID
   */
  async getUserId(): Promise<number | null> {
    try {
      const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
      return userId ? parseInt(userId, 10) : null;
    } catch (error) {
      console.error("Error retrieving user ID:", error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        return null;
      }

      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Send cookies
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const result: ApiResponse<{ tokens: AuthTokens }> = await response.json();

      if (result.success && result.data?.tokens) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.ACCESS_TOKEN,
          result.data.tokens.accessToken,
        );
        return result.data.tokens.accessToken;
      }

      return null;
    } catch (error) {
      console.error("Error refreshing access token:", error);
      // Token refresh failed, clear auth
      await this.clearTokens();
      return null;
    }
  }

  /**
   * Generic HTTP request wrapper with auth & error handling
   */
  async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const headers = new Headers(options.headers);
      headers.set("Content-Type", "application/json");

      // Add authorization header if available
      const accessToken = await this.getAccessToken();
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }

      let response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
      });

      // If unauthorized, try to refresh token
      if (response.status === 401) {
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          headers.set("Authorization", `Bearer ${newToken}`);
          response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers,
            credentials: "include",
          });
        }
      }

      const result: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "API request failed");
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Network error";
      return {
        success: false,
        message: errorMessage,
        error: "REQUEST_FAILED",
      };
    }
  }

  /**
   * SIGNUP - Create new user account
   */
  async signup(data: SignupData): Promise<
    ApiResponse<{
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      createdAt: string;
      tokens: AuthTokens;
    }>
  > {
    const response = await this.makeRequest("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });

    // Store tokens if signup successful
    if (response.success && response.data?.tokens) {
      const userId = response.data?.id;
      if (userId) {
        await this.storeTokens(response.data.tokens, userId);
      }
    }

    return response;
  }

  /**
   * LOGIN - Authenticate user
   */
  async login(data: LoginData): Promise<
    ApiResponse<{
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      tokens: AuthTokens;
    }>
  > {
    const response = await this.makeRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    // Store tokens if login successful
    if (response.success && response.data?.tokens) {
      const userId = response.data?.id;
      if (userId) {
        await this.storeTokens(response.data.tokens, userId);
      }
    }

    return response;
  }

  /**
   * LOGOUT - Clear session
   */
  async logout(): Promise<ApiResponse> {
    const response = await this.makeRequest("/api/auth/logout", {
      method: "POST",
    });

    // Always clear tokens locally
    await this.clearTokens();

    return response;
  }

  /**
   * FORGOT PASSWORD - Request reset email
   */
  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.makeRequest("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  /**
   * RESET PASSWORD - Submit new password with token
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<ApiResponse> {
    return this.makeRequest("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  }

  /**
   * GET USER PROFILE
   */
  async getUserProfile(): Promise<
    ApiResponse<{
      user: any;
      profile: any;
      settings: any;
    }>
  > {
    const userId = await this.getUserId();
    if (!userId) {
      return {
        success: false,
        message: "User not authenticated",
        error: "NOT_AUTHENTICATED",
      };
    }

    return this.makeRequest(`/api/users/${userId}`);
  }

  /**
   * UPDATE USER PROFILE
   */
  async updateUserProfile(data: any): Promise<ApiResponse> {
    const userId = await this.getUserId();
    if (!userId) {
      return {
        success: false,
        message: "User not authenticated",
        error: "NOT_AUTHENTICATED",
      };
    }

    return this.makeRequest(`/api/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * LOG WATER INTAKE
   */
  async logWaterIntake(amountMl: number, notes?: string): Promise<ApiResponse> {
    return this.makeRequest("/api/water-intake", {
      method: "POST",
      body: JSON.stringify({ amountMl, notes }),
    });
  }

  /**
   * GET TODAY'S WATER INTAKE
   */
  async getTodayWaterIntake(): Promise<ApiResponse> {
    return this.makeRequest("/api/water-intake/today");
  }

  /**
   * GET WATER INTAKE HISTORY
   */
  async getWaterIntakeHistory(
    startDate: string,
    endDate: string,
    limit = 30,
  ): Promise<ApiResponse> {
    const params = new URLSearchParams({
      startDate,
      endDate,
      limit: limit.toString(),
    });
    return this.makeRequest(`/api/water-intake/history?${params.toString()}`);
  }

  /**
   * DELETE WATER INTAKE ENTRY
   */
  async deleteWaterIntakeEntry(logId: number): Promise<ApiResponse> {
    return this.makeRequest(`/api/water-intake/${logId}`, {
      method: "DELETE",
    });
  }

  /**
   * GET ALL BADGES
   */
  async getAllBadges(): Promise<ApiResponse> {
    return this.makeRequest("/api/badges");
  }

  /**
   * GET USER'S EARNED BADGES
   */
  async getUserBadges(): Promise<ApiResponse> {
    const userId = await this.getUserId();
    if (!userId) {
      return {
        success: false,
        message: "User not authenticated",
        error: "NOT_AUTHENTICATED",
      };
    }

    return this.makeRequest(`/api/users/${userId}/badges`);
  }

  /**
   * GET USER STREAK
   */
  async getUserStreak(): Promise<ApiResponse> {
    const userId = await this.getUserId();
    if (!userId) {
      return {
        success: false,
        message: "User not authenticated",
        error: "NOT_AUTHENTICATED",
      };
    }

    return this.makeRequest(`/api/users/${userId}/streak`);
  }

  /**
   * GET USER STATISTICS
   */
  async getUserStatistics(
    startDate: string,
    endDate: string,
  ): Promise<ApiResponse> {
    const userId = await this.getUserId();
    if (!userId) {
      return {
        success: false,
        message: "User not authenticated",
        error: "NOT_AUTHENTICATED",
      };
    }

    const params = new URLSearchParams({ startDate, endDate });
    return this.makeRequest(
      `/api/users/${userId}/statistics?${params.toString()}`,
    );
  }

  /**
   * GET QUICK ADD PRESETS
   */
  async getQuickAddPresets(): Promise<ApiResponse> {
    const userId = await this.getUserId();
    if (!userId) {
      return {
        success: false,
        message: "User not authenticated",
        error: "NOT_AUTHENTICATED",
      };
    }

    return this.makeRequest(`/api/users/${userId}/quick-add-presets`);
  }

  /**
   * CREATE QUICK ADD PRESET
   */
  async createQuickAddPreset(data: any): Promise<ApiResponse> {
    const userId = await this.getUserId();
    if (!userId) {
      return {
        success: false,
        message: "User not authenticated",
        error: "NOT_AUTHENTICATED",
      };
    }

    return this.makeRequest(`/api/users/${userId}/quick-add-presets`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * SEND MESSAGE TO AI
   */
  async sendAiMessage(message: string): Promise<ApiResponse> {
    return this.makeRequest("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  /**
   * CHECK IF USER IS AUTHENTICATED
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  /**
   * Get current API base URL for manual requests
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types for use in components
export type { ApiResponse, AuthTokens, LoginData, SignupData };
