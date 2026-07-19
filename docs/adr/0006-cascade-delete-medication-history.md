# Cascade-delete local medication history

## Status

Accepted for the MVP.

## Context

Remedin is offline-first and has no backend identity that could preserve a meaningful medication record after its local medication and schedule are deleted. Keeping dose logs or reminder artifacts without their owners would create incomplete History entries and complicate notification recovery.

## Decision

Deleting a medication permanently deletes its schedules, dose logs, legacy notification mappings, and reminder artifacts through SQLite foreign-key cascades. Future reminder notifications are canceled before the medication row is removed. Editing a medication preserves its primary schedule row whenever one already exists, so ordinary edits do not erase dose history.

## Consequences

- Home, History, and notification reconciliation never receive orphan records.
- Deletion remains destructive and must continue to require confirmation in the UI.
- A future archive feature will require a separate product decision and migration instead of changing this behavior silently.
