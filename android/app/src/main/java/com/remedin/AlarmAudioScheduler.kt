package com.remedin

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build

object AlarmAudioScheduler {
  private const val PREFS_NAME = "remedin_alarm_audio"
  private const val PREFS_ALARM_IDS = "scheduled_alarm_ids"

  fun schedule(
      context: Context,
      alarmId: String,
      triggerAtMillis: Long,
      timeoutMillis: Long,
  ): Boolean {
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
      return false
    }

    val pendingIntent = pendingIntent(context, alarmId, timeoutMillis)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      alarmManager.setExactAndAllowWhileIdle(
          AlarmManager.RTC_WAKEUP,
          triggerAtMillis,
          pendingIntent,
      )
    } else {
      alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
    }
    remember(context, alarmId)
    return true
  }

  fun cancel(context: Context, alarmId: String) {
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    alarmManager.cancel(pendingIntent(context, alarmId, MedicationAlarmService.ALARM_TIMEOUT_MS))
    forget(context, alarmId)
    MedicationAlarmService.cancelActiveAlarm(alarmId)
  }

  fun cancelAll(context: Context) {
    scheduledIds(context).forEach { alarmId ->
      val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      alarmManager.cancel(pendingIntent(context, alarmId, MedicationAlarmService.ALARM_TIMEOUT_MS))
    }
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .remove(PREFS_ALARM_IDS)
        .apply()
    MedicationAlarmService.cancelAllActiveAlarms()
  }

  fun markDelivered(context: Context, alarmId: String) {
    forget(context, alarmId)
  }

  private fun pendingIntent(
      context: Context,
      alarmId: String,
      timeoutMillis: Long,
  ): PendingIntent {
    val intent =
        Intent(context, MedicationAlarmService::class.java).apply {
          action = MedicationAlarmService.ACTION_START_ALARM
          data = Uri.parse("remedin://alarm-audio/${Uri.encode(alarmId)}")
          putExtra(MedicationAlarmService.EXTRA_ALARM_ID, alarmId)
          putExtra(MedicationAlarmService.EXTRA_TIMEOUT_MILLIS, timeoutMillis)
        }
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      PendingIntent.getForegroundService(context, 0, intent, flags)
    } else {
      PendingIntent.getService(context, 0, intent, flags)
    }
  }

  @Synchronized
  private fun remember(context: Context, alarmId: String) {
    val ids = scheduledIds(context).toMutableSet().apply { add(alarmId) }
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .putStringSet(PREFS_ALARM_IDS, ids)
        .apply()
  }

  @Synchronized
  private fun forget(context: Context, alarmId: String) {
    val ids = scheduledIds(context).toMutableSet().apply { remove(alarmId) }
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .putStringSet(PREFS_ALARM_IDS, ids)
        .apply()
  }

  private fun scheduledIds(context: Context): Set<String> =
      context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
          .getStringSet(PREFS_ALARM_IDS, emptySet())
          ?.toSet()
          ?: emptySet()
}
