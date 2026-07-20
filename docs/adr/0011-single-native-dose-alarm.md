# Use one native artifact for exact dose alarms

## Status

Accepted. Supersedes ADR 0010 for exact alarms scheduled by the native module.

## Context

The previous implementation scheduled a visible Notifee alarm and a native foreground service for the same dose. Android therefore showed two notifications with independent identifiers and lifecycles. Dismissing one notification did not necessarily stop the native audio service.

## Decision

When native exact scheduling succeeds, `MedicationAlarmService` owns the complete alarm experience: one foreground notification, alarm audio, vibration, wake lock, full-screen intent and actions. No Notifee dose-alarm notification is created in that path.

The service notification is required while audio is playing. Taking, snoozing, ending a test or reaching the timeout removes the foreground notification and stops the service, player, audio focus and wake lock together.

Notifee remains responsible for pre-alerts, handoff reminders, reinforcements and the complete dose-alarm fallback when native scheduling is unavailable. Native artifact identifiers use the `native:` prefix so cancellation and reconciliation do not require a corresponding Notifee notification.

Native notification actions stop the alarm immediately. Dose actions then invoke the existing idempotent `NotificationActionCommand` through the `RemedinAlarmAction` Headless JS task. A test alarm is stopped entirely in native code.

For one dose, the notification offers `Marcar como tomado` and `Adiar 5 min`. For simultaneous doses it displays one grouped notification and only `Abrir alarme`; individual actions remain in `DoseAlarmActivity`.

## Consequences

- The foreground notification and audio cannot diverge.
- Full-screen launch no longer depends on a Notifee receiver or an already-running React Native process.
- The app must keep the `systemExempted` foreground-service and full-screen-intent declarations current in Google Play Console.
- Manufacturer restrictions and user revocation of full-screen access still apply.
