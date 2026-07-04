# 06 - Advanced Local Reminders

## Goal
Add local Android reminders using Expo Notifications and keep scheduled notifications synchronized with SQLite schedules.

## Dependencies
Install notifications with:

```bash
npx expo install expo-notifications
```

Use Expo SDK 54 notification APIs for permissions, scheduling, fetching scheduled notifications, and canceling scheduled notifications.

## Notification Services
Create:
- `src/services/notificationPermissionService.ts`
- `src/services/reminderScheduler.ts`
- `src/services/reminderSyncService.ts`

Required behavior:
- Request notification permission from Settings or onboarding flow.
- Schedule notifications for active medication schedules.
- Cancel notifications when a medication is deleted.
- Cancel notifications when a medication is paused.
- Reschedule notifications when schedule details change.
- Store notification IDs in `notification_mappings`.
- Reconcile stored mappings with currently scheduled notifications on app startup.

## Advanced Reminder Behavior
Support:
- Daily fixed-time reminders.
- Every-N-hours reminders.
- Selected weekday reminders.
- Optional end date.
- Snooze by canceling/replacing a pending notification.
- Resume after pause by scheduling future reminders again.

## UI Changes
- Settings screen shows permission status.
- Medication detail shows reminder status.
- Dose actions include snooze.
- If permissions are denied, app continues to work without reminders and shows a clear message.

## Test Plan
Manual Android real-device QA:
- Permission denied flow.
- Permission granted flow.
- Create medication and receive reminder.
- Restart app and verify future reminders still exist.
- Pause medication and verify future reminders are canceled.
- Delete medication and verify reminders are canceled.
- Snooze dose and receive delayed reminder.

## Acceptance Criteria
- Android device receives local reminders.
- Reminders survive app restart through persisted mappings and reconciliation.
- Deleting or pausing medication prevents future reminders.
- App remains usable with notifications denied.
