# Calculate adherence per local day and dose occurrence

## Status

Accepted for the MVP.

## Context

History currently passes all dose logs to an adherence calculation while using only today's expected-dose count as the denominator. That mixes date scopes and can produce an incorrect percentage. It also renders seven raw dates without a meaningful daily result.

Medication-level completion is not sufficient because one medication can produce multiple dose occurrences in a day.

## Decision

Daily adherence is calculated from dose occurrences scheduled for one local calendar day. For each expected occurrence, only its latest recorded action is considered. A taken action increases adherence; skipped, snoozed, pending, undone, and unrecorded outcomes do not.

The denominator is the number of expected occurrences for that same day. A day with no scheduled occurrences has no adherence percentage and is displayed as `Sem doses programadas`.

History displays seven continuous local-calendar days with localized labels and keeps days without doses visible.

## Consequences

- Today's summary cannot be affected by older logs.
- Skipping a dose resolves its pending state but does not improve adherence.
- Daily history requires generating expected occurrences for each displayed date.
- Date grouping and labels must use local-calendar boundaries rather than slicing UTC timestamps.
- Pure daily-summary logic can be tested independently from React components.
