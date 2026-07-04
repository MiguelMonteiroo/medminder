# 04 - SQLite Persistence

## Goal
Make SQLite the local source of truth so MedMinder data survives app restarts.

## Dependencies
Install SQLite with:

```bash
npx expo install expo-sqlite
```

Use Expo SDK 54 SQLite APIs. The Expo docs state that `expo-sqlite` provides a SQLite database persisted across app restarts.

## Database Layer
Create:
- `src/database/db.ts`
- `src/database/migrations.ts`
- `src/database/schema.ts`
- `src/database/repositories/medicationRepository.ts`
- `src/database/repositories/scheduleRepository.ts`
- `src/database/repositories/doseLogRepository.ts`
- `src/database/repositories/notificationRepository.ts`
- `src/database/repositories/settingsRepository.ts`

## Tables
Create migrations for:
- `medications`
- `medication_schedules`
- `dose_logs`
- `notification_mappings`
- `app_settings`

Use a database user version migration strategy so later schema changes are explicit.

## Repository Behavior
Repositories expose persistence operations only:
- Create, read, update, delete medications.
- Create, read, update, delete schedules.
- Insert and query dose logs.
- Store and delete notification mappings.
- Read and update app settings.

Do not schedule notifications in repositories. Notification scheduling belongs in step 06 services.

## UI Integration
- Load medications and schedules from SQLite on app startup.
- Persist create/edit/delete/toggle actions.
- Show a loading state while initial data loads.
- Show an error state if database initialization fails.

## Test Plan
- Manual Android QA:
  - Fresh install shows empty state.
  - Add medication.
  - Restart app.
  - Medication remains.
  - Delete medication.
  - Restart app.
  - Medication stays deleted.
- Run TypeScript check.

## Acceptance Criteria
- SQLite is the source of truth.
- Data survives app restart.
- Migrations are versioned.
- Components do not call SQLite directly.
