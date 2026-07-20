package com.remedin

import android.content.Intent
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class MedicationAlarmActionTaskService : HeadlessJsTaskService() {
  override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
    val command = intent?.getBundleExtra(EXTRA_COMMAND) ?: return null
    return HeadlessJsTaskConfig(
        "RemedinAlarmAction",
        Arguments.fromBundle(command),
        15_000,
        true,
    )
  }

  companion object {
    const val EXTRA_COMMAND = "notificationActionCommand"
  }
}
