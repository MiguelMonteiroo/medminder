# Use a required local-profile onboarding before the main app

## Status

Accepted for the MVP.

## Context

MedMinder currently supplies `Maria` as a sample profile name and presents reminder setup only after a medication exists. This can show a false identity on Home, delays the explanation of an important feature, and separates dependent Android permissions from the context that makes them understandable.

MedMinder has no account or backend. The person's name is only local personalization, while notification, exact-alarm, and full-screen capabilities remain independent Android permissions.

## Decision

A fresh installation shows a full-screen onboarding before the main tabs. It uses the existing Home Care Cards design and follows this order:

1. welcome and local-data introduction;
2. required local-profile name;
3. one-screen guide to medication setup, today's dose actions, and History;
4. basic notification permission;
5. exact-alarm access when notifications are enabled;
6. optional full-screen alarm access when notifications are enabled.

The local-profile name starts empty and cannot be skipped. Reminder permissions may be deferred. Deferring basic notifications requires an explicit confirmation because pre-alerts and dose alarms will not work. Once confirmed, onboarding finishes and advanced reminder setup remains available in Profile.

Onboarding completion is persisted separately from every permission or reminder preference. Denying or later revoking a permission does not reopen onboarding.

## Consequences

- Home never needs a fabricated profile name.
- Permission requests have product context and follow dependency order.
- The app remains usable without reminder permissions.
- Profile must expose the same reminder setup for deferred or revoked permissions.
- App startup must wait for persisted settings before choosing between onboarding and the main tabs.
- The pre-release project does not require legacy onboarding migration behavior; development installs can be reset or reinstalled.
