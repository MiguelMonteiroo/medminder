# Use a dedicated React Native dose alarm screen

MedMinder will register a lightweight React Native `DoseAlarmScreen` as a separate Notifee full-screen component instead of building a parallel alarm UI in Kotlin. Android owns notification delivery and starts alarm sound without waiting for React rendering, while the dedicated component reuses the Home Care Cards design system and notification actions remain available through an early background event handler.
