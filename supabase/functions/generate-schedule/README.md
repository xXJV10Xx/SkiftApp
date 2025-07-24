# 🏭 SSAB Schedule Generation System

A sophisticated Supabase Edge Function for generating complex shift schedules based on the SSAB 3-shift system with work patterns, team states, and configurable parameters.

## 🌟 Features

- **Complex Shift Patterns**: Supports SSAB 3-shift system with 14-day cycles
- **Team State Management**: Tracks and persists team states across work and leave blocks
- **Configurable Parameters**: Customizable work cycles, leave days, and team staggering
- **Statistics Generation**: Provides detailed analytics on generated schedules
- **Database Integration**: Full integration with Supabase database schema
- **Type Safety**: Complete TypeScript implementation with proper interfaces

## 🗄️ Database Schema

The system requires the following database tables:

### Core Tables
- `companies` - Company information
- `schedules` - Schedule configurations
- `work_patterns` - Shift pattern definitions
- `teams` - Team information and assignments
- `team_states` - Current state tracking for each team
- `employees` - Employee information (optional)
- `shifts` - Generated shift assignments (optional)

### Setup Database
Run the migration file to set up the complete schema:
```sql
-- Run: supabase/migrations/001_schedule_system.sql
```

## 📁 File Structure

```
supabase/functions/generate-schedule/
├── index.ts                 # Main Edge Function
├── advanced-scheduler.ts    # Core scheduling logic
├── test-example.js         # Usage examples
└── README.md               # This documentation

supabase/functions/_shared/
└── cors.ts                 # CORS headers

supabase/migrations/
└── 001_schedule_system.sql # Database schema
```

## 🚀 API Usage

### Basic Request
```javascript
POST /functions/v1/generate-schedule

{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "scheduleName": "Anpassat SSAB-skift"
}
```

### Advanced Request with Configuration
```javascript
POST /functions/v1/generate-schedule

{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "scheduleName": "Anpassat SSAB-skift",
  "config": {
    "workPatternCycles": 2,    // Number of work cycles before leave
    "leaveDays": 7,            // Days of leave after work cycles
    "teamStagger": true        // Whether to stagger team schedules
  }
}
```

### Response Format
```javascript
{
  "schedule": {
    "2024-01-01": { "A": "M", "B": "A", "C": "N", "D": "L" },
    "2024-01-02": { "A": "M", "B": "A", "C": "N", "D": "L" },
    // ... more dates
  },
  "stats": {
    "totalDays": 31,
    "workDays": 93,
    "leaveDays": 31,
    "shiftDistribution": { "M": 31, "A": 31, "N": 31, "L": 31 },
    "teamStats": {
      "A": { "workDays": 23, "leaveDays": 8, "shifts": {...} }
    }
  },
  "config": {
    "workPatternCycles": 1,
    "leaveDays": 5,
    "teamStagger": true
  },
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }
}
```

## 🔧 Configuration Options

### ScheduleConfig Interface
```typescript
interface ScheduleConfig {
  workPatternCycles: number;  // Default: 1
  leaveDays: number;         // Default: 5
  teamStagger: boolean;      // Default: true
}
```

### Shift Codes
- `M` - Morgon (Morning): 06:00-14:00
- `A` - Kväll (Evening): 14:00-22:00
- `N` - Natt (Night): 22:00-06:00
- `L` - Ledig (Leave/Off)

### Work Pattern
SSAB 3-shift uses a 14-day cycle:
```
['M', 'M', 'M', 'A', 'A', 'A', 'N', 'N', 'N', 'L', 'L', 'L', 'L', 'L']
```

## 🏗️ System Architecture

### 1. SSABScheduler Class
Main scheduling engine with methods:
- `generateSchedule()` - Generate complete schedule
- `generateTeamSchedule()` - Generate schedule for specific team
- `getNextDayState()` - Calculate next day's state
- `calculateScheduleStats()` - Generate statistics

### 2. State Management
Each team has a state tracking:
- Current block type (WORK/LEAVE)
- Day within current block
- Work pattern information
- Pattern cycle count

### 3. Team Staggering
Teams are offset to ensure continuous coverage:
- Team A: No offset
- Team B: 25% cycle offset
- Team C: 50% cycle offset  
- Team D: 75% cycle offset

## 📊 Statistics and Analytics

The system provides comprehensive statistics:

### Overall Stats
- Total days in range
- Total work days across all teams
- Total leave days across all teams
- Shift distribution (M/A/N/L counts)

### Per-Team Stats
- Work days per team
- Leave days per team
- Shift type distribution per team

## 🧪 Testing

### Using curl
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/generate-schedule' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer your-anon-key' \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "scheduleName": "Anpassat SSAB-skift"
  }'
```

### Using JavaScript
See `test-example.js` for complete examples including:
- Basic schedule generation
- Advanced configuration
- React component integration
- Error handling

## 🔍 Troubleshooting

### Common Issues

1. **"Schedule not found"**
   - Ensure the schedule exists in the database
   - Check the schedule name spelling
   - Verify database permissions

2. **"No team states found"**
   - Initialize team states in the database
   - Check team_states table has data
   - Verify team relationships

3. **"Invalid date format"**
   - Use YYYY-MM-DD format
   - Ensure start date is before end date
   - Check date range is not too large (max 365 days)

### Database Verification
```sql
-- Check if schedule exists
SELECT * FROM schedules WHERE name = 'Anpassat SSAB-skift';

-- Check team states
SELECT t.name, ts.* 
FROM teams t 
JOIN team_states ts ON t.id = ts.team_id 
ORDER BY t.name, ts.state_date DESC;

-- Check work patterns
SELECT * FROM work_patterns WHERE name = 'SSAB 3-skift';
```

## 🚀 Deployment

### 1. Database Setup
```bash
# Run the migration
supabase db reset
# or
psql -h your-host -d your-db -f supabase/migrations/001_schedule_system.sql
```

### 2. Deploy Edge Function
```bash
supabase functions deploy generate-schedule
```

### 3. Set Environment Variables
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## 📈 Performance Considerations

- **Date Range Limit**: Maximum 365 days per request
- **Team State Persistence**: States are saved for future calculations
- **Database Indexing**: Proper indexes on date and team columns
- **Memory Usage**: Efficient state management for large date ranges

## 🔮 Future Enhancements

- [ ] Support for multiple work pattern types
- [ ] Holiday and special event handling
- [ ] Shift swap and override capabilities
- [ ] Integration with employee availability
- [ ] Advanced reporting and analytics
- [ ] Bulk schedule generation for multiple periods
- [ ] Real-time schedule updates via WebSocket

## 📝 License

This system is designed for SSAB shift scheduling and can be adapted for similar industrial shift patterns.

## 🤝 Contributing

When contributing to this system:
1. Maintain TypeScript type safety
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Follow the existing code structure and patterns

## 📞 Support

For questions or issues:
1. Check the troubleshooting section
2. Verify database schema is correct
3. Test with the provided examples
4. Check Supabase function logs for errors