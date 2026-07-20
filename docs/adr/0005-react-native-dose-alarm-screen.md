# Use a dedicated React Native dose alarm screen

## Status

Superseded by ADR 0012.

Remedin will register a lightweight React Native `DoseAlarmScreen` as `RemedinDoseAlarm` instead of building a parallel alarm UI in Kotlin. A dedicated native `DoseAlarmActivity` hosts that component for notification presses and full-screen intents; `MainActivity` remains the ordinary app and never appears over the lockscreen. Android owns notification delivery and starts alarm sound without waiting for React rendering, while the React component reuses the Home Care Cards design system and notification actions remain available through an early background event handler.
