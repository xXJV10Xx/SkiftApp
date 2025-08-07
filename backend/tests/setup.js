// Test Setup Configuration
require('dotenv').config({ path: '.env.test' });

// Global test configuration
global.testConfig = {
  supabase: {
    url: process.env.SUPABASE_URL || 'http://localhost:54321',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || 'test-service-key'
  },
  server: {
    port: process.env.TEST_PORT || 3003,
    host: 'localhost'
  },
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000
  }
};

// Mock console methods for cleaner test output
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

// Global test helpers
global.testHelpers = {
  // Generate test user data
  generateTestUser: () => ({
    id: `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: `test-${Date.now()}@ssab-test.com`,
    full_name: 'Test User',
    company_type: 'ssab',
    selected_team: 31
  }),

  // Generate test team data
  generateTestTeam: (teamNumber = 31) => ({
    team_number: teamNumber,
    name: `Lag ${teamNumber}`,
    color: '#FF6B6B',
    company_type: 'ssab',
    is_active: true
  }),

  // Generate test shift data
  generateTestShift: (team = 31, date = '2024-01-01') => ({
    team,
    date,
    type: 'F',
    shift_name: 'Förmiddag',
    start_time: '06:00',
    end_time: '14:00',
    pattern_name: '3F→2E→2N→5L'
  }),

  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Create test JWT token
  createTestToken: () => 'test-jwt-token-' + Date.now()
};

// Jest global hooks
beforeAll(async () => {
  // Global setup
  console.log('Starting test suite...');
});

afterAll(async () => {
  // Global cleanup
  console.log('Test suite completed.');
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  // This runs after each individual test
});

// Error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in tests
});

// Export configuration for use in tests
module.exports = {
  testConfig: global.testConfig,
  testHelpers: global.testHelpers
};