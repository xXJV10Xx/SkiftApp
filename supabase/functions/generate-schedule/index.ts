import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { SSABScheduler, ScheduleConfig } from './advanced-scheduler.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      startDate, 
      endDate, 
      scheduleName = 'Anpassat SSAB-skift',
      config = {}
    } = await req.json();
    
    if (!startDate || !endDate) {
      throw new Error('startDate and endDate are required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Create scheduler with custom config
    const scheduleConfig: ScheduleConfig = {
      workPatternCycles: config.workPatternCycles || 1,
      leaveDays: config.leaveDays || 5,
      teamStagger: config.teamStagger !== false // default to true
    };

    const scheduler = new SSABScheduler(supabase, scheduleConfig);

    // Generate the schedule
    const schedule = await scheduler.generateSchedule(startDate, endDate, scheduleName);

    // Calculate statistics
    const stats = scheduler.calculateScheduleStats(schedule);

    return new Response(JSON.stringify({
      schedule,
      stats,
      config: scheduleConfig,
      dateRange: { startDate, endDate }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error generating schedule:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

