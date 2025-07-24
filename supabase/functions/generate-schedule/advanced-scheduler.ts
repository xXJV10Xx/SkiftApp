import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface TeamState {
  team_id: string;
  team_name: string;
  team_alias: string;
  state_date: string;
  block_type: 'WORK' | 'LEAVE';
  day_in_block: number;
  work_pattern_id: string | null;
  work_pattern_composition: string[] | null;
  work_pattern_n_count: number | null;
}

export interface WorkPattern {
  id: string;
  name: string;
  composition: string[];
  cycle_length: number;
  shift_definitions: Record<string, { start: string; end: string; name: string }>;
}

export interface Team {
  id: string;
  name: string;
  alias: string;
  color: string;
  team_states: TeamState[];
}

export interface ScheduleConfig {
  workPatternCycles: number; // Number of work pattern cycles before leave
  leaveDays: number; // Number of leave days after work cycles
  teamStagger: boolean; // Whether to stagger team schedules
}

export class SSABScheduler {
  private supabase: SupabaseClient;
  private config: ScheduleConfig;

  constructor(supabase: SupabaseClient, config: ScheduleConfig = {
    workPatternCycles: 1,
    leaveDays: 5,
    teamStagger: true
  }) {
    this.supabase = supabase;
    this.config = config;
  }

  /**
   * Generate schedule for a date range
   */
  async generateSchedule(
    startDate: string,
    endDate: string,
    scheduleName: string = 'Anpassat SSAB-skift'
  ): Promise<{ [date: string]: { [teamName: string]: string } }> {
    
    // Validate inputs
    this.validateDateRange(startDate, endDate);

    // Fetch schedule data
    const scheduleData = await this.fetchScheduleData(scheduleName);
    
    // Generate schedule for all teams
    const results: { [date: string]: { [teamName: string]: string } } = {};
    const simulationStartDate = new Date(startDate);
    const simulationEndDate = new Date(endDate);

    for (const team of scheduleData.teams) {
      await this.generateTeamSchedule(
        team,
        scheduleData.work_patterns,
        simulationStartDate,
        simulationEndDate,
        results
      );
    }

    return results;
  }

  /**
   * Fetch schedule data from database
   */
  private async fetchScheduleData(scheduleName: string) {
    const { data: scheduleData, error: scheduleError } = await this.supabase
      .from('schedules')
      .select(`
        *,
        work_patterns(*),
        teams(
          *,
          team_states(*)
        )
      `)
      .eq('name', scheduleName)
      .single();

    if (scheduleError) {
      throw new Error(`Schedule error: ${scheduleError.message}`);
    }

    if (!scheduleData) {
      throw new Error(`Schedule '${scheduleName}' not found`);
    }

    return scheduleData;
  }

  /**
   * Generate schedule for a specific team
   */
  private async generateTeamSchedule(
    team: Team,
    workPatterns: WorkPattern[],
    startDate: Date,
    endDate: Date,
    results: { [date: string]: { [teamName: string]: string } }
  ): Promise<void> {
    
    // Find the most recent team state
    const currentState = this.getCurrentTeamState(team);
    if (!currentState) {
      console.warn(`No team states found for team ${team.name}`);
      return;
    }

    // Apply team stagger offset if enabled
    let simulationDate = new Date(currentState.state_date);
    if (this.config.teamStagger) {
      const offset = this.calculateTeamOffset(team.alias, workPatterns[0]?.cycle_length || 14);
      simulationDate.setDate(simulationDate.getDate() + offset);
    }

    let state = { ...currentState };

    // Simulate each day
    while (simulationDate <= endDate) {
      const dateString = simulationDate.toISOString().split('T')[0];

      if (simulationDate >= startDate) {
        if (!results[dateString]) results[dateString] = {};
        
        const shiftCode = this.getShiftCodeForState(state);
        results[dateString][team.alias || team.name] = shiftCode;
      }

      // Advance to next day
      simulationDate.setDate(simulationDate.getDate() + 1);
      state = this.getNextDayState(state, workPatterns);
    }

    // Optionally persist the final state back to database
    await this.persistTeamState(team.id, state, endDate);
  }

  /**
   * Get current team state (most recent)
   */
  private getCurrentTeamState(team: Team): TeamState | null {
    const sortedStates = team.team_states
      .sort((a, b) => new Date(b.state_date).getTime() - new Date(a.state_date).getTime());
    
    return sortedStates[0] || null;
  }

  /**
   * Get shift code for current state
   */
  private getShiftCodeForState(state: TeamState): string {
    if (state.block_type === 'LEAVE') {
      return 'L';
    }

    if (state.block_type === 'WORK' && state.work_pattern_composition) {
      const patternIndex = (state.day_in_block - 1) % state.work_pattern_composition.length;
      return state.work_pattern_composition[patternIndex];
    }

    return 'L'; // Default to leave
  }

  /**
   * Calculate next day's state with sophisticated logic
   */
  private getNextDayState(currentState: TeamState, workPatterns: WorkPattern[]): TeamState {
    const nextState = { ...currentState };
    nextState.day_in_block++;

    if (currentState.block_type === 'WORK') {
      return this.handleWorkBlockTransition(nextState, workPatterns);
    } else if (currentState.block_type === 'LEAVE') {
      return this.handleLeaveBlockTransition(nextState, workPatterns);
    }

    return nextState;
  }

