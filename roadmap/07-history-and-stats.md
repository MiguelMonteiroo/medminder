# 07 - History And Stats

## Goal
Expose historical intake data and adherence stats based on `dose_logs`.

## Screens
Add or complete:
- Medication Detail/History screen.
- Daily history section.
- Stats overview section.

## History Behavior
Show:
- Taken doses.
- Skipped doses.
- Snoozed doses.
- Missed doses.
- Undo actions where relevant.

History must be generated from `dose_logs` and dose occurrences, not from medication-level state.

## Stats
Add:
- Today completion percentage.
- Last 7 days adherence.
- Per-medication adherence.
- Counts by status: taken, skipped, missed, snoozed.

## Data Flow
- Use services to query logs and compute stats.
- Keep stats computation pure where possible.
- Do not duplicate persisted summary values unless there is a clear performance reason.

## Test Plan
- Automated tests for adherence calculation.
- Manual QA:
  - Mark taken and see it in history.
  - Skip a dose and see it in history.
  - Snooze a dose and see it in history.
  - Review last 7 days after seeded test data.

## Acceptance Criteria
- User can see what was taken, skipped, snoozed, or missed.
- Stats match the underlying logs.
- Stats remain available after app restart.
