package com.skiftappen.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.skiftappen.R
import com.skiftappen.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

/**
 * Implementation of App Widget functionality for Shift display.
 */
class ShiftWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // There may be multiple widgets active, so update all of them
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // Enter relevant functionality for when the first widget is created
        super.onEnabled(context)
    }

    override fun onDisabled(context: Context) {
        // Enter relevant functionality for when the last widget is disabled
        super.onDisabled(context)
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        // Create an Intent to launch the main activity
        val intent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Construct the RemoteViews object
        val views = RemoteViews(context.packageName, R.layout.shift_widget)
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

        // Load shift data asynchronously
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val shift = SupabaseService.getInstance(context).fetchNextShift()
                
                CoroutineScope(Dispatchers.Main).launch {
                    if (shift != null) {
                        updateWidgetWithShift(context, views, shift, appWidgetManager, appWidgetId)
                    } else {
                        updateWidgetWithNoShifts(context, views, appWidgetManager, appWidgetId)
                    }
                }
            } catch (e: Exception) {
                CoroutineScope(Dispatchers.Main).launch {
                    updateWidgetWithError(context, views, appWidgetManager, appWidgetId)
                }
            }
        }

        // Show loading state initially
        updateWidgetWithLoading(context, views, appWidgetManager, appWidgetId)
    }

    private fun updateWidgetWithShift(
        context: Context,
        views: RemoteViews,
        shift: ShiftData,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        // Update widget with shift data
        views.setTextViewText(R.id.widget_title, shift.title)
        views.setTextViewText(R.id.widget_time, formatShiftTime(shift.startTime, shift.endTime))
        views.setTextViewText(R.id.widget_location, shift.location ?: "")
        views.setTextViewText(R.id.widget_countdown, getTimeUntilShift(shift.startTime))
        
        // Show/hide location text based on availability
        if (shift.location.isNullOrEmpty()) {
            views.setViewVisibility(R.id.widget_location, android.view.View.GONE)
            views.setViewVisibility(R.id.location_icon, android.view.View.GONE)
        } else {
            views.setViewVisibility(R.id.widget_location, android.view.View.VISIBLE)
            views.setViewVisibility(R.id.location_icon, android.view.View.VISIBLE)
        }
        
        // Hide loading, show content
        views.setViewVisibility(R.id.loading_container, android.view.View.GONE)
        views.setViewVisibility(R.id.error_container, android.view.View.GONE)
        views.setViewVisibility(R.id.empty_container, android.view.View.GONE)
        views.setViewVisibility(R.id.content_container, android.view.View.VISIBLE)

        // Tell the AppWidgetManager to perform an update on the current app widget
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun updateWidgetWithNoShifts(
        context: Context,
        views: RemoteViews,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        // Show no shifts state
        views.setTextViewText(R.id.empty_title, "Inga kommande pass")
        views.setTextViewText(R.id.empty_subtitle, "Du har vildag! 🎉")
        
        // Hide other containers, show empty
        views.setViewVisibility(R.id.loading_container, android.view.View.GONE)
        views.setViewVisibility(R.id.error_container, android.view.View.GONE)
        views.setViewVisibility(R.id.content_container, android.view.View.GONE)
        views.setViewVisibility(R.id.empty_container, android.view.View.VISIBLE)

        // Tell the AppWidgetManager to perform an update on the current app widget
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun updateWidgetWithError(
        context: Context,
        views: RemoteViews,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        // Show error state
        views.setTextViewText(R.id.error_title, "Kunde inte ladda data")
        views.setTextViewText(R.id.error_subtitle, "Tryck för att öppna appen")
        
        // Hide other containers, show error
        views.setViewVisibility(R.id.loading_container, android.view.View.GONE)
        views.setViewVisibility(R.id.content_container, android.view.View.GONE)
        views.setViewVisibility(R.id.empty_container, android.view.View.GONE)
        views.setViewVisibility(R.id.error_container, android.view.View.VISIBLE)

        // Tell the AppWidgetManager to perform an update on the current app widget
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun updateWidgetWithLoading(
        context: Context,
        views: RemoteViews,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        // Show loading state
        views.setTextViewText(R.id.loading_text, "Laddar...")
        
        // Hide other containers, show loading
        views.setViewVisibility(R.id.content_container, android.view.View.GONE)
        views.setViewVisibility(R.id.empty_container, android.view.View.GONE)
        views.setViewVisibility(R.id.error_container, android.view.View.GONE)
        views.setViewVisibility(R.id.loading_container, android.view.View.VISIBLE)

        // Tell the AppWidgetManager to perform an update on the current app widget
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun formatShiftTime(startTime: Date, endTime: Date): String {
        val timeFormat = SimpleDateFormat("HH:mm", Locale("sv", "SE"))
        return "${timeFormat.format(startTime)} - ${timeFormat.format(endTime)}"
    }

    private fun getTimeUntilShift(shiftStart: Date): String {
        val now = Date()
        val diffMs = shiftStart.time - now.time
        
        if (diffMs < 0) {
            return "Pågår"
        }
        
        val diffHours = diffMs / (1000 * 60 * 60)
        val diffMinutes = (diffMs % (1000 * 60 * 60)) / (1000 * 60)
        
        return when {
            diffHours > 24 -> {
                val days = diffHours / 24
                "${days} dag${if (days == 1L) "" else "ar"}"
            }
            diffHours > 0 -> "${diffHours}h ${diffMinutes}m"
            else -> "${diffMinutes} min"
        }
    }
}

// Data class for shift information
data class ShiftData(
    val id: String,
    val title: String,
    val startTime: Date,
    val endTime: Date,
    val location: String?,
    val description: String?
)