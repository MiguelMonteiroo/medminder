# 01 - Edit Medication Flow

## Goal
Replace the edit placeholder with a real medication editing flow that updates medication identity, schedule, notes, persistence, dose generation, and future notifications.

## Current Context
The medication detail screen exposes an `Editar` action. The current app already has an add medication flow with guided accordion steps and a wheel time picker. Repositories exist for medications and schedules, and app-level services expose state/actions through `useAppData`.

The MVP cannot ship with edit as a placeholder because users need to correct schedule, dosage, name, and notes without deleting and recreating medications.

## Design System Requirements
- Reuse the visual structure of Add Medication.
- Do not create a generic or visually divergent form.
- Use the existing accordion step pattern, warm surfaces, sage buttons, peach highlights, and 8px cards.
- Reuse `WheelTimePicker` for time selection.
- Use existing field labels, buttons, spacing, and validation styling.
- Header/back behavior must match current custom headers.
- UI copy must remain Portuguese.
- Suggested primary button copy: `Salvar alterações`.

## Implementation Steps
1. Extend navigation:
   - Add a route such as `EditMedication: { medicationId: string }`.
   - Make `Editar` in `MedicationDetailScreen` navigate to this route.
2. Reuse form behavior:
   - Prefer a shared form component or shared form helper used by Add and Edit.
   - Preserve current Add Medication behavior.
   - Avoid broad rewrites outside the form flow.
3. Pre-fill edit state:
   - Medication name.
   - Dosage.
   - Notes.
   - First/current schedule kind.
   - First/current schedule time.
   - Interval hours.
   - Weekday selections.
4. Add app-level service method:
   - Add an intent-level method such as `updateMedicationWithSchedule`.
   - Screens should call this app service, not repositories directly.
5. Update persistence:
   - Update the existing medication row.
   - Update the existing primary schedule row where possible.
   - Do not create duplicate active schedules for a medication unless multi-schedule support is intentionally implemented.
6. Reschedule reminders:
   - Cancel existing future notifications for the medication.
   - Save medication and schedule changes.
   - Recreate future notifications if permission is granted and the medication is active.
   - Remove stale notification mappings.
7. Preserve history:
   - Existing dose logs remain historical records.
   - Future generated occurrences reflect the edited schedule.
8. UX behavior:
   - Back/cancel should leave data unchanged.
   - Save should validate using the same rules as Add.
   - Inline validation should appear inside the same design language.
9. Post-save behavior:
   - Return to detail or previous screen.
   - Updated values must be visible immediately in Home, Detail, and Medications.

## Acceptance Criteria
- Tapping `Editar` opens a real edit screen.
- Edit screen is pre-filled with selected medication data.
- User can edit name, dosage, schedule kind, time, interval, weekdays, and notes.
- Saving updates SQLite.
- Home, Detail, Medications, and future dose generation update after save.
- Future notifications are canceled and recreated from the edited schedule.
- Historical logs remain readable.
- No edit placeholder remains in MVP flows.
- Edit UI looks like part of the current app.

## Test Plan
- Automated:
  - Add/update service tests where practical.
  - Validation tests for edit inputs.
  - Existing dose engine tests continue passing.
- Manual Android QA:
  - Add a medication, edit name, confirm all screens update.
  - Edit dosage, confirm display updates.
  - Edit daily time, restart app, confirm persistence.
  - Edit interval schedule, confirm dose generation changes.
  - Edit weekday schedule, confirm selected-day behavior.
  - Enable notifications, edit schedule, confirm old reminders do not fire and new reminder does.
  - Attempt invalid empty name and confirm inline error.
  - Press back without saving and confirm no changes persist.
- Commands:
  - `npm.cmd run typecheck`
  - `npm.cmd test -- --runInBand`

## Notes
- MVP can edit the first/current schedule only.
- Multi-schedule editing is deferred unless already implemented deliberately.
- Do not add medical dosage recommendations.
