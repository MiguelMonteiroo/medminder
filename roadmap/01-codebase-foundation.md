# 01 - Codebase Foundation

## Goal
Clean up the current app structure and prepare it for persistence, navigation, domain services, and tests without changing user-facing behavior.

## Implementation Steps
- Standardize formatting across existing TypeScript files:
  - Use consistent spacing in imports, props, and style objects.
  - Add missing semicolons.
  - Keep component names and file names as they are.
- Create empty folders for upcoming layers:
  - `src/services`
  - `src/database`
  - `src/hooks`
  - `src/utils`
- Keep `HomeScreen` responsible for orchestration only:
  - Medication list state stays there for now.
  - Form validation stays in `MedicationForm` until validation is extracted in step 02.
  - Card display stays in `MedicationCard`.
  - Summary display stays in `MedicationSummary`.
- Fix derived values:
  - Use `const takenCount = medications.filter((medication) => medication.taken).length;`
  - Prefer `handleRemoveMedication` and `handleToggleMedicationTaken` names for event handlers.
- Keep behavior unchanged:
  - Add medication.
  - Delete medication.
  - Toggle taken/pending.
  - Show summary and empty list message.

## Interfaces
No public type changes in this step. Keep the current `Medication` type until the domain model replacement in step 02.

## Test Plan
- Run TypeScript check with `npx tsc --noEmit`.
- Start Expo and verify manually on Android/Expo Go:
  - Add a valid medication.
  - Try invalid time.
  - Mark as taken.
  - Undo taken.
  - Delete medication.

## Acceptance Criteria
- App compiles.
- Existing behavior is preserved.
- Folder structure is ready for services, database, hooks, and utilities.
- No persistence or notification dependency is added yet.
