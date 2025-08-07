// Custom functions for Artillery load testing

module.exports = {
  // Generate random team number
  randomTeam: function(context, events, done) {
    const teams = [31, 32, 33, 34, 35];
    context.vars.randomTeam = teams[Math.floor(Math.random() * teams.length)];
    return done();
  },

  // Generate random date within valid range
  randomDate: function(context, events, done) {
    const start = new Date('2024-01-01');
    const end = new Date('2024-12-31');
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    const randomDate = new Date(randomTime);
    context.vars.randomDate = randomDate.toISOString().split('T')[0];
    return done();
  },

  // Generate random date range
  randomDateRange: function(context, events, done) {
    const start = new Date('2024-01-01');
    const end = new Date('2024-12-31');
    
    const startTime = start.getTime() + Math.random() * (end.getTime() - start.getTime() - 7 * 24 * 60 * 60 * 1000);
    const endTime = startTime + (7 * 24 * 60 * 60 * 1000); // 7 days later
    
    context.vars.startDate = new Date(startTime).toISOString().split('T')[0];
    context.vars.endDate = new Date(endTime).toISOString().split('T')[0];
    return done();
  },

  // Custom response time tracker
  trackResponseTime: function(requestParams, response, context, ee, next) {
    if (response.timings) {
      const totalTime = response.timings.response;
      console.log(`Request to ${requestParams.uri} took ${totalTime}ms`);
      
      // Track slow requests
      if (totalTime > 1000) {
        ee.emit('customStat', 'slow_requests', 1);
      }
    }
    return next();
  },

  // Validate shift data structure
  validateShiftData: function(requestParams, response, context, ee, next) {
    if (response.statusCode === 200 && response.body) {
      try {
        const data = JSON.parse(response.body);
        
        // Validate shifts array structure
        if (data.shifts && Array.isArray(data.shifts)) {
          data.shifts.forEach(shift => {
            if (!shift.date || !shift.type || !shift.shift_name) {
              ee.emit('customStat', 'invalid_shift_structure', 1);
            }
          });
        }
        
        // Validate team number if present
        if (data.team && (data.team < 31 || data.team > 35)) {
          ee.emit('customStat', 'invalid_team_number', 1);
        }
        
      } catch (error) {
        ee.emit('customStat', 'json_parse_error', 1);
      }
    }
    return next();
  },

  // Generate report after test completion
  generateReport: function(context, events, done) {
    console.log('Generating performance test report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      test_duration: context.vars.test_duration || 'unknown',
      total_requests: context.vars.total_requests || 0,
      successful_requests: context.vars.successful_requests || 0,
      error_rate: context.vars.error_rate || 0,
      avg_response_time: context.vars.avg_response_time || 0
    };
    
    console.log('Performance Test Report:', JSON.stringify(report, null, 2));
    return done();
  },

  // Custom think time based on user behavior simulation
  dynamicThinkTime: function(context, events, done) {
    // Simulate realistic user behavior with variable think times
    const thinkTimes = [1, 2, 3, 5, 8]; // seconds
    const randomThinkTime = thinkTimes[Math.floor(Math.random() * thinkTimes.length)];
    context.vars.thinkTime = randomThinkTime;
    return done();
  },

  // Simulate authentication token (for authenticated endpoints)
  setAuthToken: function(context, events, done) {
    // In a real test, this would be a valid JWT token
    context.vars.authToken = 'Bearer mock-jwt-token-' + Date.now();
    return done();
  },

  // Log detailed request information for debugging
  logRequest: function(requestParams, response, context, ee, next) {
    if (process.env.DEBUG_REQUESTS === 'true') {
      console.log({
        method: requestParams.method || 'GET',
        url: requestParams.uri,
        status: response.statusCode,
        responseTime: response.timings ? response.timings.response : 'unknown',
        contentLength: response.body ? response.body.length : 0
      });
    }
    return next();
  },

  // Custom error handler for specific error types
  handleCustomErrors: function(requestParams, response, context, ee, next) {
    if (response.statusCode >= 400) {
      try {
        const errorData = JSON.parse(response.body);
        
        // Track specific error types
        if (errorData.code) {
          ee.emit('customStat', `error_${errorData.code}`, 1);
        }
        
        // Track rate limiting
        if (response.statusCode === 429) {
          ee.emit('customStat', 'rate_limited', 1);
        }
        
        // Track authentication errors
        if (response.statusCode === 401) {
          ee.emit('customStat', 'auth_error', 1);
        }
        
      } catch (error) {
        // Error response is not JSON
        ee.emit('customStat', 'non_json_error', 1);
      }
    }
    return next();
  },

  // Memory usage tracker (for monitoring during load test)
  trackMemoryUsage: function(context, events, done) {
    if (process.memoryUsage) {
      const usage = process.memoryUsage();
      context.vars.memoryUsage = {
        rss: Math.round(usage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024) // MB
      };
    }
    return done();
  }
};