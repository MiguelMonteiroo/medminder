# 09 - Testing And Quality

## Goal
Add a rigorous quality layer before production release.

## Tooling
Add test tooling appropriate for Expo React Native:
- TypeScript check.
- Unit test runner.
- React Native component testing library.
- Optional E2E later if setup cost is acceptable.

Do not add tooling that rewrites large parts of the app unless required.

## Automated Tests
Cover:
- Validation utilities.
- Schedule recurrence generation.
- Dose occurrence generation.
- Dose status resolution from logs.
- Adherence stats.
- Repository adapters where practical.
- Form validation states.
- Summary display states.
- Card action callbacks.

## Manual Android QA Checklist
Verify:
- Fresh install.
- App restart.
- Add/edit/delete medication.
- Daily fixed reminders.
- Every-N-hours reminders.
- Weekday reminders.
- Pause/resume.
- Snooze.
- Notification denied flow.
- Notification granted flow.
- Delete medication cancels reminders.
- Data remains offline and local.

## Commands
Expected checks:

```bash
npx tsc --noEmit
npm test
```

Add scripts to `package.json` once test tooling is installed.

## Acceptance Criteria
- Core domain logic has automated tests.
- Main component states have component tests where practical.
- Manual Android QA checklist passes.
- TypeScript check passes.
