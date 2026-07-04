# 08 - Accessibility And Polish

## Goal
Make the Android-first experience production-quality for small screens, errors, loading states, and basic accessibility.

## Language
Choose one display language for v1 and apply it consistently.

Recommended default: Portuguese, because the current UI strings are mostly Portuguese.

If English is chosen instead, translate all user-facing strings in one pass.

## Accessibility
Add:
- `accessibilityLabel` for icon-only or action buttons.
- `accessibilityHint` where action consequences are not obvious.
- Proper button roles where needed.
- Readable touch target sizes.
- Text contrast review for status colors.

## Layout Polish
Add:
- Safe-area handling.
- Small-screen Android validation.
- Empty states for no medications, no pending doses, no history, and denied notifications.
- Loading states for database initialization.
- Error states for database or notification failures.
- Confirmation before destructive delete.

## Design Cleanup
- Keep cards at 8px border radius or less.
- Avoid nested cards.
- Keep operational UI dense and scannable.
- Use clear hierarchy: summary, pending doses, completed doses, actions.

## Test Plan
- Manual QA on small Android screen.
- Manual QA with larger font size.
- Screen reader smoke test for main flows.
- Verify text does not overlap or overflow.

## Acceptance Criteria
- Main flows are usable on small Android screens.
- Basic screen reader labels exist for key actions.
- Empty, loading, and error states are intentional.
- UI strings are consistent in one language.
