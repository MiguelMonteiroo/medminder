# 07 - Google Play Listing Assets

## Goal
Prepare all Google Play listing content and assets needed to submit MedMinder without placeholders, exaggerated claims, or inconsistent privacy messaging.

## Current Context
The app name is MedMinder. The MVP target is Google Play, Android only. The app is local-only, reminder-focused, and Portuguese-first. Store assets should show the real app after UI polish, not generated screens that no longer match implementation.

## Design System Requirements
Store visuals must reflect the real app and current design system:
- Use screenshots of actual app screens after polish.
- Show cream background, sage/dark green, peach accents, and card-based UI.
- Do not create marketing visuals that imply a different product.
- Avoid medical-device imagery, hospital claims, or clinical authority visuals.
- Feature graphics/icons should feel friendly, personal, and calm.
- Text in screenshots should be Portuguese and match the app.

## Implementation Steps
1. Listing identity:
   - App name: `MedMinder`.
   - Short description: concise reminder-focused line.
   - Full description: explain local medication reminders, daily overview, dose actions, history, and privacy.
2. Category decision:
   - Prefer `Saúde e fitness` if positioning is personal habit/reminder.
   - Use `Medicina` only if Play Console positioning and policy review are intentionally handled.
3. Screenshots:
   - Capture real Android screenshots from release or release-like build.
   - Minimum useful set:
     - Home with pending doses.
     - Add/Edit medication with wheel time picker.
     - Medication detail.
     - History.
     - Profile/settings with notification status.
   - Avoid screenshots containing unprofessional test names.
4. Icon:
   - Use final production launcher icon.
   - Ensure adaptive icon foreground/background look good on Android.
   - Match green/sage care identity.
5. Feature graphic:
   - Create only if required or useful.
   - Keep it aligned with app colors and avoid clutter.
6. Support information:
   - Add support email.
   - Add privacy policy URL.
   - Add developer name consistently with the privacy policy.
7. Claims review:
   - Remove claims like `never miss a dose` if not guaranteed.
   - Prefer `organize reminders`, `track today's doses`, and `keep a local history`.
8. Localization:
   - Prepare Brazilian Portuguese listing first.
   - English listing can be added later.

## Acceptance Criteria
- Play Console listing can be completed without placeholder text.
- Store descriptions accurately match the app.
- Screenshots are from the real UI and match the current design system.
- Privacy policy URL and support email are ready.
- Category is chosen deliberately.
- No medical advice, treatment, or guaranteed adherence claims are present.

## Test Plan
- Review listing copy against actual app flows.
- Compare screenshots against current build.
- Verify screenshots do not expose private or sloppy test data.
- Verify icon renders correctly on Android launcher.
- Verify privacy policy URL is public and opens on mobile.
- Ask at least one tester to read listing and summarize what the app does; confirm they do not infer medical advice.

## Notes
- Do not make final store assets before UI polish is complete.
- Keep source files for icons/graphics organized if created.
- Store assets may need multiple sizes; follow current Play Console upload requirements during implementation.
