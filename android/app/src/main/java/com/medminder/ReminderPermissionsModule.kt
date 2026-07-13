package com.medminder

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
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

  @ReactMethod
  fun canUseFullScreenIntent(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      promise.resolve(true)
      return
    }

    val manager =
        reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE)
            as NotificationManager
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
  fun finishCurrentActivity(promise: Promise) {
    reactApplicationContext.currentActivity?.finish()
    promise.resolve(null)
  }
}
