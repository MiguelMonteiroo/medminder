# Use opt-in critical channels for dose alarms

Remedin will offer `Tocar no silencioso e Não Perturbe` as a separate, optional preference. When both the preference and Android notification-policy access are active, future dose alarms use the versioned `medication-dose-alarms-critical-v2` channel with `AudioAttributes.USAGE_ALARM` and `setBypassDnd(true)`. Otherwise they use `medication-dose-alarms-v2`.

The app does not change the device's global Do Not Disturb mode. Android and the user retain final control over channel sound, volume, importance, and DND exceptions. Revoking access causes future reminders to be reconciled back to the normal channel.

This access is introduced after the basic notification permission in onboarding and appears immediately after it in Profile. Refusing it never blocks medication management or normal reminders.
