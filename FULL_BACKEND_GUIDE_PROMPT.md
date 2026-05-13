## POST /api/users/initialize-profile

Frontend will send:

```json
{
  "clerkUserId": "user_123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

Backend needs to do:

1. Check if user with this `clerkUserId` already exists in `users` table.
2. If exists: return the existing user data.
3. If not: create new user record in transaction:
   - Insert into `users` table: `clerk_user_id`, `email`, `created_at`
   - Insert into `user_profiles`: `name` (firstName + lastName), `activity_level: "moderate"`, `daily_goal_ml: 2000`
   - Insert into `settings`: default values (`reminder_enabled: true`, `unit: "ml"`, `notifications_enabled: true`, `theme: "light"`)
   - Insert into `daily_statistics` for today: `date: TODAY()`, `total_ml: 0`
4. Commit and return user data.
5. On any DB error: rollback and return error.

Backend returns on success:

```json
{
  "success": true,
  "data": {
    "userId": 1,
    "clerkUserId": "user_123",
    "email": "user@example.com",
    "profile": {
      "name": "John Doe",
      "daily_goal_ml": 2000
    },
    "settings": {
      "unit": "ml",
      "reminder_enabled": true,
      "notifications_enabled": true,
      "theme": "light"
    }
  }
}
```

Backend returns on error:

```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE"
}
```
