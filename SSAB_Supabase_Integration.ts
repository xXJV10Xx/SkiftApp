// ✅ SSAB Oxelösund Supabase Integration
// This integrates the corrected SSAB system with Supabase

import { createClient } from '@supabase/supabase-js';
import SSABCorrectedSystem, { SSABShift } from './SSAB_Corrected_System';

// Supabase configuration
const SUPABASE_URL = 'https://fsefeherdbtsddqimjco.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc4NTA0NywiZXhwIjoyMDY4MzYxMDQ3fQ.IN-OF4_M7KhNwfAtrOcjS2SfVIbw_80lpgyzlngc_Lg';

export class SSABSupabaseIntegration {
  private supabase;
  private serviceSupabase;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.serviceSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }

  /**
   * ✅ Get shifts for a specific team and date range
   */
  async getShifts(team?: number, startDate?: string, endDate?: string) {
    try {
      let query = this.supabase
        .from('shifts')
        .select('*')
        .order('date', { ascending: true });

      if (team) {
        query = query.eq('team', team);
      }

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        data,
        count: data?.length || 0
      };
    } catch (error) {
      console.error('❌ Error fetching shifts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  /**
   * ✅ Clear existing shifts and insert corrected schedule
   */
  async updateSSABSchedule(startDate: string = '2025-01-01', endDate: string = '2025-12-31') {
    try {
      console.log('🏭 Generating corrected SSAB Oxelösund schedule...');
      
      // Generate corrected schedule
      const shifts = SSABCorrectedSystem.generateSchedule(startDate, endDate);
      const supabaseData = SSABCorrectedSystem.exportForSupabase(shifts);

      console.log(`📊 Generated ${shifts.length} shifts for teams 31-35`);

      // Validate schedule
      const validation = SSABCorrectedSystem.validateSystemRules(startDate, endDate);
      if (!validation.isValid) {
        console.warn('⚠️ Schedule validation failed:', validation.errors.slice(0, 5));
        return {
          success: false,
          error: `Schedule validation failed: ${validation.errors.slice(0, 3).join(', ')}`,
          validation
        };
      }

      console.log('✅ Schedule validation passed');

      // Clear existing SSAB data for teams 31-35 in date range
      console.log('🧹 Clearing existing SSAB shifts...');
      const { error: deleteError } = await this.serviceSupabase
        .from('shifts')
        .delete()
        .in('team', [31, 32, 33, 34, 35])
        .gte('date', startDate)
        .lte('date', endDate);

      if (deleteError) {
        throw new Error(`Failed to clear existing data: ${deleteError.message}`);
      }

      console.log('✅ Existing data cleared');

      // Insert new data in batches (Supabase has row limits)
      const batchSize = 1000;
      let inserted = 0;

      for (let i = 0; i < supabaseData.length; i += batchSize) {
        const batch = supabaseData.slice(i, i + batchSize);
        
        console.log(`📤 Inserting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(supabaseData.length/batchSize)} (${batch.length} records)...`);
        
        const { error: insertError } = await this.serviceSupabase
          .from('shifts')
          .insert(batch);

        if (insertError) {
          throw new Error(`Failed to insert batch: ${insertError.message}`);
        }

        inserted += batch.length;
        console.log(`✅ Inserted ${inserted}/${supabaseData.length} shifts`);
      }

      return {
        success: true,
        message: `Successfully updated SSAB Oxelösund schedule`,
        stats: {
          totalShifts: shifts.length,
          teamsUpdated: [31, 32, 33, 34, 35],
          dateRange: `${startDate} to ${endDate}`,
          validation: validation.summary
        },
        data: shifts
      };

    } catch (error) {
      console.error('❌ Error updating SSAB schedule:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * ✅ Get team schedule for specific team
   */
  async getTeamSchedule(team: number, year: number = 2025) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    return await this.getShifts(team, startDate, endDate);
  }

  /**
   * ✅ Get current week schedule for all teams
   */
  async getCurrentWeekSchedule() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

    const startDate = startOfWeek.toISOString().split('T')[0];
    const endDate = endOfWeek.toISOString().split('T')[0];

    return await this.getShifts(undefined, startDate, endDate);
  }

  /**
   * ✅ Validate current database schedule
   */
  async validateDatabaseSchedule(startDate: string = '2025-01-01', endDate: string = '2025-01-31') {
    try {
      const result = await this.getShifts(undefined, startDate, endDate);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          error: 'Failed to fetch schedule for validation'
        };
      }

      // Convert database format to SSABShift format
      const shifts: SSABShift[] = result.data.map((row: any) => ({
        team: row.team,
        date: row.date,
        type: row.type,
        start_time: row.start_time || '',
        end_time: row.end_time || ''
      }));

      // Group by date and validate
      const shiftsByDate: { [date: string]: SSABShift[] } = {};
      shifts.forEach(shift => {
        if (!shiftsByDate[shift.date]) shiftsByDate[shift.date] = [];
        shiftsByDate[shift.date].push(shift);
      });

      const errors: string[] = [];
      let validDays = 0;
      let totalDays = 0;

      Object.entries(shiftsByDate).forEach(([date, dayShifts]) => {
        totalDays++;
        const workingShifts = dayShifts.filter(s => s.type !== 'L');
        const types = workingShifts.map(s => s.type).sort();
        
        // Check if we have exactly F, E, N
        const expectedTypes = ['E', 'F', 'N'];
        if (JSON.stringify(types) === JSON.stringify(expectedTypes)) {
          validDays++;
        } else {
          errors.push(`${date}: Has [${types.join(',')}] instead of [F,E,N]`);
        }
      });

      return {
        success: true,
        isValid: errors.length === 0,
        validation: {
          totalDays,
          validDays,
          errors: errors.slice(0, 10), // Limit error display
          summary: `${validDays}/${totalDays} days valid`
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }

  /**
   * ✅ Generate SQL for direct database execution
   */
  static generateSQL(startDate: string = '2025-01-01', endDate: string = '2025-12-31'): string {
    const shifts = SSABCorrectedSystem.generateSchedule(startDate, endDate);
    const supabaseData = SSABCorrectedSystem.exportForSupabase(shifts);

    let sql = `-- CORRECTED SSAB Oxelösund 3-shift Schedule
-- Generated: ${new Date().toISOString()}
-- Teams: 31-35 following exact specifications
-- Records: ${supabaseData.length}

-- Clear existing data for teams 31-35
DELETE FROM shifts 
WHERE team IN (31, 32, 33, 34, 35) 
AND date >= '${startDate}' 
AND date <= '${endDate}';

-- Insert corrected schedule
INSERT INTO shifts (team, date, type, start_time, end_time, created_at, is_generated) VALUES\n`;

    const values = supabaseData.map(shift => {
      const startTime = shift.start_time ? `'${shift.start_time}'` : 'NULL';
      const endTime = shift.end_time ? `'${shift.end_time}'` : 'NULL';
      return `(${shift.team}, '${shift.date}', '${shift.type}', ${startTime}, ${endTime}, '${shift.created_at}', ${shift.is_generated})`;
    });

    sql += values.join(',\n') + ';';
    
    return sql;
  }
}

// ✅ Export convenience functions
export async function fixSSABSchedule() {
  console.log('🔧 Starting SSAB Oxelösund schedule correction...');
  
  const integration = new SSABSupabaseIntegration();
  const result = await integration.updateSSABSchedule();
  
  if (result.success) {
    console.log('✅ SSAB schedule successfully corrected!');
    console.log('📊 Stats:', result.stats);
  } else {
    console.error('❌ Failed to fix SSAB schedule:', result.error);
  }
  
  return result;
}

export async function validateSSABSchedule() {
  console.log('🔍 Validating SSAB Oxelösund schedule in database...');
  
  const integration = new SSABSupabaseIntegration();
  const result = await integration.validateDatabaseSchedule();
  
  if (result.success) {
    console.log('📊 Validation Results:', result.validation);
    if (result.isValid) {
      console.log('✅ Schedule is valid!');
    } else {
      console.log('❌ Schedule has issues');
    }
  } else {
    console.error('❌ Validation failed:', result.error);
  }
  
  return result;
}

export default SSABSupabaseIntegration;