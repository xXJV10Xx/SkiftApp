// Example client for the generate-schedule Edge Function
// This demonstrates how to use the function from a TypeScript application

import { createClient } from '@supabase/supabase-js';
import type { 
  GenerateScheduleRequest, 
  GenerateScheduleResponse, 
  GenerateScheduleError,
  ScheduleEntry
} from './types';

// Initialize Supabase client
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client class for schedule generation
export class ScheduleGenerator {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  /**
   * Generate schedule for a date range
   */
  async generateSchedule(
    startDate: string, 
    endDate: string
  ): Promise<GenerateScheduleResponse> {
    try {
      const request: GenerateScheduleRequest = {
        startDate,
        endDate
      };

      const { data, error } = await this.supabase.functions.invoke('generate-schedule', {
        body: request
      });

      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }

      return data as GenerateScheduleResponse;
    } catch (error) {
      console.error('Error generating schedule:', error);
      throw error;
    }
  }

  /**
   * Generate schedule and return as flat array
   */
  async generateScheduleFlat(
    startDate: string, 
    endDate: string
  ): Promise<ScheduleEntry[]> {
    const schedule = await this.generateSchedule(startDate, endDate);
    return this.flattenSchedule(schedule);
  }

  /**
   * Get schedule for a specific team
   */
  async getTeamSchedule(
    teamName: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, string>> {
    const schedule = await this.generateSchedule(startDate, endDate);
    const teamSchedule: Record<string, string> = {};

    for (const [date, teams] of Object.entries(schedule)) {
      if (teams[teamName]) {
        teamSchedule[date] = teams[teamName];
      }
    }

    return teamSchedule;
  }

  /**
   * Convert schedule response to flat array format
   */
  private flattenSchedule(schedule: GenerateScheduleResponse): ScheduleEntry[] {
    const entries: ScheduleEntry[] = [];
    
    for (const [date, teams] of Object.entries(schedule)) {
      for (const [teamName, shiftCode] of Object.entries(teams)) {
        entries.push({
          date,
          team: teamName,
          shift: shiftCode
        });
      }
    }
    
    return entries;
  }

  /**
   * Get schedule statistics
   */
  async getScheduleStats(
    startDate: string,
    endDate: string
  ): Promise<{
    totalDays: number;
    totalTeams: number;
    shiftCounts: Record<string, number>;
    teamStats: Record<string, Record<string, number>>;
  }> {
    const schedule = await this.generateSchedule(startDate, endDate);
    const stats = {
      totalDays: Object.keys(schedule).length,
      totalTeams: 0,
      shiftCounts: { F: 0, E: 0, N: 0, L: 0 },
      teamStats: {} as Record<string, Record<string, number>>
    };

    const teams = new Set<string>();

    for (const [date, teamShifts] of Object.entries(schedule)) {
      for (const [teamName, shiftCode] of Object.entries(teamShifts)) {
        teams.add(teamName);
        stats.shiftCounts[shiftCode]++;

        if (!stats.teamStats[teamName]) {
          stats.teamStats[teamName] = { F: 0, E: 0, N: 0, L: 0 };
        }
        stats.teamStats[teamName][shiftCode]++;
      }
    }

    stats.totalTeams = teams.size;
    return stats;
  }
}

// Usage examples
async function examples() {
  const generator = new ScheduleGenerator(supabase);

  try {
    // Example 1: Generate basic schedule
    console.log('Example 1: Basic schedule generation');
    const schedule = await generator.generateSchedule('2024-01-01', '2024-01-07');
    console.log('Schedule:', JSON.stringify(schedule, null, 2));

    // Example 2: Get flat array format
    console.log('\nExample 2: Flat array format');
    const flatSchedule = await generator.generateScheduleFlat('2024-01-01', '2024-01-07');
    console.log('Flat schedule:', flatSchedule);

    // Example 3: Get specific team schedule
    console.log('\nExample 3: Team-specific schedule');
    const teamSchedule = await generator.getTeamSchedule('Team Alpha', '2024-01-01', '2024-01-07');
    console.log('Team Alpha schedule:', teamSchedule);

    // Example 4: Get statistics
    console.log('\nExample 4: Schedule statistics');
    const stats = await generator.getScheduleStats('2024-01-01', '2024-01-31');
    console.log('Statistics:', JSON.stringify(stats, null, 2));

  } catch (error) {
    console.error('Error in examples:', error);
  }
}

// React Hook example
export function useScheduleGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<GenerateScheduleResponse | null>(null);

  const generator = new ScheduleGenerator(supabase);

  const generateSchedule = async (startDate: string, endDate: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await generator.generateSchedule(startDate, endDate);
      setSchedule(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return {
    schedule,
    loading,
    error,
    generateSchedule
  };
}

// Direct function call example (without class wrapper)
export async function callGenerateSchedule(
  startDate: string,
  endDate: string
): Promise<GenerateScheduleResponse> {
  const { data, error } = await supabase.functions.invoke('generate-schedule', {
    body: { startDate, endDate }
  });

  if (error) {
    throw new Error(`Function error: ${error.message}`);
  }

  return data;
}

// Export the generator class as default
export default ScheduleGenerator;

// Example usage in a React component
/*
import React, { useState } from 'react';
import { useScheduleGenerator } from './example-client';

function ScheduleComponent() {
  const { schedule, loading, error, generateSchedule } = useScheduleGenerator();
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-01-07');

  const handleGenerate = () => {
    generateSchedule(startDate, endDate);
  };

  if (loading) return <div>Generating schedule...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div>
        <input 
          type="date" 
          value={startDate} 
          onChange={(e) => setStartDate(e.target.value)} 
        />
        <input 
          type="date" 
          value={endDate} 
          onChange={(e) => setEndDate(e.target.value)} 
        />
        <button onClick={handleGenerate}>Generate Schedule</button>
      </div>
      
      {schedule && (
        <div>
          <h3>Schedule</h3>
          {Object.entries(schedule).map(([date, teams]) => (
            <div key={date}>
              <strong>{date}:</strong>
              {Object.entries(teams).map(([team, shift]) => (
                <span key={team}> {team}: {shift} </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
*/