# 09 - Production Launch Checklist

## Goal
Provide the final go/no-go checklist for promoting MedMinder from internal or closed testing to Google Play production.

## Current Context
By this stage, product scope, edit flow, notifications, data integrity, UI polish, privacy materials, release signing, store listing assets, and internal QA should be complete. This file should not introduce new feature work; it is the final release gate.

## Design System Requirements
Final launch review must confirm:
- All visible screens follow the current "Home Care Cards" design direction.
- Store screenshots match the real app.
- No placeholder or unpolished screen is reachable in production.
- Privacy/disclaimer UI looks integrated with the app.
- Any last-minute copy changes preserve Portuguese consistency.

## Implementation Steps
1. Code readiness:
   - Confirm no critical TODOs/placeholders remain.
   - Confirm edit flow is real.
   - Confirm notification flows are real.
   - Confirm profile/privacy/disclaimer areas are present.
2. Automated checks:
   - Run typecheck.
   - Run tests.
   - Build release AAB.
3. Release artifact checks:
   - Confirm correct package ID.
   - Confirm correct version code and version name.
   - Confirm release signing.
   - Confirm 16 KB compatibility.
   - Confirm Play upload accepts the AAB.
4. Manual QA:
   - Fresh install from Play internal testing.
   - App restart persistence.
   - Add/edit/delete medication.
   - Dose actions.
   - Notification permission denied/granted.
   - Reminder received.
   - Pause/delete cancellation.
   - UI small screen.
   - UI large font.
5. Store readiness:
   - Privacy policy URL live.
   - Data Safety completed consistently.
   - Description and screenshots complete.
   - Support email correct.
   - App category confirmed.
   - Content rating completed.
6. Risk review:
   - Known limitations documented.
   - No medical advice claims.
   - No unnecessary permissions without rationale.
   - Exact alarm permission decision documented if retained.
7. Rollback/recovery:
   - Keep final AAB artifact.
   - Record commit hash and version code.
   - Record known issues.
   - Know how to halt rollout in Play Console.
8. Launch:
   - Promote from internal/closed testing to production.
   - Use staged rollout if available and appropriate.
   - Monitor tester/user feedback manually after release.

## Acceptance Criteria
- Typecheck passes.
- Tests pass.
- Signed release AAB is accepted by Play Console.
- Internal Play build passes QA.
- Privacy policy and Data Safety are complete.
- Store listing has no placeholders.
- No MVP flow is fake or blocked.
- Design consistency is confirmed.
- The app is ready to promote to production.

## Test Plan
- Final commands:
  - `npm.cmd run typecheck`
  - `npm.cmd test -- --runInBand`
  - `cd android && .\gradlew.bat clean bundleRelease`
- Final device smoke:
  - Install from Play internal testing.
  - Add a medication scheduled soon.
  - Receive notification.
  - Mark taken.
  - Restart app.
  - Confirm dose/history persisted.
  - Delete medication.
  - Confirm no future reminder.

## Notes
- Do not promote to production directly from local-only testing.
- Production launch should be treated as a controlled rollout, not a finish line.
- Any post-launch feature additions must continue respecting the current design system unless a new design decision is explicitly made.
