/**
 * Universal Calendar API Integration Tests
 * Tests for multi-company calendar API endpoints
 */

const request = require('supertest');
const express = require('express');
const universalCalendarRoutes = require('../../routes/universalCalendarRoutes');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/universal', universalCalendarRoutes);

describe('Universal Calendar API Integration Tests', () => {

  describe('GET /api/universal/companies', () => {
    test('should return all supported companies', async () => {
      const response = await request(app)
        .get('/api/universal/companies')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('companies');
      expect(response.body).toHaveProperty('total');
      expect(response.body.companies.length).toBeGreaterThan(25);
      
      // Check that we have key companies
      const companyIds = response.body.companies.map(c => c.id);
      expect(companyIds).toContain('ssab_oxelosund');
      expect(companyIds).toContain('volvo_trucks');
      expect(companyIds).toContain('scania');
      expect(companyIds).toContain('boliden_aitik');
    });

    test('should include metadata', () => {
      return request(app)
        .get('/api/universal/companies')
        .expect(200)
        .then(response => {
          expect(response.body).toHaveProperty('metadata');
          expect(response.body.metadata).toHaveProperty('industries');
          expect(response.body.metadata).toHaveProperty('locations');
          expect(response.body.metadata.industries).toEqual(
            expect.arrayContaining(['Stålindustri', 'Fordonsindustri', 'Gruvindustri'])
          );
        });
    });
  });

  describe('GET /api/universal/companies/search', () => {
    test('should search companies by query', async () => {
      const response = await request(app)
        .get('/api/universal/companies/search')
        .query({ q: 'SSAB' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('results');
      expect(response.body.results.length).toBeGreaterThan(0);
      
      const ssabCompanies = response.body.results.filter(c => 
        c.name.toLowerCase().includes('ssab')
      );
      expect(ssabCompanies.length).toBeGreaterThan(0);
    });

    test('should filter by industry', async () => {
      const response = await request(app)
        .get('/api/universal/companies/search')
        .query({ industry: 'Fordonsindustri' })
        .expect(200);

      expect(response.body.results.length).toBeGreaterThan(0);
      response.body.results.forEach(company => {
        expect(company.industry).toBe('Fordonsindustri');
      });
    });

    test('should validate search query length', async () => {
      const response = await request(app)
        .get('/api/universal/companies/search')
        .query({ q: 'a' })
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('GET /api/universal/companies/:companyId', () => {
    test('should return specific company details', async () => {
      const response = await request(app)
        .get('/api/universal/companies/ssab_oxelosund')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('company');
      expect(response.body.company.id).toBe('ssab_oxelosund');
      expect(response.body.company.name).toBe('SSAB Oxelösund');
      expect(response.body.company).toHaveProperty('shiftPattern');
      expect(response.body.company.shiftPattern.cycleLength).toBe(21);
    });

    test('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .get('/api/universal/companies/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('code', 'COMPANY_NOT_FOUND');
    });
  });

  describe('GET /api/universal/schedule/:companyId/:teamId', () => {
    test('should generate schedule for SSAB', async () => {
      const response = await request(app)
        .get('/api/universal/schedule/ssab_oxelosund/31')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-07'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('schedule');
      expect(response.body.schedule.company.id).toBe('ssab_oxelosund');
      expect(response.body.schedule.team.id).toBe('31');
      expect(response.body.schedule.schedule).toHaveLength(7);
    });

    test('should generate schedule for Volvo', async () => {
      const response = await request(app)
        .get('/api/universal/schedule/volvo_trucks/A')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-14'
        })
        .expect(200);

      expect(response.body.schedule.company.id).toBe('volvo_trucks');
      expect(response.body.schedule.team.id).toBe('A');
      expect(response.body.schedule.schedule).toHaveLength(14);
    });

    test('should require start and end dates', async () => {
      const response = await request(app)
        .get('/api/universal/schedule/ssab_oxelosund/31')
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('should validate date range', async () => {
      const response = await request(app)
        .get('/api/universal/schedule/ssab_oxelosund/31')
        .query({
          startDate: '2024-01-07',
          endDate: '2024-01-01'
        })
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('should enforce maximum date range', async () => {
      const response = await request(app)
        .get('/api/universal/schedule/ssab_oxelosund/31')
        .query({
          startDate: '2024-01-01',
          endDate: '2026-12-31' // More than 2 years
        })
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('GET /api/universal/monthly/:companyId/:teamId/:year/:month', () => {
    test('should generate monthly calendar', async () => {
      const response = await request(app)
        .get('/api/universal/monthly/ssab_oxelosund/31/2024/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('calendar');
      expect(response.body.calendar.year).toBe(2024);
      expect(response.body.calendar.month).toBe(1);
      expect(response.body.calendar.weeks).toHaveLength(6);
    });

    test('should work for different companies', async () => {
      const testCases = [
        { company: 'volvo_trucks', team: 'A' },
        { company: 'scania', team: 'Röd' },
        { company: 'aga_avesta', team: 'A' }
      ];

      for (const { company, team } of testCases) {
        const response = await request(app)
          .get(`/api/universal/monthly/${company}/${team}/2024/3`)
          .expect(200);

        expect(response.body.calendar.company.id).toBe(company);
        expect(response.body.calendar.team.id).toBe(team);
      }
    });

    test('should validate year range', async () => {
      const response = await request(app)
        .get('/api/universal/monthly/ssab_oxelosund/31/2021/1')
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('should validate month range', async () => {
      const response = await request(app)
        .get('/api/universal/monthly/ssab_oxelosund/31/2024/13')
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('GET /api/universal/yearly/:companyId/:teamId/:year', () => {
    test('should generate yearly calendar', async () => {
      const response = await request(app)
        .get('/api/universal/yearly/ssab_oxelosund/31/2024')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('calendar');
      expect(response.body.calendar.year).toBe(2024);
      expect(response.body.calendar.months).toHaveLength(12);
      expect(response.body.calendar.statistics).toHaveProperty('totalWorkingDays');
    });

    test('should work for various companies', async () => {
      const companies = ['volvo_trucks', 'boliden_aitik', 'sca_ostrand'];
      const teams = ['A', 'Lag 1', 'Röd'];

      for (let i = 0; i < companies.length; i++) {
        const response = await request(app)
          .get(`/api/universal/yearly/${companies[i]}/${teams[i]}/2024`)
          .expect(200);

        expect(response.body.calendar.company.id).toBe(companies[i]);
        expect(response.body.calendar.months).toHaveLength(12);
      }
    });
  });

  describe('GET /api/universal/shift/:companyId/:teamId/:date', () => {
    test('should get shift for specific date', async () => {
      const response = await request(app)
        .get('/api/universal/shift/ssab_oxelosund/31/2024-01-01')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('shift');
      expect(response.body.shift.date).toBe('2024-01-01');
      expect(response.body.shift.company.id).toBe('ssab_oxelosund');
      expect(response.body.shift.team.id).toBe('31');
    });

    test('should validate date format', async () => {
      const response = await request(app)
        .get('/api/universal/shift/ssab_oxelosund/31/invalid-date')
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('should handle company not found', async () => {
      const response = await request(app)
        .get('/api/universal/shift/nonexistent/team/2024-01-01')
        .expect(404);

      expect(response.body).toHaveProperty('code', 'NOT_FOUND');
    });
  });

  describe('GET /api/universal/compare/:year/:month', () => {
    test('should compare multiple companies', async () => {
      const response = await request(app)
        .get('/api/universal/compare/2024/1')
        .query({
          companies: 'ssab_oxelosund,volvo_trucks,scania',
          teams: JSON.stringify({
            'ssab_oxelosund': '31',
            'volvo_trucks': 'A',
            'scania': 'Röd'
          })
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('comparison');
      expect(Object.keys(response.body.comparison.companies)).toHaveLength(3);
      expect(response.body.comparison).toHaveProperty('summary');
    });

    test('should require companies parameter', async () => {
      const response = await request(app)
        .get('/api/universal/compare/2024/1')
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('should require minimum 2 companies', async () => {
      const response = await request(app)
        .get('/api/universal/compare/2024/1')
        .query({ companies: 'ssab_oxelosund' })
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('should limit maximum companies', async () => {
      const companies = Array.from({ length: 12 }, (_, i) => `company${i}`).join(',');
      const response = await request(app)
        .get('/api/universal/compare/2024/1')
        .query({ companies })
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/universal/batch', () => {
    test('should process batch requests', async () => {
      const requests = [
        { companyId: 'ssab_oxelosund', teamId: '31', startDate: '2024-01-01', endDate: '2024-01-07' },
        { companyId: 'volvo_trucks', teamId: 'A', startDate: '2024-01-01', endDate: '2024-01-07' }
      ];

      const response = await request(app)
        .post('/api/universal/batch')
        .send({ requests })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('results');
      expect(response.body.results.results).toHaveLength(2);
      expect(response.body.results.summary.total).toBe(2);
    });

    test('should validate batch size', async () => {
      const requests = Array.from({ length: 51 }, (_, i) => ({
        companyId: 'ssab_oxelosund',
        teamId: '31',
        startDate: '2024-01-01',
        endDate: '2024-01-07'
      }));

      const response = await request(app)
        .post('/api/universal/batch')
        .send({ requests })
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('should require requests array', async () => {
      const response = await request(app)
        .post('/api/universal/batch')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('GET /api/universal/export/:companyId/:teamId', () => {
    test('should export as JSON', async () => {
      const response = await request(app)
        .get('/api/universal/export/ssab_oxelosund/31')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          format: 'json'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.body).toHaveProperty('schedule');
    });

    test('should export as CSV', async () => {
      const response = await request(app)
        .get('/api/universal/export/ssab_oxelosund/31')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          format: 'csv'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text).toContain('Date,Day of Week');
    });

    test('should validate export format', async () => {
      const response = await request(app)
        .get('/api/universal/export/ssab_oxelosund/31')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          format: 'xml'
        })
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('System Management Endpoints', () => {
    test('GET /api/universal/system/health should return health status', async () => {
      const response = await request(app)
        .get('/api/universal/system/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('service', 'Universal Calendar Service');
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('statistics');
      expect(response.body.statistics.companiesLoaded).toBeGreaterThan(25);
    });

    test('GET /api/universal/system/stats should return system statistics', async () => {
      const response = await request(app)
        .get('/api/universal/system/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('statistics');
      expect(response.body.statistics).toHaveProperty('companies');
      expect(response.body.statistics).toHaveProperty('cache');
      expect(response.body.statistics).toHaveProperty('performance');
    });

    test('DELETE /api/universal/system/cache should clear cache', async () => {
      // First generate some cached data
      await request(app)
        .get('/api/universal/schedule/ssab_oxelosund/31')
        .query({ startDate: '2024-01-01', endDate: '2024-01-07' });

      // Then clear cache
      const response = await request(app)
        .delete('/api/universal/system/cache')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('cache');
      expect(response.body.cache.currentSize).toBe(0);
    });
  });

  describe('Industry and Location Endpoints', () => {
    test('GET /api/universal/industries should return all industries', async () => {
      const response = await request(app)
        .get('/api/universal/industries')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('industries');
      expect(response.body.industries.length).toBeGreaterThan(5);
      
      const industryNames = response.body.industries.map(i => i.name);
      expect(industryNames).toContain('Stålindustri');
      expect(industryNames).toContain('Fordonsindustri');
      expect(industryNames).toContain('Gruvindustri');
    });

    test('GET /api/universal/locations should return all locations', async () => {
      const response = await request(app)
        .get('/api/universal/locations')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('locations');
      expect(response.body.locations.length).toBeGreaterThan(10);
    });
  });

  describe('Performance Tests', () => {
    test('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .get(`/api/universal/shift/ssab_oxelosund/31/2024-01-${String(i + 1).padStart(2, '0')}`)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    test('GET /api/universal/performance should test response times', async () => {
      const response = await request(app)
        .get('/api/universal/performance')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('performance');
      expect(response.body.performance).toHaveProperty('averageResponseTime');
      expect(response.body.performance).toHaveProperty('testResults');
      expect(response.body.performance.testResults.length).toBeGreaterThan(0);
    });
  });

  describe('Legacy SSAB Compatibility', () => {
    test('should redirect legacy pattern endpoint', async () => {
      const response = await request(app)
        .get('/api/universal/pattern')
        .expect(302);

      expect(response.headers.location).toBe('/api/universal/companies/ssab_oxelosund');
    });

    test('should redirect legacy monthly endpoint', async () => {
      const response = await request(app)
        .get('/api/universal/monthly/31/2024/1')
        .expect(302);

      expect(response.headers.location).toBe('/api/universal/monthly/ssab_oxelosund/31/2024/1');
    });

    test('should redirect legacy yearly endpoint', async () => {
      const response = await request(app)
        .get('/api/universal/yearly/31/2024')
        .expect(302);

      expect(response.headers.location).toBe('/api/universal/yearly/ssab_oxelosund/31/2024');
    });
  });

  describe('Data Consistency', () => {
    test('should maintain consistency across different company patterns', async () => {
      const companies = [
        { id: 'ssab_oxelosund', team: '31', cycle: 21 },
        { id: 'volvo_trucks', team: 'A', cycle: 8 },
        { id: 'aga_avesta', team: 'A', cycle: 18 }
      ];

      for (const { id, team, cycle } of companies) {
        const shift1 = await request(app)
          .get(`/api/universal/shift/${id}/${team}/2024-01-01`)
          .expect(200);

        const shift2 = await request(app)
          .get(`/api/universal/shift/${id}/${team}/2024-01-${String(cycle + 1).padStart(2, '0')}`)
          .expect(200);

        // Shifts should be the same after one full cycle
        expect(shift1.body.shift.shift.shiftType).toBe(shift2.body.shift.shift.shiftType);
      }
    });

    test('should provide consistent data across API endpoints', async () => {
      const date = '2024-01-15';
      const companyId = 'ssab_oxelosund';
      const teamId = '31';

      // Get shift from single shift endpoint
      const singleShift = await request(app)
        .get(`/api/universal/shift/${companyId}/${teamId}/${date}`)
        .expect(200);

      // Get shift from schedule endpoint
      const schedule = await request(app)
        .get(`/api/universal/schedule/${companyId}/${teamId}`)
        .query({ startDate: date, endDate: date })
        .expect(200);

      const scheduleShift = schedule.body.schedule.schedule[0];
      const singleShiftData = singleShift.body.shift.shift;

      expect(singleShiftData.shiftType).toBe(scheduleShift.shiftType);
      expect(singleShiftData.shiftName).toBe(scheduleShift.shiftName);
    });
  });
});