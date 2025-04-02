/**
 * API Health Checker
 * 
 * This script tests the health of critical API endpoints in the GrantiFuel application.
 * It makes requests to key endpoints and reports on their status.
 * 
 * Usage:
 * 1. Ensure the application is running
 * 2. Run this script with: node tests/api-health-checker.js
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Configuration
const config = {
  // Base URL of the API (change this to the actual URL)
  baseUrl: process.env.API_URL || 'http://localhost:3000',
  // Timeout in milliseconds
  timeout: 5000,
  // Endpoints to test
  endpoints: [
    { path: '/api/user', method: 'GET', name: 'Get Current User', expectAuth: true },
    { path: '/api/grants', method: 'GET', name: 'Get Grants' },
    { path: '/api/artists', method: 'GET', name: 'Get Artists' },
    { path: '/api/applications', method: 'GET', name: 'Get Applications', expectAuth: true },
    { path: '/api/templates', method: 'GET', name: 'Get Templates', expectAuth: true },
    // Add more endpoints as needed
  ]
};

// Helper function to make HTTP requests
async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint.path, config.baseUrl);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: endpoint.method,
      timeout: config.timeout,
      headers: {
        'User-Agent': 'GrantiFuel-API-Health-Checker/1.0'
      }
    };
    
    const startTime = Date.now();
    
    const req = protocol.request(options, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          parsedData = data;
        }
        
        // Evaluate response
        let status = 'success';
        let statusColor = colors.green;
        let details = '';
        
        // Check for expected authentication failures
        if (endpoint.expectAuth && res.statusCode === 401) {
          status = 'auth required';
          statusColor = colors.yellow;
          details = 'Authentication required (expected)';
        } 
        // Check for other error status codes
        else if (res.statusCode >= 400) {
          status = 'error';
          statusColor = colors.red;
          details = `Error status code: ${res.statusCode}`;
        }
        
        resolve({
          endpoint: endpoint.name,
          path: endpoint.path,
          method: endpoint.method,
          status,
          statusColor,
          statusCode: res.statusCode,
          responseTime,
          details,
          data: parsedData
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        endpoint: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        status: 'error',
        statusColor: colors.red,
        statusCode: 0,
        responseTime: Date.now() - startTime,
        details: `Request failed: ${error.message}`,
        data: null
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        endpoint: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        status: 'timeout',
        statusColor: colors.red,
        statusCode: 0,
        responseTime: config.timeout,
        details: 'Request timed out',
        data: null
      });
    });
    
    req.end();
  });
}

async function runTests() {
  console.log(`${colors.magenta}=== GrantiFuel API Health Check ===${colors.reset}`);
  console.log(`${colors.blue}Testing API at: ${config.baseUrl}${colors.reset}`);
  console.log(`${colors.blue}Testing ${config.endpoints.length} endpoints...${colors.reset}\n`);
  
  const results = [];
  
  // Test each endpoint
  for (const endpoint of config.endpoints) {
    process.stdout.write(`Testing ${endpoint.method} ${endpoint.path}... `);
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Print immediate result
    console.log(`${result.statusColor}${result.status}${colors.reset} (${result.statusCode}) - ${result.responseTime}ms`);
  }
  
  // Print summary
  console.log(`\n${colors.magenta}=== Results Summary ===${colors.reset}`);
  
  // Count by status
  const successCount = results.filter(r => r.status === 'success').length;
  const authCount = results.filter(r => r.status === 'auth required').length;
  const errorCount = results.filter(r => r.status === 'error' || r.status === 'timeout').length;
  
  console.log(`${colors.green}Success: ${successCount}${colors.reset}`);
  console.log(`${colors.yellow}Auth Required: ${authCount}${colors.reset}`);
  console.log(`${colors.red}Errors: ${errorCount}${colors.reset}`);
  
  // Print detailed results
  console.log(`\n${colors.magenta}=== Detailed Results ===${colors.reset}`);
  
  results.forEach(result => {
    console.log(`\n${colors.cyan}${result.endpoint} (${result.method} ${result.path})${colors.reset}`);
    console.log(`Status: ${result.statusColor}${result.status}${colors.reset} (${result.statusCode})`);
    console.log(`Response Time: ${result.responseTime}ms`);
    
    if (result.details) {
      console.log(`Details: ${result.details}`);
    }
    
    // Print a truncated version of the response data for successful responses
    if (result.status === 'success' && result.data) {
      const dataString = typeof result.data === 'string' 
        ? result.data 
        : JSON.stringify(result.data, null, 2);
      
      // Truncate long responses
      const truncated = dataString.length > 200 
        ? dataString.substring(0, 200) + '...' 
        : dataString;
      
      console.log(`Response: ${truncated}`);
    }
  });
  
  // Overall health assessment
  console.log(`\n${colors.magenta}=== Overall Health Assessment ===${colors.reset}`);
  
  const totalEndpoints = config.endpoints.length;
  const healthPercentage = ((successCount + authCount) / totalEndpoints) * 100;
  
  let healthStatus;
  let healthColor;
  
  if (healthPercentage === 100) {
    healthStatus = 'Excellent';
    healthColor = colors.green;
  } else if (healthPercentage >= 80) {
    healthStatus = 'Good';
    healthColor = colors.green;
  } else if (healthPercentage >= 60) {
    healthStatus = 'Fair';
    healthColor = colors.yellow;
  } else {
    healthStatus = 'Poor';
    healthColor = colors.red;
  }
  
  console.log(`API Health: ${healthColor}${healthStatus}${colors.reset} (${healthPercentage.toFixed(1)}%)`);
  
  if (errorCount > 0) {
    console.log(`\n${colors.yellow}⚠ Some endpoints are returning errors. Check the detailed results above.${colors.reset}`);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error(`${colors.red}Error running API health check:${colors.reset}`, error);
});