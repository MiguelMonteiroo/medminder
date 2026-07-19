package com.remedin

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.facebook.react.HeadlessJsTaskService

class ReminderRescheduleReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    try {
      val serviceIntent = Intent(context, ReminderReconcileService::class.java)
      serviceIntent.putExtra("reason", intent.action ?: "device-event")
      context.startService(serviceIntent)
      HeadlessJsTaskService.acquireWakeLockNow(context)
    } catch (_: IllegalStateException) {
      // App startup reconciliation is the fallback when Android blocks background starts.
    }
  }
}
