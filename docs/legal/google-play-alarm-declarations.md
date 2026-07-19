# Google Play alarm declarations

## Full-screen intent

Remedin declares `USE_FULL_SCREEN_INTENT` because a core app function is presenting a time-sensitive medication alarm over the lockscreen. Complete the Full-Screen Intent declaration after uploading the first signed AAB to an internal-test draft and before publishing that test release. Do not wait for production submission. Describe:

- the user creates medication schedules explicitly;
- full-screen alarms are opt-in;
- the alarm offers `Marcar como tomado` and `Adiar 5 min`;
- denial falls back to a high-priority heads-up notification;
- Remedin does not promise medical-grade delivery.

Screenshots or a short review video should show the schedule creation, the Profile toggle, the Android permission page, the locked-device alarm, and the fallback.

## Notification policy access

Remedin declares `ACCESS_NOTIFICATION_POLICY` only to create an optional dose-alarm channel that can bypass silent/Do Not Disturb modes after explicit user authorization. The app does not change the global interruption filter.

Store copy, onboarding, the privacy policy, and Data Safety answers must describe this as an optional local-device capability. If Play policy or review rejects either declaration, keep the documented normal-channel and heads-up fallbacks and remove copy that promises the restricted behavior.

## Foreground alarm service

Remedin declares the `systemExempted` foreground service type because it holds `SCHEDULE_EXACT_ALARM` and uses a short-lived service to continue user-scheduled alarm audio in the background. Complete the foreground-service declaration together with the Full-Screen Intent declaration before publishing the first internal-test release.

The declaration must explain that the service runs for at most 60 seconds, remains perceptible to the user, can be stopped from the alarm actions, and cannot be deferred without risking a late medication reminder. Provide a review video showing schedule creation, alarm delivery and alarm termination.

## Release verification

- Confirm both permissions are present in the merged release manifest.
- Confirm the in-app preference defaults to off.
- Confirm denial does not block normal reminders.
- Confirm revocation moves newly reconciled reminders to the normal channel.
- Revalidate declarations whenever the target SDK or Play policy changes.
