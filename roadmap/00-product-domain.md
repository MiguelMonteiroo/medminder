# 00 - Product Domain

## Goal
Define MedMinder as an Android-first, offline medication reminder app that helps a user register medications, understand today's dose plan, receive local reminders, and record intake history without a backend.

## Current State
- Expo SDK 54 React Native app.
- Data is in memory only.
- Existing UI supports creating medications, toggling taken/pending, deleting, and viewing a summary.
- No persistence, navigation, notification scheduling, or history yet.

## Product Definition
MedMinder is an offline mobile app for tracking medications, scheduled doses, local reminders, and daily intake progress.

The first production release targets Android and must work without an account, network access, or remote backend.

## Glossary
- Medication: The medicine or supplement the user wants to track, such as Losartan or Vitamin D.
- Schedule: The recurrence rule that says when a medication should be taken.
- Dose: A planned intake of a medication.
- DoseOccurrence: A concrete scheduled dose for a specific date and time.
- IntakeLog: A saved user action for a dose occurrence, such as taken, skipped, snoozed, or undone.
- Reminder: A local device notification associated with a dose occurrence or schedule.
- Snooze: A user action that delays a pending reminder for a short period.
- Pause: A user action that temporarily disables a medication schedule without deleting it.

## ADRs
### ADR 001 - Offline-first storage
Use SQLite as the source of truth. Data must remain local to the device and survive app restarts.

### ADR 002 - Android-first production target
Optimize the first production path for Android. iOS compatibility should not be deliberately broken, but Android release readiness is the milestone.

### ADR 003 - Local notifications only
Use local notifications for reminders. Do not add push notifications, remote notification services, accounts, or a backend in v1.

### ADR 004 - Advanced reminders in v1
Support advanced reminder behavior in v1: daily times, every-N-hours schedules, selected weekdays, optional start/end dates, pause/resume, and snooze.

## Acceptance Criteria
- Another implementer can explain the core domain terms consistently.
- No backend, account, sync, or cloud dependency is introduced.
- Later roadmap steps reference these terms instead of inventing competing names.
