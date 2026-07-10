# 08 - Internal Testing And QA

## Goal
Validate MedMinder through Google Play internal or closed testing before production. The build downloaded from Play must behave like or better than local release builds.

## Current Context
The app has automated unit tests for core logic, but production readiness depends heavily on real-device QA because notifications, SQLite persistence, Android permissions, and release signing can behave differently outside debug builds.

## Design System Requirements
QA must include visual consistency checks:
- No screen should break the "Home Care Cards" direction.
- Headers, cards, buttons, badges, and empty states should look consistent.
- No new screen should feel like an unstyled native/default form.
- Screenshots from QA should be suitable candidates for Play listing after test data is cleaned up.

## Implementation Steps
1. Prepare test build:
   - Use a signed release AAB uploaded to Google Play internal testing.
   - Add tester accounts.
   - Install from Play, not only through adb.
2. Prepare test data:
   - Use realistic Portuguese medication examples.
   - Include medication with dosage.
   - Include medication without dosage.
   - Include daily, interval, and weekday schedules.
3. Core flow QA:
   - Fresh install.
   - Add medication.
   - Edit medication.
   - Remove medication.
   - Pause/resume medication.
   - Mark dose as taken.
   - Undo taken dose.
   - Skip dose.
   - Snooze dose.
   - View detail.
   - View medication list.
   - View history.
   - Edit profile name.
4. Persistence QA:
   - Close app.
   - Reopen app.
   - Restart device if feasible.
   - Confirm medications, settings, and logs persist.
5. Notification QA:
   - Deny notification permission and confirm app remains usable.
   - Grant notification permission and receive a reminder.
   - Pause medication and confirm reminder cancellation.
   - Delete medication and confirm reminder cancellation.
   - Snooze dose and confirm delayed reminder.
6. Visual/accessibility QA:
   - Test small Android screen.
   - Test large font setting.
   - Test TalkBack basics for Home, Add/Edit, Detail, and Profile.
   - Confirm text does not overlap or clip.
7. Record issues:
   - Use a simple issue list with severity.
   - Block production for crashes, data loss, notification failure, release install failure, or placeholder MVP flow.

## Acceptance Criteria
- Internal Play build installs successfully.
- No crash in mandatory MVP flows.
- Data persists across app restart.
- Notifications work in the internal Play build.
- Visual QA passes against the current design system.
- No release-blocking placeholder remains.
- All high-severity issues are fixed or explicitly deferred with rationale.

## Test Plan
- Commands before upload:
  - `npm.cmd run typecheck`
  - `npm.cmd test -- --runInBand`
  - `cd android && .\gradlew.bat clean bundleRelease`
- Manual checklist:
  - Fresh install.
  - Restart.
  - Add/edit/delete.
  - Take/undo/skip/snooze.
  - Pause/resume.
  - Receive notification.
  - Cancel notification through pause/delete.
  - Edit profile name.
  - Validate history.
  - Validate small screen and large font.

## Notes
- Internal testing is not optional because reminders are a core feature.
- Keep test medication data realistic but not personally sensitive.
- Test on at least one real Android device before production.
