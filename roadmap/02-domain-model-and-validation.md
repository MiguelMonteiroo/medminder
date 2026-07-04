# 02 - Domain Model And Validation

## Goal
Replace the single all-purpose `Medication` type with production domain types and move validation into pure utilities.

## Domain Types
Create domain types in `src/types` or split them into focused files if preferred.

Required types:
- `Medication`
  - `id`
  - `name`
  - `dosage`
  - `notes`
  - `createdAt`
  - `updatedAt`
  - `isPaused`
- `MedicationSchedule`
  - `id`
  - `medicationId`
  - `kind`: `dailyTimes` | `intervalHours` | `weekdays`
  - `times`
  - `intervalHours`
  - `weekdays`
  - `startDate`
  - `endDate`
  - `snoozeMinutes`
  - `isActive`
- `DoseOccurrence`
  - `id`
  - `medicationId`
  - `scheduleId`
  - `scheduledAt`
  - `status`: `pending` | `taken` | `skipped` | `snoozed` | `missed`
- `DoseLog`
  - `id`
  - `doseOccurrenceId`
  - `medicationId`
  - `scheduleId`
  - `action`: `taken` | `skipped` | `snoozed` | `undone`
  - `actionAt`
  - `snoozedUntil`
- `ReminderNotification`
  - `id`
  - `medicationId`
  - `scheduleId`
  - `doseOccurrenceId`
  - `notificationId`
  - `scheduledFor`
- `ReminderSettings`
  - `notificationsEnabled`
  - `defaultSnoozeMinutes`

## Validation Utilities
Create pure utility functions in `src/utils`:
- `validateMedicationName(name)`
- `validateDosage(dosage)`
- `validateTimeHHMM(time)`
- `validateSchedule(scheduleInput)`
- `normalizeMedicationInput(input)`
- `normalizeScheduleInput(input)`

Keep validation independent from React state and components.

## UI Integration
- Update `MedicationForm` to use the validation utilities.
- Keep form fields simple in this step; navigation and safer time picking come later.
- Return user-friendly error messages from validation utilities or map validation codes to messages in the form.

## Test Plan
- Add unit tests for validation once the test framework is introduced in step 09, or create colocated examples now if no framework exists.
- Manually verify:
  - Empty medication name fails.
  - Invalid time fails.
  - Valid `08:00` passes.
  - `8:00`, `24:00`, and `12:60` fail.

## Acceptance Criteria
- Domain types distinguish medications, schedules, dose occurrences, logs, reminders, and settings.
- Components no longer own regex or business validation directly.
- Validation functions can be tested without rendering React components.