  /**
   * Handle transitions within or from WORK blocks
   */
  private handleWorkBlockTransition(state: TeamState, workPatterns: WorkPattern[]): TeamState {
    const pattern = workPatterns.find(p => p.id === state.work_pattern_id);
    
    if (!pattern) {
      console.warn('Work pattern not found, switching to LEAVE');
      return this.switchToLeaveBlock(state);
    }

    // Check if we've completed the current work pattern cycle
    if (state.day_in_block > pattern.cycle_length) {
      const currentNCount = state.work_pattern_n_count || 1;
      
      // Check if we need more work cycles
      if (currentNCount < this.config.workPatternCycles) {
        // Start another work pattern cycle
        state.day_in_block = 1;
        state.work_pattern_n_count = currentNCount + 1;
      } else {
        // Switch to LEAVE block
        return this.switchToLeaveBlock(state);
      }
    }

    return state;
  }

  /**
   * Handle transitions within or from LEAVE blocks
   */
  private handleLeaveBlockTransition(state: TeamState, workPatterns: WorkPattern[]): TeamState {
    // Check if leave period is complete
    if (state.day_in_block > this.config.leaveDays) {
      // Switch back to WORK block
      const workPattern = workPatterns.find(p => p.name === 'SSAB 3-skift');
      
      if (workPattern) {
        state.block_type = 'WORK';
        state.day_in_block = 1;
        state.work_pattern_id = workPattern.id;
        state.work_pattern_composition = workPattern.composition;
        state.work_pattern_n_count = 1;
      }
    }

    return state;
  }

  /**
   * Switch state to LEAVE block
   */
  private switchToLeaveBlock(state: TeamState): TeamState {
    state.block_type = 'LEAVE';
    state.day_in_block = 1;
    state.work_pattern_id = null;
    state.work_pattern_composition = null;
    state.work_pattern_n_count = null;
    return state;
  }

  /**
   * Calculate team offset for staggered schedules
   */
  private calculateTeamOffset(teamAlias: string, patternLength: number): number {
    const teamOffsets: Record<string, number> = {
      'A': 0,
      'B': Math.floor(patternLength / 4),
      'C': Math.floor(patternLength / 2),
      'D': Math.floor((patternLength * 3) / 4),
    };
    
    return teamOffsets[teamAlias] || 0;
  }

  /**
   * Persist team state to database
   */
  private async persistTeamState(teamId: string, state: TeamState, date: Date): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('team_states')
        .upsert({
          team_id: teamId,
          state_date: date.toISOString().split('T')[0],
          block_type: state.block_type,
          day_in_block: state.day_in_block,
          work_pattern_id: state.work_pattern_id,
          work_pattern_composition: state.work_pattern_composition,
          work_pattern_n_count: state.work_pattern_n_count,
        }, {
          onConflict: 'team_id,state_date'
        });

      if (error) {
        console.error('Error persisting team state:', error);
      }
    } catch (error) {
      console.error('Error persisting team state:', error);
    }
  }

  /**
   * Validate date range
   */
  private validateDateRange(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD format.');
    }
    
    if (start > end) {
      throw new Error('Start date must be before end date.');
    }
    
    const maxDays = 365; // Limit to 1 year
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > maxDays) {
      throw new Error(`Date range too large. Maximum ${maxDays} days allowed.`);
    }
  }

  /**
   * Get shift details for a shift code
   */
  getShiftDetails(shiftCode: string, workPatterns: WorkPattern[]): any {
    for (const pattern of workPatterns) {
      if (pattern.shift_definitions[shiftCode]) {
        return {
          code: shiftCode,
          ...pattern.shift_definitions[shiftCode]
        };
      }
    }
    
    return {
      code: shiftCode,
      start: '',
      end: '',
      name: shiftCode === 'L' ? 'Ledig' : 'Okänd'
    };
  }

  /**
   * Calculate statistics for a generated schedule
   */
  calculateScheduleStats(schedule: { [date: string]: { [teamName: string]: string } }): any {
    const stats = {
      totalDays: 0,
      workDays: 0,
      leaveDays: 0,
      shiftDistribution: {} as Record<string, number>,
      teamStats: {} as Record<string, any>
    };

    for (const [date, teams] of Object.entries(schedule)) {
      stats.totalDays++;
      
      for (const [teamName, shiftCode] of Object.entries(teams)) {
        // Initialize team stats if not exists
        if (!stats.teamStats[teamName]) {
          stats.teamStats[teamName] = {
            workDays: 0,
            leaveDays: 0,
            shifts: {} as Record<string, number>
          };
        }

        // Update shift distribution
        stats.shiftDistribution[shiftCode] = (stats.shiftDistribution[shiftCode] || 0) + 1;
        stats.teamStats[teamName].shifts[shiftCode] = (stats.teamStats[teamName].shifts[shiftCode] || 0) + 1;

        // Update work/leave counters
        if (shiftCode === 'L') {
          stats.leaveDays++;
          stats.teamStats[teamName].leaveDays++;
        } else {
          stats.workDays++;
          stats.teamStats[teamName].workDays++;
        }
      }
    }

    return stats;
  }
}