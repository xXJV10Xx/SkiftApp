// Shifts Controller
const SSABSystem = require('../ssab-system');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class ShiftsController {
  // Get team shifts with caching
  static async getTeamShifts(req, res) {
    try {
      const { team } = req.params;
      const { startDate, endDate, limit = 100, offset = 0 } = req.query;

      // Validate team number
      const teamNumber = parseInt(team);
      if (!teamNumber || teamNumber < 31 || teamNumber > 35) {
        return res.status(400).json({
          error: 'Invalid team number. Must be between 31-35',
          code: 'INVALID_TEAM'
        });
      }

      // Validate dates
      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format. Use YYYY-MM-DD',
          code: 'INVALID_DATE'
        });
      }

      // Check if user has access to this team
      if (req.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('selected_team, company_type')
          .eq('id', req.user.id)
          .single();

        // For premium features, allow access to any team
        // For basic users, only allow their selected team
        if (profile?.company_type === 'ssab' && profile?.selected_team !== teamNumber) {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan')
            .eq('user_id', req.user.id)
            .single();

          if (!subscription || subscription.plan === 'free') {
            return res.status(403).json({
              error: 'Access denied. Upgrade to view other teams',
              code: 'PREMIUM_REQUIRED'
            });
          }
        }
      }

      // Generate shifts using SSAB system
      const shifts = SSABSystem.getTeamSchedule(
        teamNumber,
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0]
      );

      // Apply pagination
      const paginatedShifts = shifts.slice(offset, offset + parseInt(limit));

      // Calculate statistics
      const stats = {
        total_shifts: shifts.length,
        work_days: shifts.filter(s => s.type !== 'L').length,
        free_days: shifts.filter(s => s.type === 'L').length,
        shift_distribution: {
          F: shifts.filter(s => s.type === 'F').length,
          E: shifts.filter(s => s.type === 'E').length,
          N: shifts.filter(s => s.type === 'N').length,
          L: shifts.filter(s => s.type === 'L').length
        }
      };

      res.json({
        team: teamNumber,
        period: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        shifts: paginatedShifts,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: shifts.length,
          has_more: (offset + parseInt(limit)) < shifts.length
        },
        statistics: stats
      });

    } catch (error) {
      console.error('Get team shifts error:', error);
      res.status(500).json({
        error: 'Failed to get team shifts',
        code: 'CALCULATION_ERROR'
      });
    }
  }

  // Get shifts for a specific day (all teams)
  static async getDayShifts(req, res) {
    try {
      const { date } = req.params;
      
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format. Use YYYY-MM-DD',
          code: 'INVALID_DATE'
        });
      }

      const dateStr = targetDate.toISOString().split('T')[0];
      const allShifts = [];

      // Get shifts for all teams
      for (let team = 31; team <= 35; team++) {
        const shifts = SSABSystem.getTeamSchedule(team, dateStr, dateStr);
        if (shifts.length > 0) {
          allShifts.push({
            team,
            ...shifts[0]
          });
        }
      }

      // Validate shift coverage (should be exactly 3 working teams)
      const workingTeams = allShifts.filter(s => s.type !== 'L');
      const shiftTypes = [...new Set(workingTeams.map(s => s.type))];

      const validation = {
        date: dateStr,
        working_teams: workingTeams.length,
        shift_types: shiftTypes,
        is_valid: workingTeams.length === 3 && shiftTypes.length === 3,
        coverage: {
          F: workingTeams.filter(s => s.type === 'F').map(s => s.team),
          E: workingTeams.filter(s => s.type === 'E').map(s => s.team),
          N: workingTeams.filter(s => s.type === 'N').map(s => s.team)
        }
      };

      res.json({
        date: dateStr,
        shifts: allShifts,
        validation
      });

    } catch (error) {
      console.error('Get day shifts error:', error);
      res.status(500).json({
        error: 'Failed to get day shifts',
        code: 'CALCULATION_ERROR'
      });
    }
  }

  // Get month schedule with validation
  static async getMonthSchedule(req, res) {
    try {
      const { year, month } = req.params;
      
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);

      if (yearNum < 2023 || yearNum > 2040 || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          error: 'Invalid year/month. Year must be 2023-2040, month 1-12',
          code: 'INVALID_PERIOD'
        });
      }

      // Calculate month boundaries
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0);

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      // Get all shifts for the month
      const monthShifts = [];
      for (let team = 31; team <= 35; team++) {
        const teamShifts = SSABSystem.getTeamSchedule(team, startStr, endStr);
        monthShifts.push(...teamShifts.map(shift => ({ ...shift, team })));
      }

      // Group by date for validation
      const shiftsByDate = {};
      monthShifts.forEach(shift => {
        if (!shiftsByDate[shift.date]) {
          shiftsByDate[shift.date] = [];
        }
        shiftsByDate[shift.date].push(shift);
      });

      // Validate each day
      const validationErrors = [];
      const statistics = {
        total_days: Object.keys(shiftsByDate).length,
        teams: {}
      };

      // Initialize team statistics
      for (let team = 31; team <= 35; team++) {
        statistics.teams[`team_${team}`] = {
          work_days: 0,
          free_days: 0,
          total_days: 0,
          work_hours: 0,
          shift_distribution: { F: 0, E: 0, N: 0 }
        };
      }

      Object.entries(shiftsByDate).forEach(([date, dayShifts]) => {
        const workingShifts = dayShifts.filter(s => s.type !== 'L');
        const shiftTypes = [...new Set(workingShifts.map(s => s.type))];

        // Validate day coverage
        if (workingShifts.length !== 3) {
          validationErrors.push(`${date}: ${workingShifts.length} working teams (expected 3)`);
        }

        if (shiftTypes.length !== 3 || !['F', 'E', 'N'].every(type => shiftTypes.includes(type))) {
          validationErrors.push(`${date}: Missing shift types (found: ${shiftTypes.join(', ')})`);
        }

        // Update team statistics
        dayShifts.forEach(shift => {
          const teamKey = `team_${shift.team}`;
          const teamStats = statistics.teams[teamKey];
          
          teamStats.total_days++;
          if (shift.type === 'L') {
            teamStats.free_days++;
          } else {
            teamStats.work_days++;
            teamStats.work_hours += 8;
            teamStats.shift_distribution[shift.type]++;
          }
        });
      });

      res.json({
        year: yearNum,
        month: monthNum,
        period: {
          start: startStr,
          end: endStr,
          days: statistics.total_days
        },
        shifts: monthShifts,
        statistics,
        validation: {
          isValid: validationErrors.length === 0,
          errors: validationErrors,
          totalDays: statistics.total_days
        }
      });

    } catch (error) {
      console.error('Get month schedule error:', error);
      res.status(500).json({
        error: 'Failed to get month schedule',
        code: 'CALCULATION_ERROR'
      });
    }
  }

  // Get next shift for a team
  static async getNextShift(req, res) {
    try {
      const { team } = req.params;
      const teamNumber = parseInt(team);

      if (!teamNumber || teamNumber < 31 || teamNumber > 35) {
        return res.status(400).json({
          error: 'Invalid team number',
          code: 'INVALID_TEAM'
        });
      }

      const today = new Date();
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const shifts = SSABSystem.getTeamSchedule(
        teamNumber,
        today.toISOString().split('T')[0],
        futureDate.toISOString().split('T')[0]
      );

      // Find next working shift
      const nextShift = shifts.find(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate >= today && shift.type !== 'L';
      });

      if (!nextShift) {
        return res.status(404).json({
          error: 'No upcoming shifts found',
          code: 'NO_SHIFTS'
        });
      }

      res.json({
        team: teamNumber,
        next_shift: nextShift,
        days_until: Math.ceil((new Date(nextShift.date) - today) / (1000 * 60 * 60 * 24))
      });

    } catch (error) {
      console.error('Get next shift error:', error);
      res.status(500).json({
        error: 'Failed to get next shift',
        code: 'CALCULATION_ERROR'
      });
    }
  }

  // Export shifts as CSV
  static async exportCSV(req, res) {
    try {
      const { team } = req.params;
      const { startDate, endDate, format = 'csv' } = req.query;

      const teamNumber = parseInt(team);
      if (!teamNumber || teamNumber < 31 || teamNumber > 35) {
        return res.status(400).json({
          error: 'Invalid team number',
          code: 'INVALID_TEAM'
        });
      }

      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const shifts = SSABSystem.getTeamSchedule(
        teamNumber,
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0]
      );

      if (format === 'csv') {
        const csvHeaders = 'Date,Weekday,Shift Type,Shift Name,Start Time,End Time,Pattern\n';
        const csvRows = shifts.map(shift => {
          const date = new Date(shift.date);
          const weekday = date.toLocaleDateString('sv-SE', { weekday: 'long' });
          
          return [
            shift.date,
            weekday,
            shift.type,
            shift.shift_name,
            shift.start_time || '',
            shift.end_time || '',
            shift.pattern_name
          ].join(',');
        }).join('\n');

        const csvContent = csvHeaders + csvRows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="ssab-lag-${team}-${start.toISOString().split('T')[0]}-${end.toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        res.json({ shifts });
      }

    } catch (error) {
      console.error('Export CSV error:', error);
      res.status(500).json({
        error: 'Failed to export shifts',
        code: 'EXPORT_ERROR'
      });
    }
  }
}

module.exports = ShiftsController;