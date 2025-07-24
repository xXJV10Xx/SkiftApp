import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types for the database tables
interface TeamState {
  id: string;
  team_id: string;
  date: string;
  state_type: 'WORK' | 'LEAVE';
  current_day: number;
  total_days: number;
  work_pattern_id?: string;
  n_count?: number;
  created_at: string;
}

interface Schedule {
  id: string;
  team_id: string;
  is_active: boolean;
  created_at: string;
}

interface WorkPattern {
  id: string;
  schedule_id: string;
  name: string;
  composition: string[]; // Array of shift codes like ['F', 'E', 'N', 'N']
  n_count: number; // 4 or 5 - determines leave days
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  company_id: string;
  created_at: string;
}

interface GenerateScheduleRequest {
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
}

interface ScheduleResponse {
  [date: string]: {
    [teamName: string]: string; // 'F', 'E', 'N', or 'L'
  };
}

serve(async (req) => {
  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Parse request body
    const { startDate, endDate }: GenerateScheduleRequest = await req.json();

    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'startDate and endDate are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate date format
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return new Response(
        JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (startDateObj >= endDateObj) {
      return new Response(
        JSON.stringify({ error: 'startDate must be before endDate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Fetch all teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*');

    if (teamsError) {
      throw new Error(`Failed to fetch teams: ${teamsError.message}`);
    }

    if (!teams || teams.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No teams found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Fetch latest team states before startDate for each team
    const teamStates: { [teamId: string]: TeamState } = {};
    
    for (const team of teams) {
      const { data: latestState, error: stateError } = await supabase
        .from('team_states')
        .select('*')
        .eq('team_id', team.id)
        .lt('date', startDate)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (stateError && stateError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw new Error(`Failed to fetch team state for team ${team.id}: ${stateError.message}`);
      }

      if (latestState) {
        teamStates[team.id] = latestState;
      }
    }

    // Step 3: Fetch schedules and work patterns
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select(`
        *,
        work_patterns (*)
      `)
      .eq('is_active', true);

    if (schedulesError) {
      throw new Error(`Failed to fetch schedules: ${schedulesError.message}`);
    }

    // Organize work patterns by team
    const teamWorkPatterns: { [teamId: string]: WorkPattern[] } = {};
    const teamSchedules: { [teamId: string]: Schedule } = {};

    if (schedules) {
      for (const schedule of schedules) {
        teamSchedules[schedule.team_id] = schedule;
        if (schedule.work_patterns) {
          teamWorkPatterns[schedule.team_id] = schedule.work_patterns;
        }
      }
    }

    // Step 4: Generate schedule day by day
    const result: ScheduleResponse = {};
    const currentDate = new Date(startDateObj);

    // Helper function to get next valid start day (Mon, Wed, Fri)
    const getNextValidStartDay = (date: Date): Date => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayOfWeek = nextDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const validDays = [1, 3, 5]; // Monday, Wednesday, Friday
      
      if (validDays.includes(dayOfWeek)) {
        return nextDay;
      }
      
      // Find next valid day
      let daysToAdd = 1;
      while (daysToAdd <= 7) {
        const testDate = new Date(nextDay);
        testDate.setDate(testDate.getDate() + daysToAdd);
        if (validDays.includes(testDate.getDay())) {
          return testDate;
        }
        daysToAdd++;
      }
      
      return nextDay; // Fallback
    };

    // Helper function to format date as YYYY-MM-DD
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    // Track current state for each team
    const currentTeamStates: { [teamId: string]: {
      stateType: 'WORK' | 'LEAVE';
      currentDay: number;
      totalDays: number;
      workPatternId?: string;
      workPatternIndex: number;
      nCount?: number;
    } } = {};

    // Initialize current states
    for (const team of teams) {
      const teamState = teamStates[team.id];
      if (teamState) {
        currentTeamStates[team.id] = {
          stateType: teamState.state_type,
          currentDay: teamState.current_day,
          totalDays: teamState.total_days,
          workPatternId: teamState.work_pattern_id,
          workPatternIndex: 0,
          nCount: teamState.n_count
        };
      } else {
        // Default state if no previous state found
        const patterns = teamWorkPatterns[team.id];
        currentTeamStates[team.id] = {
          stateType: 'WORK',
          currentDay: 1,
          totalDays: patterns?.[0]?.composition.length || 4,
          workPatternId: patterns?.[0]?.id,
          workPatternIndex: 0,
          nCount: patterns?.[0]?.n_count || 4
        };
      }
    }

    // Generate schedule for each day
    while (currentDate <= endDateObj) {
      const dateStr = formatDate(currentDate);
      result[dateStr] = {};

      for (const team of teams) {
        const teamId = team.id;
        const teamName = team.name;
        const state = currentTeamStates[teamId];
        const patterns = teamWorkPatterns[teamId] || [];

        if (state.stateType === 'WORK') {
          // Find current work pattern
          const currentPattern = patterns.find(p => p.id === state.workPatternId) || patterns[0];
          
          if (currentPattern && currentPattern.composition) {
            const dayIndex = (state.currentDay - 1) % currentPattern.composition.length;
            const shiftCode = currentPattern.composition[dayIndex];
            result[dateStr][teamName] = shiftCode;

            // Check if this is the last day of work pattern
            if (state.currentDay >= currentPattern.composition.length) {
              // Calculate leave days based on n_count
              const leaveDays = currentPattern.n_count || 4;
              
              // Switch to LEAVE state
              state.stateType = 'LEAVE';
              state.currentDay = 1;
              state.totalDays = leaveDays;
            } else {
              state.currentDay++;
            }
          } else {
            // Fallback if no pattern found
            result[dateStr][teamName] = 'F';
            state.currentDay++;
          }
        } else if (state.stateType === 'LEAVE') {
          result[dateStr][teamName] = 'L';
          
          // Check if this is the last day of leave
          if (state.currentDay >= state.totalDays) {
            // Find next valid start day
            const nextValidDate = getNextValidStartDay(currentDate);
            
            // Only switch to WORK if the next valid date is not beyond our current date
            if (nextValidDate <= currentDate || formatDate(nextValidDate) === formatDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000))) {
              // Switch to WORK state and alternate work pattern
              state.stateType = 'WORK';
              state.currentDay = 1;
              
              // Alternate between available work patterns to balance schedule
              if (patterns.length > 1) {
                const currentIndex = patterns.findIndex(p => p.id === state.workPatternId);
                const nextIndex = (currentIndex + 1) % patterns.length;
                state.workPatternId = patterns[nextIndex].id;
                state.totalDays = patterns[nextIndex].composition.length;
                state.nCount = patterns[nextIndex].n_count;
              }
            }
          } else {
            state.currentDay++;
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in generate-schedule function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});