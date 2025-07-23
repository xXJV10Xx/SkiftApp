# Home Screen Widget Implementation Guide

Detta dokument beskriver hur man implementerar home screen widgets för Skiftappen på både iOS och Android.

## Översikt

Widgets kommer att visa användarens nästa kommande skift direkt på hemskärmen, med möjlighet att öppna appen för mer detaljer.

## iOS Widget Implementation

### 1. Widget Extension Setup

Först, skapa en Widget Extension i Xcode:

```bash
# I Xcode: File > New > Target > Widget Extension
# Namn: "SkiftWidget"
# Language: Swift
# Include Configuration Intent: Ja
```

### 2. SwiftUI Widget View

```swift
// SkiftWidget.swift
import WidgetKit
import SwiftUI

struct SkiftWidgetEntryView : View {
    var entry: Provider.Entry
    
    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: "clock.fill")
                    .foregroundColor(.blue)
                Text("Nästa skift")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
            }
            
            if let nextShift = entry.nextShift {
                VStack(alignment: .leading, spacing: 4) {
                    Text(nextShift.title)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text(nextShift.formattedTime)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    HStack {
                        Circle()
                            .fill(Color(hex: nextShift.teamColor))
                            .frame(width: 8, height: 8)
                        Text(nextShift.teamName)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            } else {
                Text("Inga kommande skift")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
}

struct SkiftWidget: Widget {
    let kind: String = "SkiftWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            SkiftWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Skift Schema")
        .description("Visa ditt nästa skift")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

### 3. Widget Provider

```swift
// Provider.swift
import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), nextShift: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), nextShift: nil)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        Task {
            let nextShift = await fetchNextShift()
            let entry = SimpleEntry(date: Date(), nextShift: nextShift)
            
            // Uppdatera var 30:e minut
            let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            
            completion(timeline)
        }
    }
    
    private func fetchNextShift() async -> ShiftData? {
        guard let authToken = getStoredAuthToken() else { return nil }
        
        let url = URL(string: "https://your-supabase-url.supabase.co/rest/v1/rpc/get_next_shift")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            let shift = try JSONDecoder().decode(ShiftData.self, from: data)
            return shift
        } catch {
            print("Error fetching next shift: \(error)")
            return nil
        }
    }
    
    private func getStoredAuthToken() -> String? {
        // Hämta från Keychain eller UserDefaults
        return UserDefaults.standard.string(forKey: "widget_auth_token")
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let nextShift: ShiftData?
}

struct ShiftData: Codable {
    let id: String
    let title: String
    let startTime: String
    let endTime: String
    let teamName: String
    let teamColor: String
    
    var formattedTime: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        let start = ISO8601DateFormatter().date(from: startTime) ?? Date()
        let end = ISO8601DateFormatter().date(from: endTime) ?? Date()
        return "\(formatter.string(from: start)) - \(formatter.string(from: end))"
    }
}
```

### 4. Secure Token Storage

```swift
// KeychainHelper.swift
import Foundation
import Security

class KeychainHelper {
    static let standard = KeychainHelper()
    private init() {}
    
    func save(_ data: Data, service: String, account: String) {
        let query = [
            kSecValueData: data,
            kSecAttrService: service,
            kSecAttrAccount: account,
        ] as CFDictionary
        
        SecItemDelete(query)
        SecItemAdd(query, nil)
    }
    
    func read(service: String, account: String) -> Data? {
        let query = [
            kSecAttrService: service,
            kSecAttrAccount: account,
            kSecReturnData: true,
        ] as CFDictionary
        
        var result: AnyObject?
        SecItemCopyMatching(query, &result)
        
        return result as? Data
    }
}
```

## Android Widget Implementation

### 1. Widget Provider Class

```kotlin
// SkiftWidgetProvider.kt
package com.skiftapp.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.skiftapp.MainActivity
import com.skiftapp.R
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class SkiftWidgetProvider : AppWidgetProvider() {
    
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }
    
    private fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.skift_widget)
        
        // Skapa PendingIntent för att öppna appen
        val intent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
        
        // Hämta nästa skift asynkront
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val nextShift = fetchNextShift(context)
                views.setTextViewText(R.id.widget_title, nextShift?.title ?: "Inga skift")
                views.setTextViewText(R.id.widget_time, nextShift?.formattedTime ?: "")
                views.setTextViewText(R.id.widget_team, nextShift?.teamName ?: "")
                
                appWidgetManager.updateAppWidget(appWidgetId, views)
            } catch (e: Exception) {
                views.setTextViewText(R.id.widget_title, "Fel vid uppdatering")
                appWidgetManager.updateAppWidget(appWidgetId, views)
            }
        }
    }
    
    private suspend fun fetchNextShift(context: Context): ShiftData? {
        val authToken = getStoredAuthToken(context) ?: return null
        
        val url = "https://your-supabase-url.supabase.co/rest/v1/rpc/get_next_shift"
        val client = OkHttpClient()
        
        val request = Request.Builder()
            .url(url)
            .post("".toRequestBody("application/json".toMediaType()))
            .addHeader("Authorization", "Bearer $authToken")
            .addHeader("Content-Type", "application/json")
            .build()
        
        return try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val json = response.body?.string()
                // Parse JSON response
                parseShiftData(json)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
    
    private fun getStoredAuthToken(context: Context): String? {
        val sharedPrefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE)
        return sharedPrefs.getString("auth_token", null)
    }
    
    private fun parseShiftData(json: String?): ShiftData? {
        // Implementera JSON parsing
        return null // Placeholder
    }
}

