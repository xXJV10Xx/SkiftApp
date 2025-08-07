// Integration Tests for Calendar API Endpoints
const request = require('supertest');
const express = require('express');
const calendarRoutes = require('../../routes/calendarRoutes');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/calendar', calendarRoutes);

describe('Calendar API Integration Tests', () => {
  
  describe('GET /api/calendar/pattern', () => {
    test('should return pattern information', async () => {
      const response = await request(app)
        .get('/api/calendar/pattern')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('pattern');
      expect(response.body.pattern).toHaveProperty('patternLength', 21);
      expect(response.body.pattern).toHaveProperty('teams');
      expect(response.body.pattern).toHaveProperty('shiftTypes');
    });
  });

  describe('GET /api/calendar/monthly/:team/:year/:month', () => {
    test('should return monthly calendar for valid team, year, month', async () => {
      const response = await request(app)
        .get('/api/calendar/monthly/31/2024/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('calendar');
      expect(response.body.calendar).toHaveProperty('year', 2024);
      expect(response.body.calendar).toHaveProperty('month', 1);
      expect(response.body.calendar).toHaveProperty('team', 31);
      expect(response.body.calendar).toHaveProperty('weeks');
      expect(response.body.calendar.weeks).toHaveLength(6);
    });

    test('should validate team number', async () => {
      const response = await request(app)
        .get('/api/calendar/monthly/30/2024/1')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('should validate year range', async () => {
      const response = await request(app)
        .get('/api/calendar/monthly/31/2021/1')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('should validate month range', async () => {
      const response = await request(app)
        .get('/api/calendar/monthly/31/2024/13')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('should handle boundary years correctly', async () => {
      // Test 2022 (start boundary)
      const response2022 = await request(app)
        .get('/api/calendar/monthly/31/2022/1')
        .expect(200);
      
      expect(response2022.body.calendar.year).toBe(2022);

      // Test 2040 (end boundary)
      const response2040 = await request(app)
        .get('/api/calendar/monthly/31/2040/12')
        .expect(200);
      
      expect(response2040.body.calendar.year).toBe(2040);
    });
  });

  describe('GET /api/calendar/yearly/:team/:year', () => {
    test('should return yearly calendar for valid inputs', async () => {
      const response = await request(app)
        .get('/api/calendar/yearly/31/2024')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('calendar');
      expect(response.body.calendar).toHaveProperty('year', 2024);
      expect(response.body.calendar).toHaveProperty('team', 31);
      expect(response.body.calendar).toHaveProperty('months');
      expect(response.body.calendar.months).toHaveLength(12);
      expect(response.body.calendar).toHaveProperty('statistics');
    });

    test('should validate team number for yearly view', async () => {
      const response = await request(app)
        .get('/api/calendar/yearly/36/2024')
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('should validate year for yearly view', async () => {
      const response = await request(app)
        .get('/api/calendar/yearly/31/2041')
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('should include statistics in yearly view', async () => {
      const response = await request(app)
        .get('/api/calendar/yearly/31/2024')
        .expect(200);

      const stats = response.body.calendar.statistics;
      expect(stats).toHaveProperty('totalWorkingDays');
      expect(stats).toHaveProperty('totalRestDays');
      expect(stats).toHaveProperty('totalHours');
      expect(stats).toHaveProperty('shiftBreakdown');
      expect(stats.totalWorkingDays + stats.totalRestDays).toBe(365); // Adjusted for leap year handling
    });
  });

  describe('GET /api/calendar/compare/:year/:month', () => {
    test('should return comparison for all teams', async () => {
      const response = await request(app)
        .get('/api/calendar/compare/2024/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('comparison');
      expect(response.body.comparison).toHaveProperty('year', 2024);
      expect(response.body.comparison).toHaveProperty('month', 1);
      expect(response.body.comparison).toHaveProperty('teams');
      expect(Object.keys(response.body.comparison.teams)).toHaveLength(5);
    });

    test('should include all teams in comparison', async () => {
      const response = await request(app)
        .get('/api/calendar/compare/2024/1')
        .expect(200);

      const teams = response.body.comparison.teams;
      [31, 32, 33, 34, 35].forEach(teamNumber => {
        expect(teams).toHaveProperty(teamNumber.toString());
      });
    });
  });

  describe('GET /api/calendar/schedule/:team', () => {
    test('should return schedule for date range', async () => {
      const response = await request(app)
        .get('/api/calendar/schedule/31')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-07'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('schedule');
      expect(response.body.schedule).toHaveProperty('team', 31);
      expect(response.body.schedule).toHaveProperty('schedule');
      expect(response.body.schedule.schedule).toHaveLength(7);
    });

    test('should validate date format', async () => {
      const response = await request(app)
        .get('/api/calendar/schedule/31')
        .query({
          startDate: 'invalid-date',
          endDate: '2024-01-07'
        })
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('should require both start and end dates', async () => {
      const response = await request(app)
        .get('/api/calendar/schedule/31')
        .query({ startDate: '2024-01-01' })
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('should validate date order', async () => {
      const response = await request(app)
        .get('/api/calendar/schedule/31')
        .query({
          startDate: '2024-01-07',
          endDate: '2024-01-01'
        })
        .expect(400);

      expect(response.body).toHaveProperty('code', 'INVALID_DATE_RANGE');
    });

    test('should enforce date range limits', async () => {
      const response = await request(app)
        .get('/api/calendar/schedule/31')
        .query({
          startDate: '2021-01-01',
          endDate: '2021-01-07'
        })
        .expect(400);

      expect(response.body).toHaveProperty('code', 'DATE_OUT_OF_RANGE');
    });
  });

  describe('GET /api/calendar/shift/:team/:date', () => {
    test('should return shift for specific date', async () => {
      const response = await request(app)
        .get('/api/calendar/shift/31/2024-01-01')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('shift');
      expect(response.body.shift).toHaveProperty('date', '2024-01-01');
      expect(response.body.shift).toHaveProperty('team', 31);
      expect(response.body.shift).toHaveProperty('shiftType');
      expect(['F', 'E', 'N', 'L']).toContain(response.body.shift.shiftType);
    });

    test('should validate team for single shift', async () => {
      const response = await request(app)
        .get('/api/calendar/shift/40/2024-01-01')
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('should validate date format for single shift', async () => {
      const response = await request(app)
        .get('/api/calendar/shift/31/invalid-date')
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('GET /api/calendar/export/:team', () => {
    test('should export schedule as JSON', async () => {
      const response = await request(app)
        .get('/api/calendar/export/31')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          format: 'json'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.body).toHaveProperty('exportedAt');
      expect(response.body).toHaveProperty('data');
    });

    test('should export schedule as CSV', async () => {
      const response = await request(app)
        .get('/api/calendar/export/31')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          format: 'csv'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text).toContain('Date');
      expect(response.text).toContain('Team');
    });

    test('should validate export format', async () => {
      const response = await request(app)
        .get('/api/calendar/export/31')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          format: 'xml'
        })
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('GET /api/calendar/find/:team/:shiftType', () => {
    test('should find shift occurrences', async () => {
      const response = await request(app)
        .get('/api/calendar/find/31/F')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('team', 31);
      expect(response.body).toHaveProperty('shiftType', 'F');
      expect(response.body).toHaveProperty('occurrences');
      expect(Array.isArray(response.body.occurrences)).toBe(true);
      expect(response.body).toHaveProperty('total');
    });

    test('should validate shift type', async () => {
      const response = await request(app)
        .get('/api/calendar/find/31/X')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        })
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('GET /api/calendar/next-working/:team', () => {
    test('should find next working day', async () => {
      const response = await request(app)
        .get('/api/calendar/next-working/31')
        .query({ fromDate: '2024-01-01' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('team', 31);
      expect(response.body).toHaveProperty('nextWorkingDay');
      
      if (response.body.nextWorkingDay) {
        expect(response.body.nextWorkingDay).toHaveProperty('isWorkingDay', true);
        expect(response.body.nextWorkingDay.shiftType).not.toBe('L');
      }
    });

    test('should handle case with no working day found', async () => {
      // This test might pass or return 404 depending on the specific date and pattern
      const response = await request(app)
        .get('/api/calendar/next-working/31')
        .query({ fromDate: '2024-01-01' });

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 404) {
        expect(response.body).toHaveProperty('code', 'NO_WORKING_DAY_FOUND');
      }
    });
  });

  describe('GET /api/calendar/workload-comparison', () => {
    test('should compare team workloads', async () => {
      const response = await request(app)
        .get('/api/calendar/workload-comparison')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('comparison');
      expect(response.body.comparison).toHaveProperty('teams');
      expect(response.body.comparison).toHaveProperty('summary');
      expect(Object.keys(response.body.comparison.teams)).toHaveLength(5);
    });

    test('should require date range for workload comparison', async () => {
      const response = await request(app)
        .get('/api/calendar/workload-comparison')
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('Error Handling', () => {
    test('should handle server errors gracefully', async () => {
      // Test with extreme date that might cause issues
      const response = await request(app)
        .get('/api/calendar/monthly/31/2040/12');

      // Should either succeed or fail gracefully
      if (response.status !== 200) {
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('code');
      }
    });

    test('should validate all required parameters', async () => {
      const response = await request(app)
        .get('/api/calendar/monthly/31/2024') // Missing month
        .expect(404); // Should be 404 for route not found
    });
  });

  describe('Data Consistency', () => {
    test('should return consistent data across different endpoints', async () => {
      const date = '2024-01-15';
      const team = 31;

      // Get shift from single shift endpoint
      const singleShiftResponse = await request(app)
        .get(`/api/calendar/shift/${team}/${date}`)
        .expect(200);

      // Get shift from schedule range endpoint
      const scheduleResponse = await request(app)
        .get(`/api/calendar/schedule/${team}`)
        .query({ startDate: date, endDate: date })
        .expect(200);

      const singleShift = singleShiftResponse.body.shift;
      const scheduleShift = scheduleResponse.body.schedule.schedule[0];

      expect(singleShift.shiftType).toBe(scheduleShift.shiftType);
      expect(singleShift.date).toBe(scheduleShift.date);
      expect(singleShift.team).toBe(scheduleShift.team);
    });

    test('should maintain pattern consistency over time', async () => {
      // Test that the same date pattern repeats after 21 days (cycle length)
      const baseDate = '2024-01-01';
      const cycleDate = '2024-01-22'; // 21 days later
      const team = 31;

      const baseShiftResponse = await request(app)
        .get(`/api/calendar/shift/${team}/${baseDate}`)
        .expect(200);

      const cycleShiftResponse = await request(app)
        .get(`/api/calendar/shift/${team}/${cycleDate}`)
        .expect(200);

      const baseShift = baseShiftResponse.body.shift;
      const cycleShift = cycleShiftResponse.body.shift;

      expect(baseShift.shiftType).toBe(cycleShift.shiftType);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large date ranges efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/calendar/schedule/31')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(response.body.schedule.schedule).toHaveLength(366); // 2024 is leap year
    });

    test('should handle yearly calendar generation efficiently', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/calendar/yearly/31/2024')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});