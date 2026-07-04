# ADR 0003 - Portuguese-first, i18n-ready Copy

## Status
Accepted

## Decision
Use Portuguese for v1 and centralize important UI strings in `src/i18n/ptBR.ts`. Do not add a full i18n dependency yet.

## Context
The current app language is Portuguese, but some strings had encoding issues and inconsistent labels.

## Consequences
- User-facing text is corrected for v1.
- Future i18n work can replace the local object with a library without changing product language decisions.
- Implementation should avoid introducing new hard-coded English UI strings.
