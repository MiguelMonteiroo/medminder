package com.remedin

import android.content.Intent
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class ReminderReconcileService : HeadlessJsTaskService() {
  override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig =
      HeadlessJsTaskConfig(
          "RemedinReminderReconcile",
          Arguments.createMap(),
          30_000,
          true,
      )
}
