// API Configuration
const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL || "https://smart-hydrate.vercel.app";
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  statusCode?: number;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  /**
   * Generic HTTP request wrapper with robust error handling (no AsyncStorage crashes in production builds)
   */
  async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const headers = new Headers(options.headers);
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
      const url = `${this.baseUrl}${cleanEndpoint}`;

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get("content-type") || "";
      let result: any = null;

      if (contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        try {
          result = JSON.parse(text);
        } catch {
          result = { success: response.ok, message: text };
        }
      }

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          message: result?.message || `Request failed with status ${response.status}`,
          data: result?.data,
          error: result?.error || "REQUEST_FAILED",
        };
      }

      return result ?? { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Network error";
      return {
        success: false,
        message: errorMessage,
        error: "NETWORK_ERROR",
      };
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types for use in components
export type { ApiResponse };
