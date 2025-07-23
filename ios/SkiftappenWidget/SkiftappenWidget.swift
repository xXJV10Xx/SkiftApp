import WidgetKit
import SwiftUI
import Intents

// MARK: - Widget Configuration
struct Provider: IntentTimelineProvider {
    func placeholder(in context: Context) -> ShiftEntry {
        ShiftEntry(date: Date(), shift: ShiftData.placeholder())
    }

    func getSnapshot(for configuration: ConfigurationIntent, in context: Context, completion: @escaping (ShiftEntry) -> ()) {
        let entry = ShiftEntry(date: Date(), shift: ShiftData.placeholder())
        completion(entry)
    }

    func getTimeline(for configuration: ConfigurationIntent, in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        Task {
            do {
                let shifts = try await SupabaseService.shared.fetchUserShifts()
                let nextShift = shifts.first { $0.startTime > Date() }
                
                let entry = ShiftEntry(
                    date: Date(),
                    shift: nextShift ?? ShiftData.noShifts()
                )
                
                // Update every hour
                let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
                let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
                completion(timeline)
            } catch {
                // Fallback on error
                let entry = ShiftEntry(date: Date(), shift: ShiftData.error())
                let timeline = Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(3600)))
                completion(timeline)
            }
        }
    }
}

// MARK: - Data Models
struct ShiftEntry: TimelineEntry {
    let date: Date
    let shift: ShiftData
}

struct ShiftData {
    let id: String
    let title: String
    let startTime: Date
    let endTime: Date
    let location: String?
    let description: String?
    let isPlaceholder: Bool
    let isError: Bool
    let isEmpty: Bool
    
    static func placeholder() -> ShiftData {
        return ShiftData(
            id: "placeholder",
            title: "Morgonpass",
            startTime: Date().addingTimeInterval(3600),
            endTime: Date().addingTimeInterval(3600 * 9),
            location: "Huvudkontoret",
            description: "Vanligt morgonpass",
            isPlaceholder: true,
            isError: false,
            isEmpty: false
        )
    }
    
    static func noShifts() -> ShiftData {
        return ShiftData(
            id: "empty",
            title: "Inga kommande pass",
            startTime: Date(),
            endTime: Date(),
            location: nil,
            description: "Du har inga schemalagda pass",
            isPlaceholder: false,
            isError: false,
            isEmpty: true
        )
    }
    
    static func error() -> ShiftData {
        return ShiftData(
            id: "error",
            title: "Kunde inte ladda data",
            startTime: Date(),
            endTime: Date(),
            location: nil,
            description: "Tryck för att öppna appen",
            isPlaceholder: false,
            isError: true,
            isEmpty: false
        )
    }
}

// MARK: - Widget View
struct SkiftappenWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(shift: entry.shift)
        case .systemMedium:
            MediumWidgetView(shift: entry.shift)
        case .systemLarge:
            LargeWidgetView(shift: entry.shift)
        @unknown default:
            SmallWidgetView(shift: entry.shift)
        }
    }
}

// MARK: - Small Widget View
struct SmallWidgetView: View {
    let shift: ShiftData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: "clock")
                    .foregroundColor(.blue)
                Text("Skiftappen")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                Spacer()
            }
            
            Spacer()
            
            if shift.isEmpty {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Inga pass")
                        .font(.headline)
                        .fontWeight(.bold)
                    Text("idag")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            } else if shift.isError {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Fel")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(.red)
                    Text("Tryck för att uppdatera")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            } else {
                VStack(alignment: .leading, spacing: 2) {
                    Text(shift.title)
                        .font(.headline)
                        .fontWeight(.bold)
                        .lineLimit(1)
                    
                    Text(formatTime(shift.startTime))
                        .font(.subheadline)
                        .foregroundColor(.blue)
                    
                    if let location = shift.location {
                        Text(location)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                }
            }
            
            Spacer()
        }
        .padding()
        .background(Color(.systemBackground))
    }
}

