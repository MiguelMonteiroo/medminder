package com.medminder

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
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager

class MedicationAlarmService : Service() {
  private val activeAlarmIds = mutableSetOf<String>()
  private val timeoutHandler = Handler(Looper.getMainLooper())
  private val timeoutAction = Runnable { stopSelf() }
  private var audioFocusRequest: AudioFocusRequest? = null
  private var mediaPlayer: MediaPlayer? = null
  private var wakeLock: PowerManager.WakeLock? = null

  override fun onCreate() {
    super.onCreate()
    activeInstance = this
    ensureServiceChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action != ACTION_START_ALARM) return START_NOT_STICKY
    val alarmId = intent.getStringExtra(EXTRA_ALARM_ID).orEmpty()
    if (alarmId.isBlank()) return START_NOT_STICKY

    val timeoutMillis =
        intent.getLongExtra(EXTRA_TIMEOUT_MILLIS, ALARM_TIMEOUT_MS)
            .coerceIn(MIN_TIMEOUT_MS, ALARM_TIMEOUT_MS)
    AlarmAudioScheduler.markDelivered(this, alarmId)
    synchronized(activeAlarmIds) { activeAlarmIds.add(alarmId) }

    val foregroundNotification = buildForegroundNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(
          SERVICE_NOTIFICATION_ID,
          foregroundNotification,
          ServiceInfo.FOREGROUND_SERVICE_TYPE_SYSTEM_EXEMPTED,
      )
    } else {
      startForeground(SERVICE_NOTIFICATION_ID, foregroundNotification)
    }
    acquireWakeLock()
    try {
      startAlarmAudio()
    } catch (error: Exception) {
      stopSelf()
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
    synchronized(activeAlarmIds) { activeAlarmIds.clear() }
    if (activeInstance === this) activeInstance = null
    super.onDestroy()
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
          resources.openRawResourceFd(R.raw.medminder_alarm).use { descriptor ->
            setDataSource(
                descriptor.fileDescriptor,
                descriptor.startOffset,
                descriptor.length,
            )
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

  private fun buildForegroundNotification(): Notification {
    val contentIntent =
        PendingIntent.getActivity(
            this,
            0,
            Intent(this, DoseAlarmActivity::class.java).apply {
              flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    val builder =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          Notification.Builder(this, SERVICE_CHANNEL_ID)
        } else {
          @Suppress("DEPRECATION")
          Notification.Builder(this)
        }
    return builder
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentTitle("Alarme de medicamento ativo")
        .setContentText("Abra o MedMinder para registrar ou adiar a dose.")
        .setCategory(Notification.CATEGORY_ALARM)
        .setContentIntent(contentIntent)
        .setLocalOnly(true)
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .build()
  }

  private fun ensureServiceChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.createNotificationChannel(
        NotificationChannel(
                SERVICE_CHANNEL_ID,
                "Reprodução de alarmes",
                NotificationManager.IMPORTANCE_LOW,
            )
            .apply {
              description = "Mantém o som do alarme ativo pelo tempo configurado."
              setSound(null, null)
              enableVibration(false)
            },
    )
  }

  private fun removeActiveAlarm(alarmId: String) {
    val shouldStop = synchronized(activeAlarmIds) {
      activeAlarmIds.remove(alarmId)
      activeAlarmIds.isEmpty()
    }
    if (shouldStop) stopSelf()
  }

  companion object {
    const val ACTION_START_ALARM = "com.medminder.action.START_ALARM_AUDIO"
    const val EXTRA_ALARM_ID = "alarmId"
    const val EXTRA_TIMEOUT_MILLIS = "timeoutMillis"
    const val ALARM_TIMEOUT_MS = 60_000L
    private const val MIN_TIMEOUT_MS = 1_000L
    private const val WAKE_LOCK_GRACE_MS = 5_000L
    private const val SERVICE_CHANNEL_ID = "medication-alarm-playback-v1"
    private const val SERVICE_NOTIFICATION_ID = 0x4D4D

    @Volatile private var activeInstance: MedicationAlarmService? = null

    fun cancelActiveAlarm(alarmId: String) {
      activeInstance?.removeActiveAlarm(alarmId)
    }

    fun cancelAllActiveAlarms() {
      activeInstance?.stopSelf()
    }
  }
}
