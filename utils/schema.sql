-- Water Intake Tracker MySQL Schema

-- Users Table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  clerkId VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_clerk_id (clerkId),
  INDEX idx_email (email)
);

-- User Profiles Table
CREATE TABLE user_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  age INT,
  weight DECIMAL(5, 2),
  activity_level ENUM('sedentary', 'light', 'moderate', 'very_active') DEFAULT 'moderate',
  daily_goal_ml INT DEFAULT 2000,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (userId)
);

-- Water Intake Log Table
CREATE TABLE water_intake_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  amount_ml INT NOT NULL,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  INDEX idx_user_id (user_id),
  INDEX idx_logged_at (logged_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_log_per_minute (user_id, logged_at)
);

-- Badges/Achievements Table
CREATE TABLE badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  badge_type ENUM('streak', 'milestone', 'special', 'challenge') DEFAULT 'milestone',
  threshold_value INT COMMENT 'What value to reach - days for streak, ml for milestone',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_badge_name (name)
);

-- User Badges Table (earned badges)
CREATE TABLE user_badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  badge_id INT NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_badge (user_id, badge_id),
  INDEX idx_user_id (user_id),
  INDEX idx_badge_id (badge_id)
);

-- Daily Statistics Table
CREATE TABLE daily_statistics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  date DATE NOT NULL,
  total_ml INT DEFAULT 0,
  log_count INT DEFAULT 0,
  goal_met BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_date (userId, date),
  INDEX idx_user_id (userId),
  INDEX idx_date (date)
);

-- Streaks Table (consecutive days meeting goal)
CREATE TABLE streaks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  current_streak_days INT DEFAULT 1,
  max_streak_days INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active)
);

-- Quick Add Presets Table
CREATE TABLE quick_add_presets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  amount_ml INT NOT NULL,
  icon_name VARCHAR(50),
  color_code VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- Goals/Challenges Table
CREATE TABLE goals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  goal_type ENUM('daily', 'weekly', 'monthly', 'custom') DEFAULT 'daily',
  target_value INT,
  target_unit ENUM('ml', 'days', 'entries'),
  start_date DATE NOT NULL,
  end_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_completed (is_completed)
);

-- AI Interactions/Chat History Table
CREATE TABLE ai_interactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  interaction_type ENUM('hydration_tip', 'motivation', 'analysis', 'reminder') DEFAULT 'hydration_tip',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Reminders Table
CREATE TABLE reminders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  reminder_type ENUM('scheduled', 'one_time') DEFAULT 'scheduled',
  time_of_day TIME,
  message TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active)
);

-- Settings Table
CREATE TABLE settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL UNIQUE,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  unit ENUM('ml', 'oz', 'liters') DEFAULT 'ml',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  theme ENUM('light', 'dark', 'system') DEFAULT 'light',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (userId)
);

-- Password Reset Tokens Table (for forgot password functionality)
CREATE TABLE password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token (token)
);

-- Session Tokens Table
CREATE TABLE session_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  device_info VARCHAR(255),
  ip_address VARCHAR(45),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
);
