package com.remedin

import android.app.ActivityManager
import android.content.Context
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
import io.invertase.notifee.NotifeeApiModule
import java.lang.ref.WeakReference

class MainActivity : ReactActivity() {
  private val payloadReplayHandler = Handler(Looper.getMainLooper())
  private val payloadReplayAction = Runnable { emitPendingAlarmPayload() }
  private var alarmModeActive = false
  private var activeAlarmId: String? = null

  override fun getMainComponentName(): String =
      NotifeeApiModule.getMainComponent("Remedin")

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
        override fun getLaunchOptions(): Bundle? {
          val payload = validatedAlarmPayload(intent) ?: return null
          return Bundle().apply { putBundle(INITIAL_ALARM_PAYLOAD_PROP, payload) }
        }
      }

  override fun onCreate(savedInstanceState: Bundle?) {
    handleAlarmIntent(intent, emit = false)
    super.onCreate(savedInstanceState)
    activeInstance = WeakReference(this)
    if (alarmModeActive) {
      configureAlarmWindowMode()
      hideSystemBars()
    }
  }

  override fun onNewIntent(nextIntent: Intent) {
    super.onNewIntent(nextIntent)
    intent = nextIntent
    handleAlarmIntent(nextIntent, emit = true)
  }

  override fun onResume() {
    super.onResume()
    activeInstance = WeakReference(this)
    if (alarmModeActive) {
      configureAlarmWindowMode()
      hideSystemBars()
      payloadReplayHandler.removeCallbacks(payloadReplayAction)
      payloadReplayHandler.postDelayed(payloadReplayAction, PAYLOAD_REPLAY_DELAY_MS)
    }
  }

  override fun onDestroy() {
    payloadReplayHandler.removeCallbacks(payloadReplayAction)
    if (activeInstance?.get() === this) activeInstance = null
    super.onDestroy()
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus && alarmModeActive) hideSystemBars()
  }

  private fun handleAlarmIntent(sourceIntent: Intent?, emit: Boolean) {
    val payload = alarmPayload(sourceIntent) ?: return
    val explicitAlarmMode = sourceIntent?.getBooleanExtra(EXTRA_ALARM_MODE, false) == true
    if (!explicitAlarmMode && !isAlarmPayload(payload)) return
    activeAlarmId = payload.getString("notificationId")
    alarmModeActive = true
    storePendingAlarmPayload(payload)
    configureAlarmWindowMode()
    if (emit) {
      emitAlarmPayload(payload)
      payloadReplayHandler.removeCallbacks(payloadReplayAction)
      payloadReplayHandler.postDelayed(payloadReplayAction, PAYLOAD_REPLAY_DELAY_MS)
    }
  }

  private fun isAlarmPayload(payload: Bundle): Boolean {
    val kind = payload.getBundle("data")?.getString("artifactKind").orEmpty()
    return kind == "doseAlarm" || kind == "snoozedAlarm" || kind == "alarmTest"
  }

  private fun validatedAlarmPayload(sourceIntent: Intent?): Bundle? {
    val payload = alarmPayload(sourceIntent) ?: return null
    return payload.takeIf(::isAlarmPayload)
  }

  private fun configureAlarmWindowMode() {
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

  private fun clearAlarmWindowMode(alarmId: String? = null) {
    if (alarmId != null && activeAlarmId != null && activeAlarmId != alarmId) return
    alarmModeActive = false
    activeAlarmId = null
    payloadReplayHandler.removeCallbacks(payloadReplayAction)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(false)
      setTurnScreenOn(false)
    }
    @Suppress("DEPRECATION")
    window.clearFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON,
    )
    volumeControlStream = AudioManager.USE_DEFAULT_STREAM_TYPE
    clearAlarmIntent()
    showSystemBars()
  }

  private fun clearAlarmIntent() {
    intent?.apply {
      removeExtra(EXTRA_ALARM_MODE)
      removeExtra(MedicationAlarmService.EXTRA_ALARM_ID)
      removeExtra(MedicationAlarmService.EXTRA_TIMEOUT_MILLIS)
      removeExtra(MedicationAlarmService.NOTIFICATION_EXTRA)
      action = null
      data = null
    }
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

  private fun showSystemBars() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      window.insetsController?.show(WindowInsets.Type.systemBars())
      return
    }
    @Suppress("DEPRECATION")
    run { window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE }
  }

  private fun alarmPayload(sourceIntent: Intent?): Bundle? {
    val notification =
        sourceIntent?.getBundleExtra(MedicationAlarmService.NOTIFICATION_EXTRA) ?: return null
    return Bundle().apply {
      putString("notificationId", notification.getString("id").orEmpty())
      putString("title", notification.getString("title") ?: "Hora do medicamento")
      putString("body", notification.getString("body") ?: "Dose agendada agora.")
      putBundle("data", notification.getBundle("data") ?: Bundle())
    }
  }

  private fun emitPendingAlarmPayload() {
    val payload = peekPendingAlarmPayload() ?: return
    emitAlarmPayload(payload)
  }

  private fun emitAlarmPayload(payload: Bundle) {
    reactHost.currentReactContext
        ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        ?.emit(ALARM_DELIVERED_EVENT, Arguments.fromBundle(payload))
  }

  private fun emitAlarmStopped(alarmId: String?) {
    reactHost.currentReactContext
        ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        ?.emit(
            ALARM_STOPPED_EVENT,
            Arguments.createMap().apply { putString("alarmId", alarmId.orEmpty()) },
        )
  }

  companion object {
    const val EXTRA_ALARM_MODE = "remedinAlarmMode"
    const val INITIAL_ALARM_PAYLOAD_PROP = "initialAlarmPayload"
    const val ALARM_DELIVERED_EVENT = "RemedinNativeAlarmDelivered"
    const val ALARM_STOPPED_EVENT = "RemedinNativeAlarmStopped"
    private const val PAYLOAD_REPLAY_DELAY_MS = 500L

    @Volatile private var activeInstance: WeakReference<MainActivity>? = null
    private var pendingAlarmPayload: Bundle? = null

    @Synchronized
    fun storePendingAlarmPayload(payload: Bundle) {
      pendingAlarmPayload = Bundle(payload)
    }

    @Synchronized
    fun consumePendingAlarmPayload(): Bundle? {
      val payload = pendingAlarmPayload?.let(::Bundle)
      pendingAlarmPayload = null
      return payload
    }

    @Synchronized
    private fun peekPendingAlarmPayload(): Bundle? = pendingAlarmPayload?.let(::Bundle)

    fun clearAlarmWindowModeIfShowing(alarmId: String? = null) {
      val activity = activeInstance?.get()
      synchronized(this) {
        val pendingId = pendingAlarmPayload?.getString("notificationId")
        if (alarmId == null || pendingId == null || pendingId == alarmId) {
          pendingAlarmPayload = null
        }
      }
      activity?.runOnUiThread {
        activity.clearAlarmWindowMode(alarmId)
        activity.emitAlarmStopped(alarmId)
      }
    }

    fun bringActiveAlarmToFront(alarmId: String): Boolean {
      val activity = activeInstance?.get() ?: return false
      val payload = peekPendingAlarmPayload() ?: return false
      if (payload.getString("notificationId") != alarmId) return false

      activity.runOnUiThread {
        activity.activeAlarmId = alarmId
        activity.alarmModeActive = true
        activity.configureAlarmWindowMode()
        activity.hideSystemBars()
        val activityManager =
            activity.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        activityManager.moveTaskToFront(activity.taskId, ActivityManager.MOVE_TASK_WITH_HOME)
        activity.emitAlarmPayload(payload)
      }
      return true
    }
  }
}
