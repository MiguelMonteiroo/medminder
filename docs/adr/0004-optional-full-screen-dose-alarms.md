# Make full-screen dose alarms optional

Remedin will offer full-screen dose alarms as an explicit user preference because Android treats full-screen intents as special access and Google Play restricts their use. When the user has not enabled this preference, permission is unavailable, or Android declines to open the full-screen experience, the app will fall back to a high-priority notification with the same dose actions.
