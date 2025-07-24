// Test example for the generate-schedule Edge Function
// This shows how to call the function from a client application

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

async function testScheduleGeneration() {
  try {
    // Basic schedule generation
    const basicResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        scheduleName: 'Anpassat SSAB-skift'
      })
    });

    const basicResult = await basicResponse.json();
    console.log('Basic Schedule:', basicResult);

    // Advanced schedule generation with custom config
    const advancedResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        scheduleName: 'Anpassat SSAB-skift',
        config: {
          workPatternCycles: 2, // 2 work cycles before leave
          leaveDays: 7, // 7 days of leave
          teamStagger: true // Stagger teams
        }
      })
    });

    const advancedResult = await advancedResponse.json();
    console.log('Advanced Schedule:', advancedResult);

    // Display schedule in a readable format
    displaySchedule(advancedResult.schedule);
    console.log('Statistics:', advancedResult.stats);

  } catch (error) {
    console.error('Error testing schedule generation:', error);
  }
}

function displaySchedule(schedule) {
  console.log('\n--- SCHEDULE DISPLAY ---');
  console.log('Date\t\tA\tB\tC\tD');
  console.log('----------------------------------------');
  
  for (const [date, teams] of Object.entries(schedule)) {
    const teamA = teams.A || '-';
    const teamB = teams.B || '-';
    const teamC = teams.C || '-';
    const teamD = teams.D || '-';
    console.log(`${date}\t${teamA}\t${teamB}\t${teamC}\t${teamD}`);
  }
}

// Example usage in a React component
function ScheduleComponent() {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateSchedule = async (startDate, endDate) => {
    setLoading(true);
    try {
      const response = await fetch('/api/supabase/functions/generate-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          startDate,
          endDate,
          config: {
            workPatternCycles: 1,
            leaveDays: 5,
            teamStagger: true
          }
        })
      });

      const result = await response.json();
      if (response.ok) {
        setSchedule(result);
      } else {
        console.error('Error:', result.error);
      }
    } catch (error) {
      console.error('Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => generateSchedule('2024-01-01', '2024-01-31')}>
        Generate January Schedule
      </button>
      {loading && <p>Generating schedule...</p>}
      {schedule && (
        <div>
          <h3>Schedule Generated</h3>
          <pre>{JSON.stringify(schedule, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

// Example curl command for testing
/*
curl -X POST 'https://your-project.supabase.co/functions/v1/generate-schedule' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer your-anon-key' \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "scheduleName": "Anpassat SSAB-skift",
    "config": {
      "workPatternCycles": 1,
      "leaveDays": 5,
      "teamStagger": true
    }
  }'
*/

// Expected response format:
/*
{
  "schedule": {
    "2024-01-01": { "A": "M", "B": "A", "C": "N", "D": "L" },
    "2024-01-02": { "A": "M", "B": "A", "C": "N", "D": "L" },
    ...
  },
  "stats": {
    "totalDays": 31,
    "workDays": 93,
    "leaveDays": 31,
    "shiftDistribution": { "M": 31, "A": 31, "N": 31, "L": 31 },
    "teamStats": {
      "A": { "workDays": 23, "leaveDays": 8, "shifts": { "M": 9, "A": 7, "N": 7, "L": 8 } },
      ...
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
*/

// Run the test
if (typeof window === 'undefined') {
  // Node.js environment
  testScheduleGeneration();
}