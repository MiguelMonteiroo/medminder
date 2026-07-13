package com.medminder

import android.content.Context
import android.content.Intent
import androidx.work.Worker
import androidx.work.WorkerParameters
import com.facebook.react.HeadlessJsTaskService

class ReminderReconcileWorker(
    context: Context,
    parameters: WorkerParameters,
) : Worker(context, parameters) {
  override fun doWork(): Result =
      try {
        applicationContext.startService(
            Intent(applicationContext, ReminderReconcileService::class.java),
        )
        HeadlessJsTaskService.acquireWakeLockNow(applicationContext)
        Result.success()
      } catch (_: IllegalStateException) {
        Result.retry()
      }
}
