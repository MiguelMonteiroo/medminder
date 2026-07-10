# 00 - MVP Release Scope

## Goal
Define the exact release scope for the MedMinder MVP intended for Google Play. This document is the gatekeeper for all part 2 work: if a task is not required to make the Android MVP trustworthy, polished, and publishable, it should be deferred.

## Current Context
MedMinder is a React Native Android-first medication reminder app. It already has local SQLite persistence, local notification services, dose actions, history, profile editing, tab navigation, and the "Home Care Cards" visual direction.

The target is an Android MVP for Google Play, first through internal or closed testing and then production. The MVP does not include iOS, backend sync, user accounts, analytics, ads, caregiver sharing, Health Connect, or medication lookup.

The app must be positioned as a personal reminder tool. It must not claim to diagnose, treat, verify prescriptions, calculate dosages, or replace medical guidance.

## Design System Requirements
The current design system is a product constraint, not a suggestion.

All new MVP work must:
- Use theme tokens from `src/theme/*`.
- Reuse base components from `src/components/ui/*` and Care components where possible.
- Preserve the warm cream background, dark green/sage primary colors, peach accent, muted borders, and clear status colors.
- Keep cards at 8px radius or less.
- Prefer spacing and subtle borders over heavy shadows.
- Use `lucide-react-native` icons for user actions.
- Keep UI copy in Portuguese.
- Avoid gradients, decorative blobs, nested cards, heavy shadows, and visually unrelated screens.
- Ensure empty, loading, permission, and error states look native to the current app.

## Implementation Steps
1. Treat these as mandatory MVP flows:
   - Add medication.
   - Edit medication.
   - Remove medication.
   - Pause and resume medication.
   - Mark dose as taken.
   - Undo a taken dose.
   - Skip a dose.
   - Snooze a dose.
   - View daily pending and completed doses.
   - View registered medications.
   - View medication detail.
   - View recent/history records.
   - Edit profile name.
   - Enable, deny, and understand notification permission.
2. Remove or complete all user-visible placeholders in mandatory flows.
3. Keep deferred scope explicit:
   - No accounts.
   - No backend.
   - No cloud backup.
   - No iOS/App Store release.
   - No medication database lookup.
   - No dose calculators.
   - No Health Connect.
   - No analytics or crash reporting unless a later privacy decision explicitly adds them.
4. Keep release language careful:
   - The app helps organize reminders.
   - The app does not replace a doctor, pharmacist, or caregiver.
   - The app does not decide whether medication should be taken.
5. Use this scope to reject feature creep during implementation.

## Acceptance Criteria
- Every mandatory MVP flow is implemented or has a dedicated part 2 roadmap step.
- No mandatory MVP flow depends on placeholder alerts or fake actions.
- Deferred items are not introduced partially.
- The app can be described honestly in Google Play without overstating medical value.
- New UI introduced by later steps respects the existing design system.

## Test Plan
- Search for placeholder strings such as `próxima etapa`, `coming soon`, `TODO`, and fake edit actions.
- Manually review every tab and stack screen.
- Run:
  - `npm.cmd run typecheck`
  - `npm.cmd test -- --runInBand`
- Perform a quick MVP walkthrough on Android:
  - Add medication.
  - Take dose.
  - Skip dose.
  - Snooze dose.
  - Pause/resume.
  - Delete medication.
  - Restart app and verify state persists.

## Notes
- This is an Android MVP release plan, not the full long-term product roadmap.
- Google Play production should happen only after internal or closed testing passes.
- Future health-data integrations need separate privacy and policy review.
