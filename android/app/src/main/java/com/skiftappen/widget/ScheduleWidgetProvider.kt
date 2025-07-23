package com.skiftappen.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Color
import android.widget.RemoteViews
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.*

class ScheduleWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        // Hämta användar-ID från SharedPreferences
        val prefs = context.getSharedPreferences("user_prefs", Context.MODE_PRIVATE)
        val userId = prefs.getString("current_user_id", "") ?: ""

        if (userId.isEmpty()) {
            showLoginRequired(context, appWidgetManager, appWidgetId)
            return
        }

        // Hämta skift asynkront
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val shifts = fetchUserShifts(userId)
                withContext(Dispatchers.Main) {
                    updateWidgetWithShifts(context, appWidgetManager, appWidgetId, shifts)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    showError(context, appWidgetManager, appWidgetId, e.message ?: "Okänt fel")
                }
            }
        }
    }

    private suspend fun fetchUserShifts(userId: String): List<Shift> {
        val url = URL("http://localhost:8000/api/schedule/$userId")
        val connection = url.openConnection() as HttpURLConnection
        
        try {
            connection.requestMethod = "GET"
            connection.connectTimeout = 5000
            connection.readTimeout = 5000
            
            // Lägg till auth header om tillgängligt
            val authToken = getAuthToken()
            if (authToken.isNotEmpty()) {
                connection.setRequestProperty("Authorization", "Bearer $authToken")
            }

            val responseCode = connection.responseCode
            if (responseCode == HttpURLConnection.HTTP_OK) {
                val response = connection.inputStream.bufferedReader().readText()
                return parseShiftsFromJson(response)
            } else {
                throw Exception("HTTP Error: $responseCode")
            }
        } finally {
            connection.disconnect()
        }
    }

    private fun parseShiftsFromJson(jsonString: String): List<Shift> {
        val shifts = mutableListOf<Shift>()
        try {
            val jsonObject = JSONObject(jsonString)
            val dataArray = jsonObject.getJSONArray("data")
            
            for (i in 0 until dataArray.length()) {
                val shiftJson = dataArray.getJSONObject(i)
                shifts.add(
                    Shift(
                        id = shiftJson.getString("id"),
                        startTime = shiftJson.getString("start_time"),
                        endTime = shiftJson.getString("end_time"),
                        position = shiftJson.optString("position", ""),
                        location = shiftJson.optString("location", ""),
                        status = shiftJson.getString("status")
                    )
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return shifts
    }

    private fun updateWidgetWithShifts(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        shifts: List<Shift>
    ) {
        val views = RemoteViews(context.packageName, R.layout.schedule_widget)
        
        // Hitta nästa skift
        val nextShift = findNextShift(shifts)
        
        if (nextShift != null) {
            views.setTextViewText(R.id.widget_title, "Nästa Pass")
            views.setTextViewText(R.id.shift_time, formatTime(nextShift.startTime))
            views.setTextViewText(R.id.shift_position, nextShift.position.ifEmpty { "Arbete" })
            views.setTextViewText(R.id.shift_status, nextShift.status.capitalize())
            
            // Sätt statusfärg
            val statusColor = getStatusColor(nextShift.status)
            views.setInt(R.id.status_indicator, "setBackgroundColor", statusColor)
            
            // Göm "ingen pass" meddelandet
            views.setViewVisibility(R.id.no_shifts_text, android.view.View.GONE)
            views.setViewVisibility(R.id.shift_info_container, android.view.View.VISIBLE)
        } else {
            views.setTextViewText(R.id.widget_title, "Schema")
            views.setTextViewText(R.id.no_shifts_text, "Inga kommande pass")
            views.setViewVisibility(R.id.no_shifts_text, android.view.View.VISIBLE)
            views.setViewVisibility(R.id.shift_info_container, android.view.View.GONE)
        }

        // Lägg till klick-intent för att öppna appen
        val intent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent, 
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun showLoginRequired(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.schedule_widget)
        views.setTextViewText(R.id.widget_title, "Logga in")
        views.setTextViewText(R.id.no_shifts_text, "Logga in för att se ditt schema")
        views.setViewVisibility(R.id.no_shifts_text, android.view.View.VISIBLE)
        views.setViewVisibility(R.id.shift_info_container, android.view.View.GONE)
        
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun showError(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        error: String
    ) {
        val views = RemoteViews(context.packageName, R.layout.schedule_widget)
        views.setTextViewText(R.id.widget_title, "Fel")
        views.setTextViewText(R.id.no_shifts_text, "Kunde inte hämta schema: $error")
        views.setViewVisibility(R.id.no_shifts_text, android.view.View.VISIBLE)
        views.setViewVisibility(R.id.shift_info_container, android.view.View.GONE)
        
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun findNextShift(shifts: List<Shift>): Shift? {
        val now = Date()
        return shifts
            .filter { parseISODate(it.startTime)?.after(now) == true }
            .minByOrNull { parseISODate(it.startTime) ?: Date(Long.MAX_VALUE) }
    }

    private fun formatTime(isoString: String): String {
        return try {
            val date = parseISODate(isoString)
            val formatter = SimpleDateFormat("HH:mm", Locale.getDefault())
            formatter.format(date ?: Date())
        } catch (e: Exception) {
            isoString
        }
    }

    private fun parseISODate(isoString: String): Date? {
        return try {
            val formatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
            formatter.timeZone = TimeZone.getTimeZone("UTC")
            formatter.parse(isoString)
        } catch (e: Exception) {
            try {
                val formatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.getDefault())
                formatter.timeZone = TimeZone.getTimeZone("UTC")
                formatter.parse(isoString)
            } catch (e2: Exception) {
                null
            }
        }
    }

    private fun getStatusColor(status: String): Int {
        return when (status) {
            "confirmed" -> Color.GREEN
            "pending_trade" -> Color.parseColor("#FF9500") // Orange
            "cancelled" -> Color.RED
            else -> Color.GRAY
        }
    }

    private fun getAuthToken(): String {
        // Implementera hämtning av auth token från SharedPreferences eller Keychain
        // Detta bör synkroniseras med React Native-appen
        return ""
    }
}

data class Shift(
    val id: String,
    val startTime: String,
    val endTime: String,
    val position: String,
    val location: String,
    val status: String
)