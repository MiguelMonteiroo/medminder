# Google Play alarm declarations

## Full-screen intent

MedMinder declares `USE_FULL_SCREEN_INTENT` because a core app function is presenting a time-sensitive medication alarm over the lockscreen. Before production submission, complete the Full-Screen Intent declaration in Play Console and describe:

- the user creates medication schedules explicitly;
- full-screen alarms are opt-in;
- the alarm offers `Marcar como tomado` and `Adiar 5 min`;
- denial falls back to a high-priority heads-up notification;
- MedMinder does not promise medical-grade delivery.

Screenshots or a short review video should show the schedule creation, the Profile toggle, the Android permission page, the locked-device alarm, and the fallback.

## Notification policy access

MedMinder declares `ACCESS_NOTIFICATION_POLICY` only to create an optional dose-alarm channel that can bypass silent/Do Not Disturb modes after explicit user authorization. The app does not change the global interruption filter.

Store copy, onboarding, the privacy policy, and Data Safety answers must describe this as an optional local-device capability. If Play policy or review rejects either declaration, keep the documented normal-channel and heads-up fallbacks and remove copy that promises the restricted behavior.

## Release verification

- Confirm both permissions are present in the merged release manifest.
- Confirm the in-app preference defaults to off.
- Confirm denial does not block normal reminders.
- Confirm revocation moves newly reconciled reminders to the normal channel.
- Revalidate declarations whenever the target SDK or Play policy changes.
