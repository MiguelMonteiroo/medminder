# 05 - Privacy, Legal, And Store Policy

## Goal
Prepare MedMinder's privacy, medical disclaimer, and Google Play policy materials so the app can be submitted honestly and consistently.

## Current Context
MedMinder stores medication names, dosages, schedules, profile name, dose logs, notification mappings, and settings locally on the user's device. The MVP has no backend, login, sync, analytics, ads, or third-party data sharing. Because the app relates to medication reminders, the store copy and in-app language must avoid medical advice claims.

## Design System Requirements
- In-app privacy/disclaimer UI must use the current design system.
- Use `AppCard`, `AppText`, `AppButton`, `StatusBadge`, and theme tokens.
- Keep disclaimer copy concise and calm.
- Do not create a legal-looking page that visually clashes with the app.
- Keep Portuguese UI copy.
- Present external privacy links with clear buttons or rows matching Profile/Settings style.

## Implementation Steps
1. Add medical responsibility copy in app:
   - MedMinder is a personal reminder tool.
   - It does not replace medical, pharmaceutical, or caregiver guidance.
   - Users should consult a qualified professional before changing medication use.
2. Place disclaimer where users can find it:
   - Prefer Profile/Settings under `Sobre`, `Privacidade`, or similar.
   - If onboarding is added later, show a brief version there too.
3. Prepare privacy policy content:
   - App name: MedMinder.
   - Developer/contact email.
   - Local data stored: medication name, dosage, schedule, notes, dose logs, profile name, notification mappings.
   - Data not collected by developer: no account, no backend, no analytics, no ads, no sale/sharing.
   - Notifications: local device notifications only.
   - Retention: data stays until deleted in app or app uninstalled.
   - Deletion: user can delete medications; uninstall removes local app data.
   - Security: data is stored on the device using app-local storage.
4. Publish privacy policy:
   - Public URL.
   - Not a PDF.
   - Not geofenced.
   - Stable enough for Google Play.
5. Prepare Google Play Data Safety answers:
   - Keep policy and Data Safety consistent.
   - If no data leaves the device, do not claim server collection.
   - Disclose user-entered health-related local data accurately according to Play Console categories.
6. Review permissions:
   - Decide whether `INTERNET` is needed.
   - Describe notification/exact alarm permissions only as needed for reminders.
7. Review store claims:
   - Avoid guarantees and medical claims.
   - Prefer `ajuda a organizar lembretes` and `acompanhar doses do dia`.

## Acceptance Criteria
- App contains accessible privacy/disclaimer information.
- Public privacy policy URL exists and matches app behavior.
- Google Play Data Safety can be filled without guessing.
- Store listing, privacy policy, permissions, and in-app text do not contradict each other.
- No medical advice or dose-calculation claims are present.
- UI for privacy/disclaimer respects the design system.

## Test Plan
- Manual:
  - Open Profile/Settings and find privacy/disclaimer information.
  - Read copy for clarity and non-medical-advice positioning.
  - Confirm external privacy URL opens.
  - Compare privacy policy against permissions and app behavior.
- Store prep:
  - Dry-fill Play Console Data Safety using the policy.
  - Verify support email is correct.
- Commands:
  - `npm.cmd run typecheck`
  - `npm.cmd test -- --runInBand`

## Notes
- This is product/legal preparation, not legal advice.
- If analytics, crash reporting, or backend sync are added later, privacy policy and Data Safety must be updated.
