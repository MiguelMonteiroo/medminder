package com.medminder

import android.media.AudioManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class DoseAlarmActivity : ReactActivity() {

  private val timeoutHandler = Handler(Looper.getMainLooper())
  private val timeoutAction = Runnable { finish() }

  override fun getMainComponentName(): String = "MedMinderDoseAlarm"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
        override fun getLaunchOptions(): Bundle? = buildLaunchOptions()
      }

  override fun onCreate(savedInstanceState: Bundle?) {
    configureWindowForAlarm()
    super.onCreate(savedInstanceState)
    configureWindowForAlarm()
    hideSystemBars()
    startAlarmTimeout()
  }

  private fun configureWindowForAlarm() {
    @Suppress("DEPRECATION")
    window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON,
    )

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    }

    volumeControlStream = AudioManager.STREAM_ALARM
  }

  private fun startAlarmTimeout() {
    timeoutHandler.removeCallbacks(timeoutAction)
    timeoutHandler.postDelayed(timeoutAction, ALARM_TIMEOUT_MS)
  }

  override fun onDestroy() {
    timeoutHandler.removeCallbacks(timeoutAction)
    super.onDestroy()
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) hideSystemBars()
  }

  private fun buildLaunchOptions(): Bundle? {
    val notification = intent?.getBundleExtra(NOTIFICATION_EXTRA) ?: return null
    val payload =
        Bundle().apply {
          putString("notificationId", notification.getString("id") ?: "")
          putString("title", notification.getString("title") ?: "Hora do medicamento")
          putString("body", notification.getString("body") ?: "Dose agendada agora.")
          putBundle("data", notification.getBundle("data") ?: Bundle())
        }
    return Bundle().apply { putBundle("payload", payload) }
  }

  private fun hideSystemBars() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      window.insetsController?.apply {
        hide(WindowInsets.Type.systemBars())
        systemBarsBehavior =
            WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
      }
      return
    }

    @Suppress("DEPRECATION")
    window.decorView.systemUiVisibility =
        View.SYSTEM_UI_FLAG_FULLSCREEN or
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
  }

  private companion object {
    const val ALARM_TIMEOUT_MS = 60_000L
    const val NOTIFICATION_EXTRA = "notification"
  }
}
