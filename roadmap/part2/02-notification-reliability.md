# 02 - Notification Reliability

## Goal
Make local Android reminders reliable enough for MVP testing and Google Play release. Notifications must work in release builds, survive app restarts through persisted mappings, and be canceled or rescheduled when medication state changes.

## Current Context
The project uses `@notifee/react-native`, reminder scheduler/sync services, notification mappings in SQLite, and Android notification permissions. Medication reminders are core to MedMinder, so debug-only verification is not enough.

## Design System Requirements
- Permission cards and error states must use existing components and tokens.
- Denied or blocked permission states must be friendly and non-technical.
- Use lucide icons for notification, warning, and settings actions.
- Keep notification UI visually aligned with Profile/Settings.
- Keep user-facing copy in Portuguese.
- Do not add a separate technical-looking notification screen.

## Implementation Steps
1. Audit notification channel creation:
   - Confirm channel ID `medication-reminders`.
   - Confirm channel is created before scheduling.
   - Confirm vibration pattern is valid.
   - Use a user-friendly Portuguese channel name/description.
2. Audit permission flow:
   - Settings/Profile shows permission state.
   - Denied state explains reminders will not appear.
   - Provide action to request permission or open system settings where possible.
3. Audit scheduling:
   - Daily fixed-time schedules create future notifications.
   - Interval schedules create future notifications.
   - Weekday schedules create future notifications only for selected days.
   - Past occurrences are not scheduled.
4. Audit cancellation:
   - Delete medication cancels future notifications.
   - Pause medication cancels future notifications.
   - Resume schedules future notifications again.
   - Edit schedule cancels old future notifications and creates new ones.
5. Audit snooze:
   - Snooze creates a delayed reminder.
   - Snooze does not create unexpected duplicate alerts.
   - Snoozed notification mapping is stored or reconciled consistently.
6. Reconciliation:
   - On startup, compare stored mappings with scheduled Notifee trigger IDs.
   - Remove stale mappings.
   - Recreate missing future reminders when permission is granted and schedule is active.
7. Exact alarm decision:
   - Decide whether `SCHEDULE_EXACT_ALARM` is required.
   - If retained, document why reminder timing needs it.
   - If it creates Play policy risk, move to less restrictive scheduling if acceptable.
8. Release validation:
   - Test notifications in release APK or internal Play build.
   - Do not rely only on debug builds.

## Acceptance Criteria
- Permission state is visible and understandable.
- App remains usable when notifications are denied.
- Local reminders fire on a real Android device in release/internal build.
- App restart does not lose future reminders.
- Pause/delete/edit correctly cancel or reschedule reminders.
- Snooze creates a delayed reminder without duplicate unexpected alerts.
- Notification mappings do not accumulate stale rows.
- Notification UI follows the current design system.

## Test Plan
- Manual real-device QA:
  - Fresh install with permission denied.
  - Fresh install with permission granted.
  - Create a daily reminder a few minutes in the future and receive it.
  - Restart app before reminder fires and receive it.
  - Create interval schedule and verify upcoming reminders.
  - Create weekday schedule and verify correct day behavior.
  - Pause medication and confirm no future reminder arrives.
  - Resume medication and confirm future reminder is scheduled.
  - Delete medication and confirm no future reminder arrives.
  - Snooze dose and confirm delayed reminder.
- Debug checks:
  - Inspect scheduled trigger IDs during development.
  - Inspect `notification_mappings` before/after pause, delete, edit, and snooze.
- Commands:
  - `npm.cmd run typecheck`
  - `npm.cmd test -- --runInBand`

## Notes
- Android OEM battery optimization can affect notifications. Document only if observed.
- Do not add push notifications or a backend in MVP.
- Do not overpromise medical-critical reliability in Play Store copy.
