# ADR 0002 - Local Design System Theme

## Status
Accepted

## Decision
Use a local StyleSheet-based design system with theme tokens and small base components before adopting an external UI kit.

## Context
MedMinder needs a friendly, consistent experience but does not yet need the surface area or constraints of a full UI library.

## Consequences
- Colors, spacing, radii, shadows, and typography are centralized.
- Screens use shared primitives such as AppText, AppButton, AppCard, Screen, StatusBadge, EmptyState, and SectionHeader.
- The app remains easy to customize as the product language evolves.
