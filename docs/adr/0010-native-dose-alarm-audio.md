# Use native foreground-service audio for dose alarms

MedMinder will schedule a native Android foreground service alongside each exact dose alarm. The service plays the alarm resource through `MediaPlayer` with `AudioAttributes.USAGE_ALARM`, keeps a short partial wake lock, and stops after the alarm action or a maximum of 60 seconds.

When native playback is scheduled successfully, the visible Notifee alarm uses a high-importance silent channel. This prevents duplicate sound while preserving full-screen intent, lock-screen actions, vibration, and notification-policy behavior. If exact-alarm access or the native module is unavailable, MedMinder falls back to the existing sounding notification channel.

This decision improves behavior on Android variants such as Xiaomi MIUI/HyperOS, where direct application alarm audio may remain audible when the user allows media during silent or Do Not Disturb modes. It does not promise bypass of Android Total Silence or manufacturer policies. The user and operating system retain final control over audible output.

The service uses the Android `systemExempted` foreground-service type because it is started by an app holding `SCHEDULE_EXACT_ALARM` to continue a user-requested alarm. This foreground-service type and its user-visible behavior must be declared in Google Play Console before release.
