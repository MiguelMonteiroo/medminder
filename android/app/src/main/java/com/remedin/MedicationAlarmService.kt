package com.remedin

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.net.Uri
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.common.LifecycleState
import com.facebook.react.modules.core.DeviceEventManagerModule

class MedicationAlarmService : Service() {
  private val activeAlarms = linkedMapOf<String, Bundle>()
  private val timeoutHandler = Handler(Looper.getMainLooper())
  private val timeoutAction = Runnable { stopAllAlarms() }
  private var audioFocusRequest: AudioFocusRequest? = null
  private var mediaPlayer: MediaPlayer? = null
  private var wakeLock: PowerManager.WakeLock? = null

  override fun onCreate() {
    super.onCreate()
    activeInstance = this
    ensureAlarmChannels()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_MARK_TAKEN -> return handleDoseAction(intent, "mark-taken")
      ACTION_SNOOZE -> return handleDoseAction(intent, "snooze-five")
      ACTION_END_TEST -> {
        removeActiveAlarm(intent.getStringExtra(EXTRA_ALARM_ID).orEmpty())
        return START_NOT_STICKY
      }
      ACTION_CANCEL_ALARM -> {
        removeActiveAlarm(intent.getStringExtra(EXTRA_ALARM_ID).orEmpty())
        return START_NOT_STICKY
      }
      ACTION_START_ALARM -> Unit
      else -> return START_NOT_STICKY
    }

    val alarmId = intent.getStringExtra(EXTRA_ALARM_ID).orEmpty()
    val payload = intent.getBundleExtra(EXTRA_ALARM_PAYLOAD)
    if (alarmId.isBlank() || payload == null) return START_NOT_STICKY

    val timeoutMillis =
        intent.getLongExtra(EXTRA_TIMEOUT_MILLIS, ALARM_TIMEOUT_MS)
            .coerceIn(MIN_TIMEOUT_MS, ALARM_TIMEOUT_MS)
    AlarmAudioScheduler.markDelivered(this, alarmId)
    payload.putLong(EXTRA_TIMEOUT_MILLIS, timeoutMillis)
    synchronized(activeAlarms) { activeAlarms[alarmId] = Bundle(payload) }

    MainActivity.storePendingAlarmPayload(alarmScreenPayload(payload))

