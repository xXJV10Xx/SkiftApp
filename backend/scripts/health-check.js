#!/usr/bin/env node

// Health Check Script for SSAB Backend
const http = require('http');
const https = require('https');

const config = {
  host: process.env.HEALTH_CHECK_HOST || 'localhost',
  port: process.env.HEALTH_CHECK_PORT || 3002,
  path: '/api/health',
  timeout: 5000,
  retries: 3,
  retryDelay: 2000
};

async function performHealthCheck() {
  console.log('🏥 Starting health check...');
  console.log(`Target: ${config.host}:${config.port}${config.path}`);
  
  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      console.log(`\n📡 Attempt ${attempt}/${config.retries}`);
      
      const result = await makeRequest();
      
      if (result.success) {
        console.log('✅ Health check passed!');
        console.log(`📊 Response time: ${result.responseTime}ms`);
        console.log(`📋 Status: ${result.data.status}`);
        console.log(`⏰ Timestamp: ${result.data.timestamp}`);
        
        // Additional checks
        await performAdditionalChecks();
        
        process.exit(0);
      } else {
        console.log(`❌ Health check failed: ${result.error}`);
        
        if (attempt < config.retries) {
          console.log(`⏳ Waiting ${config.retryDelay}ms before retry...`);
          await sleep(config.retryDelay);
        }
      }
    } catch (error) {
      console.log(`💥 Unexpected error: ${error.message}`);
      
      if (attempt < config.retries) {
        console.log(`⏳ Waiting ${config.retryDelay}ms before retry...`);
        await sleep(config.retryDelay);
      }
    }
  }
  
  console.log('\n❌ All health check attempts failed!');
  process.exit(1);
}

function makeRequest() {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const protocol = config.port === 443 ? https : http;
    
    const options = {
      hostname: config.host,
      port: config.port,
      path: config.path,
      method: 'GET',
      timeout: config.timeout,
      headers: {
        'User-Agent': 'SSAB-HealthCheck/1.0'
      }
    };
    
    const req = protocol.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsedData = JSON.parse(data);
            resolve({
              success: true,
              responseTime,
              data: parsedData,
              statusCode: res.statusCode
            });
          } else {
            resolve({
              success: false,
              error: `HTTP ${res.statusCode}: ${data}`,
              responseTime,
              statusCode: res.statusCode
            });
          }
        } catch (error) {
          resolve({
            success: false,
            error: `Invalid JSON response: ${error.message}`,
            responseTime,
            statusCode: res.statusCode
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: `Request timeout after ${config.timeout}ms`,
        responseTime: Date.now() - startTime
      });
    });
    
    req.end();
  });
}

async function performAdditionalChecks() {
  console.log('\n🔍 Performing additional checks...');
  
  // Check database connectivity (through API)
  try {
    const dbCheck = await makeApiRequest('/api/shifts/31?startDate=2024-01-01&endDate=2024-01-01');
    if (dbCheck.success) {
      console.log('✅ Database connectivity: OK');
    } else {
      console.log('⚠️  Database connectivity: Failed');
    }
  } catch (error) {
    console.log('⚠️  Database connectivity: Error -', error.message);
  }
  
  // Check memory usage
  const memoryUsage = process.memoryUsage();
  console.log(`📊 Memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
  
  // Check system uptime (if available)
  try {
    const uptime = process.uptime();
    console.log(`⏱️  Process uptime: ${Math.round(uptime)}s`);
  } catch (error) {
    // Uptime not available
  }
}

function makeApiRequest(path) {
  return new Promise((resolve) => {
    const protocol = config.port === 443 ? https : http;
    
    const options = {
      hostname: config.host,
      port: config.port,
      path: path,
      method: 'GET',
      timeout: config.timeout,
      headers: {
        'User-Agent': 'SSAB-HealthCheck/1.0'
      }
    };
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          success: res.statusCode === 200,
          statusCode: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout'
      });
    });
    
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Health check interrupted');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Health check terminated');
  process.exit(143);
});

// Run the health check
if (require.main === module) {
  performHealthCheck().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  performHealthCheck,
  makeRequest,
  config
};