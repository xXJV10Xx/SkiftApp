package com.skiftappen.widget

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.TimeUnit

/**
 * Service for communicating with Supabase API from Android widget
 */
class SupabaseService private constructor(private val context: Context) {
    
    companion object {
        private const val SUPABASE_URL = "https://fsefeherdbtsddqimjco.supabase.co"
        private const val SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk"
        private const val PREFS_NAME = "skiftappen_widget_prefs"
        private const val KEY_ACCESS_TOKEN = "supabase_access_token"
        private const val KEY_USER_ID = "user_id"
        
        @Volatile
        private var INSTANCE: SupabaseService? = null
        
        fun getInstance(context: Context): SupabaseService {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SupabaseService(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
    
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    
    /**
     * Fetch the next upcoming shift for the authenticated user
     */
    suspend fun fetchNextShift(): ShiftData? = withContext(Dispatchers.IO) {
        val accessToken = prefs.getString(KEY_ACCESS_TOKEN, null)
        val userId = prefs.getString(KEY_USER_ID, null)
        
        if (accessToken.isNullOrEmpty() || userId.isNullOrEmpty()) {
            throw IllegalStateException("User not authenticated")
        }
        
        val now = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }.format(Date())
        
        val url = "$SUPABASE_URL/rest/v1/shifts" +
                "?owner_id=eq.$userId" +
                "&start_time=gt.$now" +
                "&order=start_time.asc" +
                "&limit=1"
        
        val request = Request.Builder()
            .url(url)
            .addHeader("apikey", SUPABASE_ANON_KEY)
            .addHeader("Authorization", "Bearer $accessToken")
            .addHeader("Content-Type", "application/json")
            .get()
            .build()
        
        try {
            val response = httpClient.newCall(request).execute()
            
            if (!response.isSuccessful) {
                throw IOException("HTTP ${response.code}: ${response.message}")
            }
            
            val responseBody = response.body?.string() ?: throw IOException("Empty response body")
            val jsonArray = JSONArray(responseBody)
            
            if (jsonArray.length() == 0) {
                return@withContext null
            }
            
            val shiftJson = jsonArray.getJSONObject(0)
            return@withContext parseShiftFromJson(shiftJson)
            
        } catch (e: Exception) {
            throw IOException("Failed to fetch shifts: ${e.message}", e)
        }
    }
    
    /**
     * Store authentication data for widget use
     */
    fun storeAuthenticationData(accessToken: String, userId: String) {
        prefs.edit()
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .putString(KEY_USER_ID, userId)
            .apply()
    }
    
    /**
     * Clear stored authentication data
     */
    fun clearAuthenticationData() {
        prefs.edit()
            .remove(KEY_ACCESS_TOKEN)
            .remove(KEY_USER_ID)
            .apply()
    }
    
    /**
     * Check if user is authenticated
     */
    fun isAuthenticated(): Boolean {
        val accessToken = prefs.getString(KEY_ACCESS_TOKEN, null)
        val userId = prefs.getString(KEY_USER_ID, null)
        return !accessToken.isNullOrEmpty() && !userId.isNullOrEmpty()
    }
    
    private fun parseShiftFromJson(json: JSONObject): ShiftData {
        val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        
        return ShiftData(
            id = json.getString("id"),
            title = json.getString("title"),
            startTime = dateFormat.parse(json.getString("start_time").replace("Z", "").substring(0, 19)) ?: Date(),
            endTime = dateFormat.parse(json.getString("end_time").replace("Z", "").substring(0, 19)) ?: Date(),
            location = if (json.isNull("location")) null else json.getString("location"),
            description = if (json.isNull("description")) null else json.getString("description")
        )
    }
}