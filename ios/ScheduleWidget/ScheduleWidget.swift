import WidgetKit
import SwiftUI
import Intents

struct ScheduleWidgetProvider: IntentTimelineProvider {
    func placeholder(in context: Context) -> ScheduleEntry {
        ScheduleEntry(date: Date(), shifts: sampleShifts)
    }

    func getSnapshot(for configuration: ConfigurationIntent, in context: Context, completion: @escaping (ScheduleEntry) -> ()) {
        let entry = ScheduleEntry(date: Date(), shifts: sampleShifts)
        completion(entry)
    }

    func getTimeline(for configuration: ConfigurationIntent, in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        Task {
            let shifts = await fetchUserShifts()
            let entry = ScheduleEntry(date: Date(), shifts: shifts)
            let timeline = Timeline(entries: [entry], policy: .atEnd)
            completion(timeline)
        }
    }
    
    private func fetchUserShifts() async -> [Shift] {
        // Hämta användarens skift från API
        guard let url = URL(string: "http://localhost:8000/api/schedule/\(getCurrentUserId())") else {
            return []
        }
        
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let response = try JSONDecoder().decode(APIResponse.self, from: data)
            return response.data
        } catch {
            print("Error fetching shifts: \(error)")
            return []
        }
    }
    
    private func getCurrentUserId() -> String {
        // Hämta användar-ID från UserDefaults eller Keychain
        return UserDefaults.standard.string(forKey: "current_user_id") ?? ""
    }
}

struct ScheduleEntry: TimelineEntry {
    let date: Date
    let shifts: [Shift]
}

struct Shift: Codable, Identifiable {
    let id: String
    let start_time: String
    let end_time: String
    let position: String?
    let location: String?
    let status: String
}

struct APIResponse: Codable {
    let success: Bool
    let data: [Shift]
}

struct ScheduleWidgetEntryView : View {
    var entry: ScheduleWidgetProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(shifts: entry.shifts)
        case .systemMedium:
            MediumWidgetView(shifts: entry.shifts)
        case .systemLarge:
            LargeWidgetView(shifts: entry.shifts)
        default:
            SmallWidgetView(shifts: entry.shifts)
        }
    }
}

struct SmallWidgetView: View {
    let shifts: [Shift]
    
    var nextShift: Shift? {
        let now = Date()
        return shifts.first { shift in
            guard let shiftDate = ISO8601DateFormatter().date(from: shift.start_time) else { return false }
            return shiftDate > now
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Nästa Pass")
                .font(.caption)
                .foregroundColor(.secondary)
            
            if let shift = nextShift {
                VStack(alignment: .leading, spacing: 2) {
                    Text(formatTime(shift.start_time))
                        .font(.headline)
                        .bold()
                    
                    Text(shift.position ?? "Arbete")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    HStack {
                        Circle()
                            .fill(statusColor(shift.status))
                            .frame(width: 8, height: 8)
                        Text(shift.status.capitalized)
                            .font(.caption2)
                    }
                }
            } else {
                Text("Inga kommande pass")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding()
        .background(Color(.systemBackground))
    }
}

struct MediumWidgetView: View {
    let shifts: [Shift]
    
    var todayShifts: [Shift] {
        let today = Calendar.current.startOfDay(for: Date())
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: today)!
        
        return shifts.filter { shift in
            guard let shiftDate = ISO8601DateFormatter().date(from: shift.start_time) else { return false }
            return shiftDate >= today && shiftDate < tomorrow
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Dagens Schema")
                .font(.headline)
                .bold()
            
            if todayShifts.isEmpty {
                Text("Inga pass idag")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            } else {
                ForEach(todayShifts.prefix(3)) { shift in
                    ShiftRowView(shift: shift)
                }
            }
            
            Spacer()
        }
        .padding()
        .background(Color(.systemBackground))
    }
}

struct LargeWidgetView: View {
    let shifts: [Shift]
    
    var upcomingShifts: [Shift] {
        let now = Date()
        return shifts.filter { shift in
            guard let shiftDate = ISO8601DateFormatter().date(from: shift.start_time) else { return false }
            return shiftDate > now
        }.prefix(5).map { $0 }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Kommande Pass")
                .font(.headline)
                .bold()
            
            if upcomingShifts.isEmpty {
                Text("Inga kommande pass")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            } else {
                ForEach(upcomingShifts, id: \.id) { shift in
                    ShiftRowView(shift: shift, showDate: true)
                }
            }
            
            Spacer()
        }
        .padding()
        .background(Color(.systemBackground))
    }
}

struct ShiftRowView: View {
    let shift: Shift
    let showDate: Bool
    
    init(shift: Shift, showDate: Bool = false) {
        self.shift = shift
        self.showDate = showDate
    }
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                if showDate {
                    Text(formatDate(shift.start_time))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                
                Text("\(formatTime(shift.start_time)) - \(formatTime(shift.end_time))")
                    .font(.subheadline)
                    .bold()
                
                if let position = shift.position {
                    Text(position)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            Circle()
                .fill(statusColor(shift.status))
                .frame(width: 12, height: 12)
        }
    }
}

// Hjälpfunktioner
func formatTime(_ isoString: String) -> String {
    guard let date = ISO8601DateFormatter().date(from: isoString) else { return "" }
    let formatter = DateFormatter()
    formatter.timeStyle = .short
    return formatter.string(from: date)
}

func formatDate(_ isoString: String) -> String {
    guard let date = ISO8601DateFormatter().date(from: isoString) else { return "" }
    let formatter = DateFormatter()
    formatter.dateStyle = .short
    return formatter.string(from: date)
}

func statusColor(_ status: String) -> Color {
    switch status {
    case "confirmed":
        return .green
    case "pending_trade":
        return .orange
    case "cancelled":
        return .red
    default:
        return .gray
    }
}

let sampleShifts = [
    Shift(id: "1", start_time: "2024-01-15T08:00:00Z", end_time: "2024-01-15T16:00:00Z", position: "Reception", location: "Våning 1", status: "confirmed"),
    Shift(id: "2", start_time: "2024-01-16T12:00:00Z", end_time: "2024-01-16T20:00:00Z", position: "Avdelning A", location: "Våning 2", status: "pending_trade")
]

struct ScheduleWidget: Widget {
    let kind: String = "ScheduleWidget"

    var body: some WidgetConfiguration {
        IntentConfiguration(kind: kind, intent: ConfigurationIntent.self, provider: ScheduleWidgetProvider()) { entry in
            ScheduleWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Schema Widget")
        .description("Visa dina kommande arbetspass")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct ScheduleWidget_Previews: PreviewProvider {
    static var previews: some View {
        ScheduleWidgetEntryView(entry: ScheduleEntry(date: Date(), shifts: sampleShifts))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
    }
}