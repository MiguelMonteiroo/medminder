# 03 - Data Integrity And Local Storage

## Goal
Ensure SQLite data remains consistent through add, edit, delete, pause, dose actions, notification scheduling, app restart, and future schema changes.

## Current Context
The app uses local SQLite repositories for medications, schedules, dose logs, notification mappings, and settings. The product is offline-first and local-only. Local data quality is the source of truth for Home, History, Medications, Details, and notifications.

## Design System Requirements
- Database loading, failure, empty, and recovery states must use existing app components.
- Use `AppCard`, `AppButton`, `AppText`, `EmptyState`, `StatusBadge`, and theme tokens.
- Do not expose raw database errors as primary UI.
- Keep error copy calm, Portuguese, and actionable.
- Do not add visually unrelated admin/debug screens to production UI.

## Implementation Steps
1. Review migrations:
   - Confirm all required tables exist.
   - Confirm migrations are safe to run repeatedly.
   - Confirm default values match domain assumptions.
2. Review repository ownership:
   - Screens should use app-level service methods.
   - Visual components should not call repositories.
3. Delete integrity:
   - Removing medication deletes or cleans related schedules.
   - Removing medication cleans notification mappings.
   - Decide dose-log behavior for deleted medications.
   - For MVP, prefer removing related logs if orphan history would confuse users.
4. Edit integrity:
   - Editing updates the existing medication row.
   - Editing updates the existing primary schedule row when possible.
   - Editing does not create duplicate active schedules.
5. Notification mapping integrity:
   - Canceling notifications removes mappings.
   - Reconciliation removes mappings for missing scheduled notifications.
   - Recreating reminders avoids duplicate `doseOccurrenceId` mappings.
6. Dose log integrity:
   - Dose occurrence status resolves from the latest relevant log action.
   - Taken, skipped, snoozed, and undone actions produce coherent UI states.
   - History remains readable after schedule edits.
7. Settings integrity:
   - Profile name persists across restart.
   - Missing settings fall back to safe defaults.
8. Database failure handling:
   - Avoid throwing during render when a recoverable error screen is possible.
   - Provide retry action for initialization failure.
9. Optional local reset:
   - Add reset-data action only if QA needs a production-safe recovery path.
   - If added, require confirmation and explain data loss.

## Acceptance Criteria
- Fresh install creates a working database.
- App restart preserves medications, schedules, logs, mappings, and profile name.
- Delete medication does not leave UI-breaking orphan rows.
- Edit medication does not duplicate active schedules.
- Notification mappings stay consistent after pause, delete, edit, and restart.
- Empty database state renders intentionally.
- Database failure state is understandable and not a red screen.
- Storage-related UI respects the design system.

## Test Plan
- Automated:
  - Repository tests for create/update/delete where practical.
  - Dose status tests for latest-log behavior.
  - Migration smoke test if test DB setup exists.
- Manual:
  - Fresh install.
  - Add several medications.
  - Restart app.
  - Edit a schedule.
  - Delete a medication.
  - Confirm Home, Medications, Detail, and History render correctly.
  - Inspect notification mapping behavior during reminder flows.
- Commands:
  - `npm.cmd run typecheck`
  - `npm.cmd test -- --runInBand`

## Notes
- Avoid introducing a complex ORM for MVP.
- Avoid data export/import until after MVP.
- If deleting logs for deleted medications is chosen, document it as intentional.
