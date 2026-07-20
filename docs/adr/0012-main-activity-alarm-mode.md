# Open the main application in alarm mode

## Status

Accepted. Supersedes ADR 0005.

## Context

The dedicated `DoseAlarmActivity` rendered a separate React root and task. Although it reused Remedin components, it did not open the complete application and required a second payload lifecycle. Users expect the alarm to open Remedin itself and to remain in the app after acting.

## Decision

Alarm full-screen and content intents target `MainActivity`. An alarm intent temporarily enables lock-screen, screen-on, keep-awake, immersive and alarm-volume behavior. Normal launches never enable these flags, and finishing the alarm removes all of them.

For alarms started while the keyguard is active or the screen is off, the foreground service registers a temporary `ACTION_USER_PRESENT` receiver. If an OEM does not keep the alarm task in front, the receiver promotes the existing Remedin task immediately after unlock or starts `MainActivity` with the still-active payload. The receiver is unregistered on every terminal alarm path.

Cold starts pass `initialAlarmPayload` to the main `Remedin` component. Existing processes receive the same payload through a native event, backed by a consumable pending payload so React startup and lifecycle transitions cannot lose it. The alarm screen renders before database providers during a cold start. After taking, snoozing, ending a test or timing out, the app resets to `MainTabs > Home`.

## Consequences

- Remedin has one Android task and one React application entry point.
- The ordinary app can appear over the lockscreen only while a native alarm is active.
- Native audio and the foreground notification remain independent of React startup.
- The app must clear alarm window flags on every stop, timeout and action path.
- Android 13+ may show a persistent heads-up instead of launching full screen while the device is already unlocked; Remedin does not request overlay access to bypass this platform behavior.