// MARK: - Medium Widget View
struct MediumWidgetView: View {
    let shift: ShiftData
    
    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "clock")
                        .foregroundColor(.blue)
                    Text("Nästa pass")
                        .font(.headline)
                        .fontWeight(.semibold)
                    Spacer()
                }
                
                if shift.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Inga kommande pass")
                            .font(.title2)
                            .fontWeight(.bold)
                        Text("Du har vildag idag! 🎉")
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                } else if shift.isError {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Kunde inte ladda data")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                        Text("Tryck för att öppna appen")
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                } else {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(shift.title)
                            .font(.title2)
                            .fontWeight(.bold)
                            .lineLimit(1)
                        
                        HStack {
                            Text(formatTime(shift.startTime))
                            Text("-")
                            Text(formatTime(shift.endTime))
                        }
                        .font(.body)
                        .foregroundColor(.blue)
                        
                        if let location = shift.location {
                            HStack {
                                Image(systemName: "location")
                                    .foregroundColor(.secondary)
                                Text(location)
                                    .foregroundColor(.secondary)
                            }
                            .font(.caption)
                        }
                        
                        if let description = shift.description {
                            Text(description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .lineLimit(2)
                        }
                    }
                }
                
                Spacer()
            }
            
            Spacer()
            
            // Time until shift
            if !shift.isEmpty && !shift.isError {
                VStack {
                    Text(timeUntilShift(shift.startTime))
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                        .multilineTextAlignment(.center)
                    
                    Text("kvar")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
}

// MARK: - Large Widget View
struct LargeWidgetView: View {
    let shift: ShiftData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Image(systemName: "clock")
                    .foregroundColor(.blue)
                Text("Skiftappen")
                    .font(.title2)
                    .fontWeight(.semibold)
                Spacer()
                Text(formatDate(Date()))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Divider()
            
            if shift.isEmpty {
                VStack(alignment: .center, spacing: 16) {
                    Image(systemName: "calendar.badge.exclamationmark")
                        .font(.system(size: 40))
                        .foregroundColor(.blue)
                    
                    Text("Inga kommande pass")
                        .font(.title)
                        .fontWeight(.bold)
                    
                    Text("Du har vildag! Njut av din lediga tid 🎉")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if shift.isError {
                VStack(alignment: .center, spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 40))
                        .foregroundColor(.red)
                    
                    Text("Kunde inte ladda data")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.red)
                    
                    Text("Tryck för att öppna appen och försök igen")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack(alignment: .leading, spacing: 12) {
                    // Shift title
                    Text(shift.title)
                        .font(.title)
                        .fontWeight(.bold)
                    
                    // Time info
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Starttid")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(formatTime(shift.startTime))
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(.blue)
                        }
                        
                        Spacer()
                        
                        VStack(alignment: .trailing, spacing: 4) {
                            Text("Sluttid")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(formatTime(shift.endTime))
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(.blue)
                        }
                    }
                    
                    // Location
                    if let location = shift.location {
                        HStack {
                            Image(systemName: "location")
                                .foregroundColor(.secondary)
                            Text(location)
                                .font(.body)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    // Description
                    if let description = shift.description {
                        Text(description)
                            .font(.body)
                            .foregroundColor(.secondary)
                            .lineLimit(3)
                    }
                    
                    Spacer()
                    
                    // Time until shift
                    HStack {
                        Spacer()
                        VStack {
                            Text(timeUntilShift(shift.startTime))
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.blue)
                                .multilineTextAlignment(.center)
                            
                            Text("kvar till passet")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
}

// MARK: - Widget Configuration
struct SkiftappenWidget: Widget {
    let kind: String = "SkiftappenWidget"

    var body: some WidgetConfiguration {
        IntentConfiguration(kind: kind, intent: ConfigurationIntent.self, provider: Provider()) { entry in
            SkiftappenWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Skiftappen")
        .description("Visa dina kommande arbetspass direkt på hemskärmen")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Helper Functions
private func formatTime(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.timeStyle = .short
    formatter.locale = Locale(identifier: "sv_SE")
    return formatter.string(from: date)
}

private func formatDate(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateStyle = .medium
    formatter.locale = Locale(identifier: "sv_SE")
    return formatter.string(from: date)
}

private func timeUntilShift(_ shiftStart: Date) -> String {
    let now = Date()
    let timeInterval = shiftStart.timeIntervalSince(now)
    
    if timeInterval < 0 {
        return "Pågår"
    }
    
    let hours = Int(timeInterval) / 3600
    let minutes = Int(timeInterval % 3600) / 60
    
    if hours > 24 {
        let days = hours / 24
        return "\(days) dag\(days == 1 ? "" : "ar")"
    } else if hours > 0 {
        return "\(hours)h \(minutes)m"
    } else {
        return "\(minutes) min"
    }
}

// MARK: - Preview
struct SkiftappenWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            SkiftappenWidgetEntryView(entry: ShiftEntry(date: Date(), shift: ShiftData.placeholder()))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
            
            SkiftappenWidgetEntryView(entry: ShiftEntry(date: Date(), shift: ShiftData.placeholder()))
                .previewContext(WidgetPreviewContext(family: .systemMedium))
            
            SkiftappenWidgetEntryView(entry: ShiftEntry(date: Date(), shift: ShiftData.placeholder()))
                .previewContext(WidgetPreviewContext(family: .systemLarge))
        }
    }
}