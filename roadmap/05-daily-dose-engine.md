# 05 - Daily Dose Engine

## Goal
Generate concrete dose occurrences from medication schedules and logs so the app tracks doses, not just medications.

## Pure Engine
Create pure functions in `src/services` or `src/utils`:
- `generateDoseOccurrencesForDate(input)`
- `resolveDoseStatus(occurrence, logs)`
- `getTodayDoseViewModel(date, medications, schedules, logs)`
- `getAdherenceSummary(occurrences)`

Inputs:
- Medications.
- Schedules.
- Dose logs.
- Target date.

Outputs:
- Pending, taken, skipped, snoozed, and missed dose occurrences.
- Summary counts for the selected date.

## Schedule Support
Support:
- Fixed daily times.
- Every N hours.
- Selected weekdays.
- Optional start date.
- Optional end date.
- Paused medications excluded from generated active doses.

## User Actions
Implement service-level methods:
- `markDoseTaken`
- `undoDoseAction`
- `skipDose`
- `snoozeDose`

Each method writes to `dose_logs` instead of mutating a medication-level `taken` boolean.

## UI Changes
- Home summary counts dose occurrences.
- Pending section shows pending/snoozed doses.
- Completed section shows taken/skipped doses.
- Medication cards become dose cards or receive dose occurrence view models.

## Test Plan
Create automated tests for:
- Daily schedule produces expected occurrences.
- Every-N-hours schedule produces expected occurrences.
- Weekday schedule only appears on selected weekdays.
- Paused medication produces no active occurrences.
- Logs override occurrence status.
- Snooze changes pending display until snooze time.

## Acceptance Criteria
- Daily summary reflects scheduled doses for the day.
- Toggling medication-level `taken` is replaced by dose-level logs.
- Dose generation is pure and testable.
