import Foundation

// MARK: - Supabase Service for Widget
class SupabaseService {
    static let shared = SupabaseService()
    
    private let supabaseURL = "https://fsefeherdbtsddqimjco.supabase.co"
    private let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk"
    
    private init() {}
    
    // MARK: - Fetch User Shifts
    func fetchUserShifts() async throws -> [ShiftData] {
        // Get user token from UserDefaults (should be set by main app)
        guard let userToken = UserDefaults(suiteName: "group.skiftappen")?.string(forKey: "supabase_access_token"),
              let userId = UserDefaults(suiteName: "group.skiftappen")?.string(forKey: "user_id") else {
            throw SupabaseError.notAuthenticated
        }
        
        // Prepare URL
        guard let url = URL(string: "\(supabaseURL)/rest/v1/shifts") else {
            throw SupabaseError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(supabaseAnonKey)", forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(userToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add query parameters
        var components = URLComponents(url: url, resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "owner_id", value: "eq.\(userId)"),
            URLQueryItem(name: "start_time", value: "gt.\(ISO8601DateFormatter().string(from: Date()))"),
            URLQueryItem(name: "order", value: "start_time.asc"),
            URLQueryItem(name: "limit", value: "5")
        ]
        
        request.url = components.url
        
        // Perform request
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw SupabaseError.httpError(httpResponse.statusCode)
        }
        
        // Parse response
        let shifts = try JSONDecoder().decode([SupabaseShift].self, from: data)
        
        return shifts.map { shift in
            ShiftData(
                id: shift.id,
                title: shift.title,
                startTime: ISO8601DateFormatter().date(from: shift.start_time) ?? Date(),
                endTime: ISO8601DateFormatter().date(from: shift.end_time) ?? Date(),
                location: shift.location,
                description: shift.description,
                isPlaceholder: false,
                isError: false,
                isEmpty: false
            )
        }
    }
    
    // MARK: - Store Authentication Data
    func storeAuthenticationData(accessToken: String, userId: String) {
        let userDefaults = UserDefaults(suiteName: "group.skiftappen")
        userDefaults?.set(accessToken, forKey: "supabase_access_token")
        userDefaults?.set(userId, forKey: "user_id")
    }
    
    // MARK: - Clear Authentication Data
    func clearAuthenticationData() {
        let userDefaults = UserDefaults(suiteName: "group.skiftappen")
        userDefaults?.removeObject(forKey: "supabase_access_token")
        userDefaults?.removeObject(forKey: "user_id")
    }
}

// MARK: - Data Models
struct SupabaseShift: Codable {
    let id: String
    let owner_id: String
    let start_time: String
    let end_time: String
    let title: String
    let description: String?
    let location: String?
    let created_at: String
    let updated_at: String
}

// MARK: - Errors
enum SupabaseError: Error, LocalizedError {
    case notAuthenticated
    case invalidURL
    case invalidResponse
    case httpError(Int)
    
    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "User not authenticated"
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response"
        case .httpError(let code):
            return "HTTP error: \(code)"
        }
    }
}