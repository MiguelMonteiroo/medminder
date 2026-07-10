# 06 - Android Release Signing

## Goal
Produce a real signed Android release build suitable for Google Play internal testing and production promotion.

## Current Context
The Android project exists under `android/`. Current Gradle config has `applicationId "com.medminder"`, `versionCode 1`, `versionName "1.0"`, `targetSdkVersion 36`, and `ndkVersion "28.0.12433566"`. The release build currently signs with the debug keystore, which is not acceptable for production distribution.

## Design System Requirements
This step is mostly native build work. It must not alter app UI unless required for release metadata. If splash, icon, or launch assets are touched, they must match the current "Home Care Cards" brand direction:
- Warm, calm, personal care feel.
- Green/sage primary identity.
- No unrelated visual language.
- No heavy gradients or noisy artwork.

## Implementation Steps
1. Decide final Android package ID:
   - Keep `com.medminder` only if final.
   - If changing it, do it before first Play release.
2. Create production keystore:
   - Generate a release keystore with `keytool`.
   - Store it outside Git or in a secure local/secrets location.
   - Record location privately, not in committed docs.
3. Configure Gradle signing:
   - Remove debug signing from release.
   - Read keystore path, alias, and passwords from local Gradle properties or environment variables.
   - Ensure sensitive values are ignored by Git.
4. Versioning:
   - Confirm `versionCode` starts at `1` for first release.
   - Confirm `versionName` is stable, for example `1.0.0`.
   - Document rule: every Play upload needs a higher `versionCode`.
5. Build release:
   - Run clean build.
   - Produce APK for local install smoke test.
   - Produce AAB for Google Play.
6. 16 KB compatibility:
   - Keep NDK r28+.
   - Validate native libraries in release artifact.
   - Use `zipalign` or Android Studio APK Analyzer where available.
7. Release smoke test:
   - Install release APK on a real Android device.
   - Confirm app opens without Metro.
   - Confirm SQLite initializes.
   - Confirm notifications work in release mode.
8. Secret hygiene:
   - Confirm keystore and local signing files are not staged.
   - Confirm `.gitignore` covers local signing artifacts.

## Acceptance Criteria
- Release no longer uses debug signing.
- Signed release APK installs on a real device.
- Signed release AAB is generated successfully.
- `versionCode`, `versionName`, package ID, target SDK, and NDK are confirmed.
- 16 KB compatibility is checked for release artifact.
- No signing secrets are committed.
- App release build passes smoke test.

## Test Plan
- Commands:
  - `npm.cmd run typecheck`
  - `npm.cmd test -- --runInBand`
  - `cd android && .\gradlew.bat clean`
  - `cd android && .\gradlew.bat assembleRelease`
  - `cd android && .\gradlew.bat bundleRelease`
- Manual:
  - Install release APK with `adb install`.
  - Launch app without Metro running.
  - Add medication.
  - Restart app.
  - Verify data persists.
  - Trigger local notification flow.
  - Verify no debug/dev-only UI appears.

## Notes
- Losing the signing key can block future app updates if Play App Signing is not configured appropriately.
- Do not commit keystore files or passwords.
- This roadmap assumes React Native CLI release builds, not Expo/EAS.
