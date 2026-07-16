package com.medminder

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ReminderPermissionsModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "ReminderPermissions"

  private fun notificationManager(): NotificationManager =
      reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE)
          as NotificationManager

  @ReactMethod
  fun canUseFullScreenIntent(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      promise.resolve(true)
      return
    }

    val manager = notificationManager()
    promise.resolve(manager.canUseFullScreenIntent())
  }

  @ReactMethod
  fun openFullScreenIntentSettings(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        val intent =
            Intent(
                    Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                    Uri.parse("package:${reactApplicationContext.packageName}"),
                )
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
      }
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("full-screen-settings", error)
    }
  }

  @ReactMethod
  fun isNotificationPolicyAccessGranted(promise: Promise) {
    promise.resolve(notificationManager().isNotificationPolicyAccessGranted)
  }

  @ReactMethod
  fun openNotificationPolicySettings(promise: Promise) {
    try {
      val intent =
          Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS)
              .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactApplicationContext.startActivity(intent)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("notification-policy-settings", error)
    }
  }

  @ReactMethod
  fun ensureAlarmChannels(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val manager = notificationManager()
        manager.createNotificationChannel(
            createAlarmChannel(
                id = NORMAL_ALARM_CHANNEL_ID,
                name = "Alarmes de dose",
                description = "Alarmes no horário dos medicamentos.",
                bypassDoNotDisturb = false,
            ),
        )

        if (manager.isNotificationPolicyAccessGranted) {
          manager.createNotificationChannel(
              createAlarmChannel(
                  id = CRITICAL_ALARM_CHANNEL_ID,
                  name = "Alarmes críticos de dose",
                  description =
                      "Alarmes autorizados a tocar no silencioso e Não Perturbe.",
                  bypassDoNotDisturb = true,
              ),
          )
        }
      }
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("alarm-channels", error)
    }
  }

  private fun createAlarmChannel(
      id: String,
      name: String,
      description: String,
      bypassDoNotDisturb: Boolean,
  ): NotificationChannel {
    val soundUri =
        Uri.parse(
            "${ContentResolver.SCHEME_ANDROID_RESOURCE}://${reactApplicationContext.packageName}/${R.raw.medminder_alarm}",
        )
    val audioAttributes =
        AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(AudioAttributes.USAGE_ALARM)
            .build()

    return NotificationChannel(id, name, NotificationManager.IMPORTANCE_HIGH).apply {
      this.description = description
      enableVibration(true)
      vibrationPattern = longArrayOf(300L, 450L, 300L, 450L)
      setSound(soundUri, audioAttributes)
      if (bypassDoNotDisturb) setBypassDnd(true)
    }
  }

  @ReactMethod
  fun finishCurrentActivity(promise: Promise) {
    reactApplicationContext.currentActivity?.finish()
    promise.resolve(null)
  }

  private companion object {
    const val NORMAL_ALARM_CHANNEL_ID = "medication-dose-alarms-v2"
    const val CRITICAL_ALARM_CHANNEL_ID =
        "medication-dose-alarms-critical-v2"
  }
}