    val notification = buildAlarmNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(
          SERVICE_NOTIFICATION_ID,
          notification,
          ServiceInfo.FOREGROUND_SERVICE_TYPE_SYSTEM_EXEMPTED,
      )
    } else {
      startForeground(SERVICE_NOTIFICATION_ID, notification)
    }
    emitAlarmToForegroundApp(payload)

    acquireWakeLock()
    try {
      startAlarmAudio()
    } catch (_: Exception) {
      removeActiveAlarm(alarmId)
      return START_NOT_STICKY
    }
    timeoutHandler.removeCallbacks(timeoutAction)
    timeoutHandler.postDelayed(timeoutAction, timeoutMillis)
    return START_NOT_STICKY
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onDestroy() {
    timeoutHandler.removeCallbacks(timeoutAction)
    releaseAlarmAudio()
    releaseWakeLock()
    synchronized(activeAlarms) { activeAlarms.clear() }
    if (activeInstance === this) activeInstance = null
    super.onDestroy()
  }

  private fun handleDoseAction(intent: Intent, actionId: String): Int {
    val alarmId = intent.getStringExtra(EXTRA_ALARM_ID).orEmpty()
    val payload = synchronized(activeAlarms) { activeAlarms[alarmId]?.let(::Bundle) }
        ?: intent.getBundleExtra(EXTRA_ALARM_PAYLOAD)
        ?: return START_NOT_STICKY

    removeActiveAlarm(alarmId)
    val command =
        Bundle().apply {
          putString("actionId", actionId)
          putString("commandId", "$alarmId:$actionId")
          putString("doseOccurrenceId", payload.getString("doseOccurrenceId").orEmpty())
          putString("medicationId", payload.getString("medicationId").orEmpty())
          putString("scheduleId", payload.getString("scheduleId").orEmpty())
          putString("scheduledAt", payload.getString("scheduledAt").orEmpty())
          putString("notificationId", alarmId)
        }
    startService(
        Intent(this, MedicationAlarmActionTaskService::class.java)
            .putExtra(MedicationAlarmActionTaskService.EXTRA_COMMAND, command),
    )
    HeadlessJsTaskService.acquireWakeLockNow(this)
    return START_NOT_STICKY
  }

  private fun startAlarmAudio() {
    if (mediaPlayer?.isPlaying == true) return
    val attributes =
        AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
    requestAudioFocus(attributes)
    mediaPlayer =
        MediaPlayer().apply {
          setAudioAttributes(attributes)
          resources.openRawResourceFd(R.raw.remedin_alarm).use { descriptor ->
            setDataSource(descriptor.fileDescriptor, descriptor.startOffset, descriptor.length)
          }
          isLooping = true
          setVolume(1f, 1f)
          prepare()
          start()
        }
  }

  private fun requestAudioFocus(attributes: AudioAttributes) {
    val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      audioFocusRequest =
          AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
              .setAudioAttributes(attributes)
              .build()
      audioManager.requestAudioFocus(audioFocusRequest!!)
    } else {
      @Suppress("DEPRECATION")
      audioManager.requestAudioFocus(
          null,
          AudioManager.STREAM_ALARM,
          AudioManager.AUDIOFOCUS_GAIN_TRANSIENT,
      )
    }
  }

  private fun releaseAlarmAudio() {
    mediaPlayer?.runCatching {
      if (isPlaying) stop()
      release()
    }
    mediaPlayer = null
    val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      audioFocusRequest?.let(audioManager::abandonAudioFocusRequest)
    } else {
      @Suppress("DEPRECATION")
      audioManager.abandonAudioFocus(null)
    }
    audioFocusRequest = null
  }

  private fun acquireWakeLock() {
    releaseWakeLock()
    val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
    wakeLock =
        powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "$packageName:medication-alarm-audio",
        )
    wakeLock?.acquire(ALARM_TIMEOUT_MS + WAKE_LOCK_GRACE_MS)
  }

  private fun releaseWakeLock() {
    wakeLock?.takeIf { it.isHeld }?.release()
    wakeLock = null
  }

  private fun buildAlarmNotification(): Notification {
    val payloads = synchronized(activeAlarms) { activeAlarms.values.map(::Bundle) }
    val primary = payloads.last()
    val multiple = payloads.size > 1
    val isTest = primary.getString("artifactKind") == "alarmTest"
    val showDetails = primary.getBoolean("showDetails", false)
    val channelId =
        if (primary.getBoolean("criticalAlertsEnabled", false)) {
          CRITICAL_CHANNEL_ID
        } else {
          NORMAL_CHANNEL_ID
        }
    val title =
        when {
          multiple -> "${payloads.size} medicamentos agora"
          else -> primary.getString("title") ?: "Hora do medicamento"
        }
    val body =
        if (multiple) "Abra o Remedin para registrar cada dose."
        else primary.getString("body") ?: "Dose agendada agora."
    val activityIntent = mainAlarmIntent(primary)
    val activityPendingIntent =
        PendingIntent.getActivity(
            this,
            primary.getString("alarmId").orEmpty().hashCode(),
            activityIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    val builder =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          Notification.Builder(this, channelId)
        } else {
          @Suppress("DEPRECATION")
          Notification.Builder(this)
        }

    builder
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentTitle(title)
        .setContentText(body)
        .setCategory(Notification.CATEGORY_ALARM)
        .setContentIntent(activityPendingIntent)
        .setFullScreenIntent(activityPendingIntent, canLaunchFullScreen(primary))
        .setVisibility(if (showDetails) Notification.VISIBILITY_PUBLIC else Notification.VISIBILITY_PRIVATE)
        .setLocalOnly(true)
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .setPriority(Notification.PRIORITY_MAX)

    if (multiple) {
      builder.addAction(0, "Abrir alarme", activityPendingIntent)
    } else if (isTest) {
      builder.addAction(0, "Encerrar teste", serviceAction(ACTION_END_TEST, primary))
    } else {
      builder.addAction(0, "Marcar como tomado", serviceAction(ACTION_MARK_TAKEN, primary))
      builder.addAction(0, "Adiar 5 min", serviceAction(ACTION_SNOOZE, primary))
    }
    return builder.build()
  }

  private fun mainAlarmIntent(payload: Bundle): Intent =
      Intent(this, MainActivity::class.java).apply {
        val alarmId = payload.getString("alarmId").orEmpty()
        action = ACTION_OPEN_ALARM
        data = Uri.parse("remedin://dose-alarm/${Uri.encode(alarmId)}")
        flags =
            Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP
        putExtra(MainActivity.EXTRA_ALARM_MODE, true)
        putExtra(EXTRA_ALARM_ID, alarmId)
        putExtra(EXTRA_TIMEOUT_MILLIS, payload.getLong(EXTRA_TIMEOUT_MILLIS, ALARM_TIMEOUT_MS))
        putExtra(NOTIFICATION_EXTRA, notificationBundle(payload))
      }

  private fun notificationBundle(payload: Bundle): Bundle =
      Bundle().apply {
        putString("id", payload.getString("alarmId").orEmpty())
        putString("title", payload.getString("title") ?: "Hora do medicamento")
        putString("body", payload.getString("body") ?: "Dose agendada agora.")
        putBundle(
            "data",
            Bundle().apply {
              putString("payloadVersion", "1")
              putString("artifactKind", payload.getString("artifactKind").orEmpty())
              putString("doseOccurrenceId", payload.getString("doseOccurrenceId").orEmpty())
              putString("medicationId", payload.getString("medicationId").orEmpty())
              putString("scheduleId", payload.getString("scheduleId").orEmpty())
              putString("doseWindowKey", payload.getString("doseWindowKey").orEmpty())
              putString("scheduledAt", payload.getString("scheduledAt").orEmpty())
              putString("showDetails", payload.getBoolean("showDetails", false).toString())
            },
        )
      }

  private fun alarmScreenPayload(payload: Bundle): Bundle {
    val notification = notificationBundle(payload)
    return Bundle().apply {
      putString("notificationId", notification.getString("id").orEmpty())
      putString("title", notification.getString("title").orEmpty())
      putString("body", notification.getString("body").orEmpty())
      putBundle("data", notification.getBundle("data") ?: Bundle())
    }
  }

  private fun emitAlarmToForegroundApp(payload: Bundle) {
    val reactContext =
        (application as? ReactApplication)?.reactHost?.currentReactContext ?: return
    if (reactContext.lifecycleState != LifecycleState.RESUMED) return
    val eventPayload = alarmScreenPayload(payload)
    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(FOREGROUND_ALARM_EVENT, Arguments.fromBundle(eventPayload))
  }

  private fun serviceAction(action: String, payload: Bundle): PendingIntent {
    val alarmId = payload.getString("alarmId").orEmpty()
    val intent =
        Intent(this, MedicationAlarmService::class.java).apply {
          this.action = action
          putExtra(EXTRA_ALARM_ID, alarmId)
          putExtra(EXTRA_ALARM_PAYLOAD, payload)
        }
    return PendingIntent.getService(
        this,
        "$action:$alarmId".hashCode(),
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun canLaunchFullScreen(payload: Bundle): Boolean {
    if (!payload.getBoolean("fullScreenEnabled", false)) return false
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) return true
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    return manager.canUseFullScreenIntent()
  }

  private fun ensureAlarmChannels() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.createNotificationChannel(
        NotificationChannel(
                NORMAL_CHANNEL_ID,
                "Alarmes de dose",
                NotificationManager.IMPORTANCE_HIGH,
            )
            .apply {
              description = "Alarmes reproduzidos diretamente pelo Remedin."
              setSound(null, null)
              enableVibration(true)
              vibrationPattern = longArrayOf(300L, 450L, 300L, 450L)
            },
    )
    manager.createNotificationChannel(
        NotificationChannel(
                CRITICAL_CHANNEL_ID,
                "Alarmes críticos de dose",
                NotificationManager.IMPORTANCE_HIGH,
            )
            .apply {
              description = "Alarmes autorizados a tocar no silencioso e Não Perturbe."
              setSound(null, null)
              enableVibration(true)
              vibrationPattern = longArrayOf(300L, 450L, 300L, 450L)
              if (manager.isNotificationPolicyAccessGranted) setBypassDnd(true)
            },
    )
  }

  private fun removeActiveAlarm(alarmId: String) {
    if (alarmId.isBlank()) return
    val hasRemaining = synchronized(activeAlarms) {
      activeAlarms.remove(alarmId)
      activeAlarms.isNotEmpty()
    }
    if (hasRemaining) {
      val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.notify(SERVICE_NOTIFICATION_ID, buildAlarmNotification())
      return
    }
    stopAllAlarms()
  }

  private fun stopAllAlarms() {
    timeoutHandler.removeCallbacks(timeoutAction)
    synchronized(activeAlarms) { activeAlarms.clear() }
    MainActivity.clearAlarmWindowModeIfShowing()
    releaseAlarmAudio()
    releaseWakeLock()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION")
      stopForeground(true)
    }
    stopSelf()
  }

  companion object {
    const val ACTION_START_ALARM = "com.remedin.action.START_ALARM_AUDIO"
    const val ACTION_MARK_TAKEN = "com.remedin.action.MARK_TAKEN"
    const val ACTION_SNOOZE = "com.remedin.action.SNOOZE_FIVE"
    const val ACTION_END_TEST = "com.remedin.action.END_ALARM_TEST"
    const val ACTION_CANCEL_ALARM = "com.remedin.action.CANCEL_ALARM"
    const val ACTION_OPEN_ALARM = "com.remedin.action.OPEN_ALARM"
    const val EXTRA_ALARM_ID = "alarmId"
    const val EXTRA_TIMEOUT_MILLIS = "timeoutMillis"
    const val EXTRA_ALARM_PAYLOAD = "nativeAlarmPayload"
    const val NOTIFICATION_EXTRA = "notification"
    const val FOREGROUND_ALARM_EVENT = "RemedinNativeAlarmDelivered"
    const val ALARM_TIMEOUT_MS = 60_000L
    private const val MIN_TIMEOUT_MS = 1_000L
    private const val WAKE_LOCK_GRACE_MS = 5_000L
    private const val NORMAL_CHANNEL_ID = "medication-dose-alarms-player-v1"
    private const val CRITICAL_CHANNEL_ID = "medication-dose-alarms-player-critical-v1"
    private const val SERVICE_NOTIFICATION_ID = 0x4D4D

    @Volatile private var activeInstance: MedicationAlarmService? = null

    fun cancelActiveAlarm(alarmId: String) {
      activeInstance?.removeActiveAlarm(alarmId)
    }

    fun cancelAllActiveAlarms() {
      activeInstance?.stopAllAlarms()
    }
  }
}
