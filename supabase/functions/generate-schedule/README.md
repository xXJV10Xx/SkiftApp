# Generate Schedule Edge Function

A Supabase Edge Function that generates team schedules based on work patterns and team states.

## Overview

This function simulates team schedules day-by-day from a start date to an end date, following these rules:

- **WORK blocks**: Follow the composition array from work patterns
- **LEAVE blocks**: Count down leave days (4 or 5 based on n_count)
- **Transitions**: From WORK to LEAVE after completing a work cycle
- **Next work start**: Must be on Monday, Wednesday, or Friday
- **Pattern alternation**: Balances schedules by alternating between available work patterns

## Database Setup

### 1. Create Required Tables

Run the SQL commands from `schema.sql` in your Supabase SQL Editor to create:

- `schedules` - Active schedules for teams
- `work_patterns` - Shift patterns with composition arrays
- `team_states` - Current state tracking for each team

### 2. Sample Data

```sql
-- Example: Create schedules for existing teams
INSERT INTO schedules (team_id, is_active) 
SELECT id, true FROM teams LIMIT 2;

-- Example: Create work patterns
INSERT INTO work_patterns (schedule_id, name, composition, n_count) VALUES 
  ((SELECT id FROM schedules LIMIT 1), 'Day Shift Pattern', ARRAY['F', 'E', 'N', 'N'], 4),
  ((SELECT id FROM schedules LIMIT 1), 'Night Shift Pattern', ARRAY['E', 'N', 'F', 'F'], 5);

-- Example: Set initial team states
INSERT INTO team_states (team_id, date, state_type, current_day, total_days, work_pattern_id, n_count) 
SELECT 
  t.id,
  '2024-01-01',
  'WORK',
  1,
  4,
  wp.id,
  wp.n_count
FROM teams t
JOIN schedules s ON s.team_id = t.id
JOIN work_patterns wp ON wp.schedule_id = s.id
LIMIT 1;
```

## Deployment

### 1. Deploy to Supabase

```bash
# Initialize Supabase (if not already done)
supabase init

# Deploy the function
supabase functions deploy generate-schedule

# Set environment variables (if needed)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Environment Variables

The function uses these environment variables (automatically available in Supabase Edge Functions):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access

## API Usage

### Endpoint

```
POST https://your-project.supabase.co/functions/v1/generate-schedule
```

### Headers

```
Authorization: Bearer YOUR_ANON_KEY
Content-Type: application/json
```

### Request Body

```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

### Response

```json
{
  "2024-01-01": {
    "Team Alpha": "F",
    "Team Beta": "E"
  },
  "2024-01-02": {
    "Team Alpha": "E", 
    "Team Beta": "N"
  },
  "2024-01-03": {
    "Team Alpha": "N",
    "Team Beta": "L"
  }
}
```

### Shift Codes

- `F` - Day shift (First)
- `E` - Evening shift
- `N` - Night shift
- `L` - Leave day

## Example Usage

### JavaScript/TypeScript

```typescript
const response = await fetch('https://your-project.supabase.co/functions/v1/generate-schedule', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  })
});

const schedule = await response.json();
console.log(schedule);
```

### cURL

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/generate-schedule' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
```

## Algorithm Details

### Work Block Logic

1. Follow the `composition` array from the current work pattern
2. Assign shift codes in sequence: day 1 gets `composition[0]`, day 2 gets `composition[1]`, etc.
3. On the last day of the pattern, calculate leave days based on `n_count`
4. Switch to LEAVE state

### Leave Block Logic

1. Assign 'L' for each leave day
2. Count down from `n_count` (4 or 5 days)
3. On the last leave day, find the next valid work start day (Mon/Wed/Fri)
4. Switch to WORK state with the next available work pattern

### Pattern Alternation

- Teams with multiple work patterns alternate between them
- This helps balance the overall schedule
- Pattern selection cycles through available patterns in order

## Error Handling

The function returns appropriate HTTP status codes:

- `200` - Success with schedule data
- `400` - Bad request (invalid dates, missing parameters)
- `404` - No teams found
- `500` - Internal server error

Error responses include details:

```json
{
  "error": "Invalid date format. Use YYYY-MM-DD",
  "details": "Additional error information"
}
```

## Performance Considerations

- The function processes each day sequentially for accuracy
- For large date ranges (>90 days), consider breaking into smaller chunks
- Database queries are optimized with proper indexes
- Team states are cached in memory during processing

## Troubleshooting

### Common Issues

1. **No teams found**: Ensure teams exist in the database
2. **No work patterns**: Create work patterns linked to team schedules
3. **Invalid dates**: Use YYYY-MM-DD format
4. **Permission errors**: Check RLS policies and authentication

### Debugging

Enable function logs in Supabase Dashboard → Edge Functions → Logs to see detailed error information.

## Contributing

When modifying the function:

1. Update types if changing database schema
2. Test with various date ranges and team configurations
3. Ensure proper error handling for edge cases
4. Update documentation for any API changes