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

- Insert into `user_profiles`: `name` (`firstName + lastName`), `gender: null`, `daily_goal_ml: 2000` (store weight in kg)
- Insert into `settings`: defaults (`reminder_enabled: true`, `reminder_schedule: "30 min"`, `reminder_sound: "Water drop sound"`, `notifications_enabled: true`, `theme: "light"`)
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
      "weight": null, // weight is stored in kg
      "daily_goal_ml": 2000
    },
    "settings": {
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
3. Return the current values using these fields: `name`, `gender`, `weight` (kg), `daily_goal_ml`, `reminder_enabled`, `reminder_schedule`, `reminder_sound`, `notifications_enabled`, `theme`.

### 3) PUT /api/users/profile

Frontend sends:

```json
{
  "clerkUserId": "user_123",
  "gender": "Male",
  "weight": 84, // weight must be provided in kg
  "dailyGoal": 2000 // daily goal in ml
}
```

Backend does:

1. Find user by `clerk_user_id`.
2. Update profile fields: `gender`, `weight` (kg), `daily_goal_ml`.

- Migration note for backend teams:

- Remove the `activity_level`, `unit`, and `weight_unit` fields from profile/settings models and API payloads (or mark them deprecated).
- Ensure all water amounts and daily goals are stored and handled in milliliters (`*_ml` columns/fields).
- Ensure weight is stored and returned in kilograms (kg).
- Update any database seeds/migrations that previously inserted `activity_level`, `unit`, or `weight_unit` to no longer rely on them.
- Update API docs and any clients to stop sending `activityLevel`, `waterUnit`, or `weightUnit` fields.

Example backend task description (prompt to backend engineer):

"Remove activity level and unit-selection fields from the user profile and settings. Migrate the system to treat all water amounts (cups, logs, daily goals, statistics) as milliliters and all weights as kilograms. Update DB schema and seed data to remove `activity_level`, `unit`, and `weight_unit` columns (or set them nullable/deprecated), update all endpoints to stop reading/writing these fields, and run a data migration to normalize any legacy values (e.g., convert ounces or lbs if present to ml/kg or ask for manual review if ambiguous). Ensure backward-compatible responses for clients by tolerating but ignoring these deprecated fields for a short deprecation window." 3. Return updated profile data.

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

### 9) GET /api/users/daily-stats

Frontend sends:

```json
{ "clerkUserId": "user_123" }
```

Backend does:

1. Find user by `clerk_user_id`.
2. Get today's daily statistics from the `daily_statistics` table.
3. Return today's stats (if not found, return defaults with 0 ml).

Success response:

```json
{
  "success": true,
  "data": {
    "total_ml": 1500,
    "goal_met": false,
    "log_count": 5,
    "date": "2024-01-23"
  }
}
```

### 10) GET /api/users/water-logs

Frontend sends:

```json
{ "clerkUserId": "user_123" }
```

Query params (optional):

- `date` - Get logs for specific date (default: today, format: YYYY-MM-DD)
- `limit` - Limit number of logs (default: 100)

Backend does:

1. Find user by `clerk_user_id`.
2. Get water intake logs for the specified date from `water_intake_logs` table.
3. Return array of logs sorted by `logged_at` descending (newest first).

Success response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "amount_ml": 500,
      "logged_at": "2024-01-23T08:30:00Z",
      "notes": "Added from Water Bottle"
    },
    {
      "id": 2,
      "amount_ml": 250,
      "logged_at": "2024-01-23T09:15:00Z",
      "notes": "Custom amount"
    }
  ]
}
```

### 11) POST /api/users/water-logs

Frontend sends:

```json
{
  "clerkUserId": "user_123",
  "amount_ml": 500,
  "notes": "Added from Water Bottle"
}
```

Backend does:

1. Find user by `clerk_user_id`.
2. Insert new log into `water_intake_logs` with:
   - `user_id`
   - `amount_ml`
   - `notes`
   - `logged_at` = current timestamp
3. Update today's `daily_statistics`:
   - Increment `total_ml` by amount
   - Increment `log_count` by 1
   - If new `total_ml` >= daily goal, set `goal_met = true`
4. Return created log.

Success response:

```json
{
  "success": true,
  "data": {
    "id": 123,
    "amount_ml": 500,
    "logged_at": "2024-01-23T10:30:00Z",
    "notes": "Added from Water Bottle"
  }
}
```

### 12) PUT /api/users/water-logs/:logId

Frontend sends:

```json
{
  "clerkUserId": "user_123",
  "amount_ml": 600,
  "notes": "Corrected amount"
}
```

Backend does:

1. Find user by `clerk_user_id`.
2. Find water log by `id` and verify it belongs to the user.
3. Get the original amount.
4. Update log: `amount_ml`, `notes`.
5. Update today's `daily_statistics`:
   - Calculate difference: `new_amount - old_amount`
   - Adjust `total_ml` by the difference
   - If new `total_ml` >= daily goal, set `goal_met = true`; otherwise `false`
6. Return updated log.

### 13) DELETE /api/users/water-logs/:logId

Frontend sends:

```json
{ "clerkUserId": "user_123" }
```

Backend does:

1. Find user by `clerk_user_id`.
2. Find water log by `id` and verify it belongs to the user.
3. Get the log's `amount_ml`.
4. Delete the log.
5. Update today's `daily_statistics`:
   - Subtract log's `amount_ml` from `total_ml`
   - Decrement `log_count` by 1
   - If new `total_ml` < daily goal, set `goal_met = false`
6. Return success.

### Error response

```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE"
}
```

<!-- New prompt here -->
