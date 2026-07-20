package com.remedin

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.Arguments

class AlarmAudioModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AlarmAudio"

  @ReactMethod
  fun scheduleAlarmAudio(
      alarmId: String,
      triggerAtMillis: Double,
      timeoutMillis: Double,
      payload: ReadableMap,
      promise: Promise,
  ) {
    try {
      promise.resolve(
          AlarmAudioScheduler.schedule(
              reactApplicationContext,
              alarmId,
              triggerAtMillis.toLong(),
              timeoutMillis.toLong(),
              Arguments.toBundle(payload),
          ),
      )
    } catch (error: Exception) {
      promise.reject("schedule-alarm-audio", error)
    }
  }

  @ReactMethod
  fun cancelAlarmAudio(alarmId: String, promise: Promise) {
    try {
      AlarmAudioScheduler.cancel(reactApplicationContext, alarmId)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("cancel-alarm-audio", error)
    }
  }

  @ReactMethod
  fun cancelAllAlarmAudio(promise: Promise) {
    try {
      AlarmAudioScheduler.cancelAll(reactApplicationContext)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("cancel-all-alarm-audio", error)
    }
  }
}
