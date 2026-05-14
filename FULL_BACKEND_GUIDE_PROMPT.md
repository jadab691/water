## PROFILE BACKEND PROMPT

### 1) POST /api/users/initialize-profile

Frontend sends:

```json
{
  "clerkUserId": "user_123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

Backend does:

1. Check if user with this `clerkUserId` already exists in `users` table.
2. If exists, return the existing user data.
3. If not, create the user in a transaction:
   - Insert into `users`: `clerk_user_id`, `email`, `created_at`

- Insert into `user_profiles`: `name` (`firstName + lastName`), `gender: null`, `activity_level: "Medium"`, `daily_goal_ml: 2000`, `weight_unit: "kg"`
- Insert into `settings`: defaults (`reminder_enabled: true`, `reminder_schedule: "30 min"`, `reminder_sound: "Water drop sound"`, `unit: "ml"`, `weight_unit: "kg"`, `notifications_enabled: true`, `theme: "light"`)
- Insert into `daily_statistics` for today: `date: TODAY()`, `total_ml: 0`

4. Commit and return user data.
5. On any DB error: rollback and return error.

Success response:

```json
{
  "success": true,
  "data": {
    "userId": 1,
    "clerkUserId": "user_123",
    "email": "user@example.com",
    "profile": {
      "name": "John Doe",
      "gender": null,
      "weight": null,
      "activity_level": "Medium",
      "daily_goal_ml": 2000
    },
    "settings": {
      "unit": "ml",
      "weight_unit": "kg",
      "reminder_enabled": true,
      "reminder_schedule": "30 min",
      "reminder_sound": "Water drop sound",
      "notifications_enabled": true,
      "theme": "light"
    }
  }
}
```

### 2) GET /api/users/profile

Frontend sends:

```json
{ "clerkUserId": "user_123" }
```

Backend does:

1. Find user by `clerk_user_id`.
2. Fetch profile and settings for the profile page.
3. Return the current values using these fields: `name`, `gender`, `weight`, `activity_level`, `daily_goal_ml`, `unit`, `weight_unit`, `reminder_enabled`, `reminder_schedule`, `reminder_sound`, `notifications_enabled`, `theme`.

### 3) PUT /api/users/profile

Frontend sends:

```json
{
  "clerkUserId": "user_123",
  "gender": "Male",
  "weight": 84,
  "dailyGoal": 2000,
  "waterUnit": "ml",
  "weightUnit": "kg",
  "activityLevel": "Medium"
}
```

Backend does:

1. Find user by `clerk_user_id`.
2. Update profile fields: `gender`, `weight`, `daily_goal_ml`, `activity_level`, `weight_unit`.
3. Return updated profile data.

### 4) PUT /api/users/reminder-settings

Frontend sends:

```json
{
  "clerkUserId": "user_123",
  "reminderEnabled": true,
  "reminderSchedule": "30 min",
  "reminderSound": "Water drop sound"
}
```

Backend does:

1. Find user by `clerk_user_id`.
2. Update reminder settings: `reminder_enabled`, `reminder_schedule`, `reminder_sound`.
3. Return success.

### 5) GET /api/users/cups

Frontend sends:

```json
{ "clerkUserId": "user_123" }
```

Backend does:

1. Find user by `clerk_user_id`.
2. Return all cups from the `cups` table for that user.

### 6) POST /api/users/cups

Frontend sends:

```json
{
  "clerkUserId": "user_123",
  "name": "Bottle L",
  "volume": 1000,
  "unit": "ml"
}
```

Backend does:

1. Find user by `clerk_user_id`.
2. Insert cup.
3. Return created cup.

### 7) DELETE /api/users/cups/:cupId

Frontend sends:

```json
{ "clerkUserId": "user_123" }
```

Backend does:

1. Find user by `clerk_user_id`.
2. Delete cup only if it belongs to that user.
3. Return success.

### 8) GET /api/users/achievements

Frontend sends:

```json
{ "clerkUserId": "user_123" }
```

Backend does:

1. Find user by `clerk_user_id`.
2. Return achievements/badges list.

### Error response

```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE"
}
```
