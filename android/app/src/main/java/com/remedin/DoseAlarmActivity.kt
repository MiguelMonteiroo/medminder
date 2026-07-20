package com.remedin

import android.content.Intent
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
import com.facebook.react.bridge.Arguments
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule

class DoseAlarmActivity : ReactActivity() {
  private val timeoutHandler = Handler(Looper.getMainLooper())
  private val timeoutAction = Runnable { finishAndCancelAlarm() }
  private val payloadReplayAction = Runnable { emitAlarmPayload(intent) }

  override fun getMainComponentName(): String = "RemedinDoseAlarm"

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
    activeInstance = this
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
    val timeoutMillis =
        intent?.getLongExtra(EXTRA_TIMEOUT_MILLIS, ALARM_TIMEOUT_MS)
            ?.coerceIn(MIN_TIMEOUT_MS, ALARM_TIMEOUT_MS)
            ?: ALARM_TIMEOUT_MS
    timeoutHandler.postDelayed(timeoutAction, timeoutMillis)
  }

  override fun onDestroy() {
    timeoutHandler.removeCallbacks(timeoutAction)
    timeoutHandler.removeCallbacks(payloadReplayAction)
    if (activeInstance === this) activeInstance = null
    super.onDestroy()
  }

  override fun onNewIntent(nextIntent: Intent) {
    super.onNewIntent(nextIntent)
    intent = nextIntent
    configureWindowForAlarm()
    hideSystemBars()
    startAlarmTimeout()
    emitAlarmPayload(nextIntent)
    timeoutHandler.removeCallbacks(payloadReplayAction)
    timeoutHandler.postDelayed(payloadReplayAction, PAYLOAD_REPLAY_DELAY_MS)
  }

  override fun invokeDefaultOnBackPressed() {
    finishAndCancelAlarm()
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) hideSystemBars()
  }

  private fun buildLaunchOptions(): Bundle? {
    val payload = alarmPayload(intent) ?: return null
    return Bundle().apply { putBundle("payload", payload) }
  }

  private fun alarmPayload(sourceIntent: Intent?): Bundle? {
    val notification = sourceIntent?.getBundleExtra(NOTIFICATION_EXTRA) ?: return null
    return Bundle().apply {
      putString("notificationId", notification.getString("id") ?: "")
      putString("title", notification.getString("title") ?: "Hora do medicamento")
      putString("body", notification.getString("body") ?: "Dose agendada agora.")
      putBundle("data", notification.getBundle("data") ?: Bundle())
    }
  }

  private fun emitAlarmPayload(sourceIntent: Intent) {
    val payload = alarmPayload(sourceIntent) ?: return
    reactHost.currentReactContext
        ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        ?.emit(ALARM_PAYLOAD_EVENT, Arguments.fromBundle(payload))
  }

  fun finishAndCancelAlarm() {
    val alarmId = intent?.getStringExtra(MedicationAlarmService.EXTRA_ALARM_ID).orEmpty()
    if (alarmId.isNotBlank()) AlarmAudioScheduler.cancel(this, alarmId)
    finishAndRemoveTask()
  }

  private fun finishAfterServiceStopped() {
    runOnUiThread { finishAndRemoveTask() }
  }

  private fun hideSystemBars() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      window.insetsController?.apply {
        hide(WindowInsets.Type.systemBars())
        systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
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

  companion object {
    const val ALARM_TIMEOUT_MS = 60_000L
    const val MIN_TIMEOUT_MS = 1_000L
    const val PAYLOAD_REPLAY_DELAY_MS = 500L
    const val EXTRA_TIMEOUT_MILLIS = "timeoutMillis"
    const val NOTIFICATION_EXTRA = "notification"
    const val ALARM_PAYLOAD_EVENT = "RemedinDoseAlarmPayload"

    @Volatile private var activeInstance: DoseAlarmActivity? = null

    fun finishIfShowing(alarmId: String? = null) {
      val activity = activeInstance ?: return
      val visibleAlarmId =
          activity.intent?.getStringExtra(MedicationAlarmService.EXTRA_ALARM_ID).orEmpty()
      if (alarmId == null || visibleAlarmId == alarmId) {
        activity.finishAfterServiceStopped()
      }
    }
  }
}
