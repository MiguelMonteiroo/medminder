# 04 - UI Polish And Accessibility

## Goal
Bring the Android experience to MVP quality by making screens consistent, accessible enough for release, usable on small devices, and free of placeholder or broken states.

## Current Context
The app has a local "Home Care Cards" design system, bottom tabs, custom headers, warm card styling, lucide icons, and several Care components. Recent work improved detail headers, registered dose rows, pending states, and the Add Medication wheel time picker. This step should polish, not redesign.

## Design System Requirements
This step is the visual guardrail for the MVP.

Requirements:
- Preserve `src/theme/*` tokens.
- Preserve cream background, sage/dark green primary, peach accent, and status colors.
- Keep cards at max 8px radius.
- Prefer subtle borders and spacing over shadow.
- Avoid nested cards.
- Avoid gradients and decorative blobs.
- Use lucide icons for actions.
- Keep text in Portuguese.
- Use existing `AppText`, `AppButton`, `AppCard`, `IconButton`, `StatusBadge`, `EmptyState`, `Screen`, and Care components.

## Implementation Steps
1. Header consistency:
   - Review stack screens with back arrows.
   - Ensure screens do not show both native header and custom header.
   - Ensure custom back buttons use consistent size, color, and placement.
2. Home polish:
   - Pending section looks positive when no pending doses exist.
   - Next dose card hides when no future pending/snoozed dose exists for the day.
   - Summary copy reflects taken, pending, skipped, and completed states.
   - Registered rows show medication name and dosage on the title line.
3. Medication list polish:
   - List items are tappable and accessible.
   - Empty state guides user to add first medication.
   - Status badges do not rely only on color.
4. Add/Edit polish:
   - Wheel time picker aligns hour, colon, and minute.
   - Validation is inline and clear.
   - Step icons remain legible.
   - Buttons do not wrap awkwardly on small screens.
5. Detail polish:
   - Header shows only title and back action.
   - Edit action lives inside the green hero card.
   - Delete remains visually destructive and separated.
6. History polish:
   - Empty history is intentional.
   - Rows use readable dates, times, and status badges.
7. Profile/settings polish:
   - Notification permission state is clear.
   - Profile name editing is obvious and stable.
   - Privacy/disclaimer content matches the visual language.
8. Accessibility:
   - Add `accessibilityRole="button"` to pressable actions.
   - Add labels for icon-only buttons.
   - Add hints for destructive and dose-changing actions.
   - Ensure touch targets are around 44px minimum.
   - Ensure color is not the only status indicator.
9. Responsive QA:
   - Test small Android screens.
   - Test larger Android font size.
   - Fix text overflow with wrapping or controlled font fitting.

## Acceptance Criteria
- No main screen visually diverges from "Home Care Cards".
- No native/custom duplicate headers remain.
- Main actions are reachable and visually clear on small Android screens.
- Icon-only controls have labels.
- Destructive actions have confirmation and clear copy.
- Empty/loading/error states are intentional.
- Portuguese UI is consistent.
- No new UI kit or visual language is introduced.

## Test Plan
- Manual visual QA:
  - Home empty.
  - Home with pending, taken, skipped, and no-pending states.
  - Add medication on a small screen.
  - Edit medication on a small screen.
  - Detail screen with active and paused medication.
  - History with and without records.
  - Profile with notification denied/granted states.
- Accessibility smoke:
  - TalkBack focus order on Home, Add/Edit, Detail, and Profile.
  - Icon-only buttons announce meaningful labels.
  - Destructive actions announce intent.
- Commands:
  - `npm.cmd run typecheck`
  - `npm.cmd test -- --runInBand`

## Notes
- This is not a redesign step.
- Any screenshot generation for Play Store should happen after this step passes.