data class ShiftData(
    val id: String,
    val title: String,
    val startTime: String,
    val endTime: String,
    val teamName: String,
    val teamColor: String
) {
    val formattedTime: String
        get() {
            val formatter = SimpleDateFormat("HH:mm", Locale.getDefault())
            val start = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                .parse(startTime) ?: Date()
            val end = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                .parse(endTime) ?: Date()
            return "${formatter.format(start)} - ${formatter.format(end)}"
        }
}
```

### 2. Widget Layout XML

```xml
<!-- res/layout/skift_widget.xml -->
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_container"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="12dp"
    android:background="@drawable/widget_background">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical">

        <ImageView
            android:layout_width="16dp"
            android:layout_height="16dp"
            android:src="@drawable/ic_clock"
            android:tint="@color/blue" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginStart="8dp"
            android:text="Nästa skift"
            android:textSize="12sp"
            android:textColor="@color/secondary_text" />

    </LinearLayout>

    <TextView
        android:id="@+id/widget_title"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:text="Laddar..."
        android:textSize="16sp"
        android:textStyle="bold"
        android:textColor="@color/primary_text"
        android:maxLines="2"
        android:ellipsize="end" />

    <TextView
        android:id="@+id/widget_time"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="4dp"
        android:text=""
        android:textSize="14sp"
        android:textColor="@color/secondary_text" />

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="4dp"
        android:orientation="horizontal"
        android:gravity="center_vertical">

        <View
            android:id="@+id/widget_team_color"
            android:layout_width="8dp"
            android:layout_height="8dp"
            android:background="@drawable/circle_background" />

        <TextView
            android:id="@+id/widget_team"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginStart="6dp"
            android:text=""
            android:textSize="12sp"
            android:textColor="@color/secondary_text" />

    </LinearLayout>

</LinearLayout>
```

### 3. Widget Background Drawable

```xml
<!-- res/drawable/widget_background.xml -->
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="@color/widget_background" />
    <corners android:radius="12dp" />
    <stroke
        android:width="1dp"
        android:color="@color/widget_border" />
</shape>
```

### 4. Widget Info XML

```xml
<!-- res/xml/skift_widget_info.xml -->
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="110dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/skift_widget"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen"
    android:previewImage="@drawable/widget_preview" />
```

## Backend RPC Function

Skapa en RPC-funktion i Supabase för att hämta nästa skift:

```sql
-- get_next_shift.sql
CREATE OR REPLACE FUNCTION get_next_shift()
RETURNS TABLE (
  id UUID,
  title TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  team_name TEXT,
  color_hex TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.start_time,
    s.end_time,
    st.name as team_name,
    st.color_hex
  FROM shifts s
  LEFT JOIN shift_teams st ON s.shift_team_id = st.id
  WHERE s.start_time > NOW()
  ORDER BY s.start_time ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Säker Token-hantering

### iOS Keychain Integration

```swift
// I huvudappen, när användaren loggar in:
func saveAuthTokenForWidget(_ token: String) {
    let data = token.data(using: .utf8)!
    KeychainHelper.standard.save(data, service: "skiftapp", account: "widget_token")
    
    // Uppdatera UserDefaults för widget
    UserDefaults.standard.set(token, forKey: "widget_auth_token")
}
```

### Android SharedPreferences Integration

```kotlin
// I huvudappen, när användaren loggar in:
fun saveAuthTokenForWidget(context: Context, token: String) {
    val sharedPrefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE)
    sharedPrefs.edit().putString("auth_token", token).apply()
}
```

## Widget Uppdatering

### iOS Widget Refresh

```swift
// I huvudappen efter skift-uppdateringar:
WidgetCenter.shared.reloadAllTimelines()
```

### Android Widget Refresh

```kotlin
// I huvudappen efter skift-uppdateringar:
val intent = Intent(context, SkiftWidgetProvider::class.java)
intent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
val ids = AppWidgetManager.getInstance(context).getAppWidgetIds(
    ComponentName(context, SkiftWidgetProvider::class.java)
)
intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
context.sendBroadcast(intent)
```

## Deployment Checklist

### iOS
- [ ] Skapa Widget Extension target
- [ ] Implementera SwiftUI widget view
- [ ] Konfigurera Widget Provider
- [ ] Säker token-lagring med Keychain
- [ ] Testa på fysisk enhet
- [ ] App Store review process

### Android
- [ ] Skapa widget layout XML
- [ ] Implementera AppWidgetProvider
- [ ] Konfigurera widget info XML
- [ ] Säker token-lagring med SharedPreferences
- [ ] Testa på fysisk enhet
- [ ] Google Play Store review process

### Backend
- [ ] Skapa RPC-funktion för nästa skift
- [ ] Konfigurera RLS policies
- [ ] Testa API-anrop
- [ ] Monitorera prestanda

## Prestanda och Batteri

- Widgets uppdateras max var 30:e minut
- Använd cached data när möjligt
- Implementera felhantering för nätverksfel
- Optimera API-anrop för minimal batterianvändning

## Säkerhet

- Tokens lagras säkert (Keychain/SharedPreferences)
- RLS policies skyddar användardata
- Widgets kan bara läsa data, inte skriva
- Implementera token refresh-logik 