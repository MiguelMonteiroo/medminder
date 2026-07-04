# 03 - UI And Navigation

## Goal
Introduce navigation and reshape the app into production screens before persistence and reminders increase complexity.

## Dependencies
Install navigation packages using Expo-compatible commands. Use SDK 54 docs and `npx expo install` for packages that are part of Expo's supported ecosystem.

Recommended navigation stack:
- React Navigation native stack.
- Safe area support.
- Screens support.

## Screens
Add these screens:
- Home/Daily Overview
  - Shows today's summary.
  - Shows pending and completed dose sections.
  - Links to add medication and settings.
- Add/Edit Medication
  - Controlled form for medication details and schedule.
  - Supports creating and editing.
- Medication Detail/History
  - Shows medication info, schedule, pause/resume, and intake history.
- Settings/Reminder Permissions
  - Shows notification permission status and reminder defaults.

## Form Behavior
- Keep all inputs controlled.
- Show inline validation errors.
- Replace free-text time entry with a safer time input when the dependency is added.
- Support schedule kind selection:
  - Daily fixed times.
  - Every N hours.
  - Selected weekdays.
- Support optional end date and default snooze minutes.

## Data Flow
- Screens should call service-like functions or callbacks.
- Components should receive view-model props.
- Avoid direct database access from screen components; database integration comes in step 04.

## Test Plan
- Manual Android QA:
  - Navigate between all screens.
  - Create medication.
  - Edit medication.
  - Pause/resume medication.
  - Return to Home and see updated state.
- Run TypeScript check.

## Acceptance Criteria
- App has a clear multi-screen structure.
- User can create, edit, remove, pause, resume, and inspect medication details.
- UI is ready to connect to SQLite without another major component split.
