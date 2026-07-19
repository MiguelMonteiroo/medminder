package com.remedin

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          add(ReminderPermissionsPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    val reconcileWork =
        PeriodicWorkRequestBuilder<ReminderReconcileWorker>(12, TimeUnit.HOURS).build()
    WorkManager.getInstance(this)
        .enqueueUniquePeriodicWork(
            "remedin-reminder-reconcile",
            ExistingPeriodicWorkPolicy.KEEP,
            reconcileWork,
        )
  }
}
