# 10 - Android Production Release

## Goal
Prepare and produce an Android production build for MedMinder.

## App Configuration
Update `app.json`:
- Confirm app name: `MedMinder`.
- Set Android package identifier, for example `com.miguel.medminder`.
- Confirm icon and splash assets.
- Confirm orientation and edge-to-edge behavior.
- Add permissions/config required by notifications.

## EAS Setup
Install/configure EAS CLI as needed.

Create `eas.json` with profiles:
- `development`
- `preview`
- `production`

Use Android-first profiles:
- Preview APK for direct device testing.
- Production AAB for Google Play readiness.

## Build Flow
Use EAS Build for Android:

```bash
eas build --platform android --profile preview
eas build --platform android --profile production
```

EAS Build is Expo's hosted service for producing installable app binaries and can manage signing credentials.

## Release Readiness
Before production build:
- TypeScript check passes.
- Automated tests pass.
- Android manual QA passes.
- Fresh install smoke test passes.
- Restart persistence test passes.
- Notification scheduling test passes.
- Delete/pause notification cancellation test passes.

## Distribution
Initial distribution:
- Internal Android build first.

Later distribution:
- Google Play Store submission after store assets, privacy policy, screenshots, and listing copy are ready.

## Acceptance Criteria
- Installable Android build exists.
- Production build passes smoke test on a real Android device.
- Release checklist is documented and reproducible.
