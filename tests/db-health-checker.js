/**
 * Database Health Checker
 * 
 * This script tests the database connection and schema for GrantiFuel.
 * It connects to the database, verifies all tables exist, and runs basic queries.
 * 
 * Usage:
 * 1. Set DATABASE_URL environment variable
 * 2. Run with: node tests/db-health-checker.js
 */

const { Pool } = require('pg');
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Use DATABASE_URL environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Expected tables based on schema.ts
const expectedTables = [
  'users',
  'grants',
  'artists',
  'applications',
  'activities',
  'templates',
  'knowledge_documents',
  'subscription_plans',
  'subscriptions',
  'user_onboarding'
];

async function checkConnection() {
  console.log(`${colors.blue}Testing database connection...${colors.reset}`);
  
  try {
    const client = await pool.connect();
    console.log(`${colors.green}✓ Successfully connected to database${colors.reset}`);
    client.release();
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Failed to connect to database: ${error.message}${colors.reset}`);
    return false;
  }
}

async function checkTables() {
  console.log(`${colors.blue}Checking database tables...${colors.reset}`);
  
  try {
    const client = await pool.connect();
    
    // Query to get all tables in the public schema
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const existingTables = res.rows.map(row => row.table_name);
    console.log(`Found ${existingTables.length} tables in database.`);
    
    // Check if all expected tables exist
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length === 0) {
      console.log(`${colors.green}✓ All expected tables exist${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Missing tables: ${missingTables.join(', ')}${colors.reset}`);
    }
    
    // Check for extra tables
    const extraTables = existingTables.filter(table => !expectedTables.includes(table));
    if (extraTables.length > 0) {
      console.log(`${colors.yellow}ℹ Additional tables found: ${extraTables.join(', ')}${colors.reset}`);
    }
    
    client.release();
    return { missingTables, existingTables };
  } catch (error) {
    console.log(`${colors.red}✗ Failed to check tables: ${error.message}${colors.reset}`);
    return { missingTables: [], existingTables: [] };
  }
}

async function checkTableCounts() {
  console.log(`${colors.blue}Checking table row counts...${colors.reset}`);
  
  try {
    const client = await pool.connect();
    const counts = {};
    
    // Query row counts for all existing tables
    for (const table of expectedTables) {
      try {
        const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
        counts[table] = parseInt(res.rows[0].count, 10);
      } catch (error) {
        counts[table] = 'Error';
      }
    }
    
    // Display counts
    console.log(`${colors.cyan}Table row counts:${colors.reset}`);
    for (const [table, count] of Object.entries(counts)) {
      const statusColor = count === 'Error' ? colors.red : colors.green;
      console.log(`  ${table}: ${statusColor}${count}${colors.reset}`);
    }
    
    client.release();
    return counts;
  } catch (error) {
    console.log(`${colors.red}✗ Failed to check table counts: ${error.message}${colors.reset}`);
    return {};
  }
}

async function checkForeignKeys() {
  console.log(`${colors.blue}Checking foreign key constraints...${colors.reset}`);
  
  try {
    const client = await pool.connect();
    
    // Query to get all foreign key constraints
    const res = await client.query(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu 
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY';
    `);
    
    if (res.rows.length === 0) {
      console.log(`${colors.yellow}⚠ No foreign key constraints found${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ Found ${res.rows.length} foreign key constraints${colors.reset}`);
      
      // Display foreign keys
      console.log(`${colors.cyan}Foreign key relationships:${colors.reset}`);
      res.rows.forEach(row => {
        console.log(`  ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
      });
    }
    
    client.release();
    return res.rows;
  } catch (error) {
    console.log(`${colors.red}✗ Failed to check foreign keys: ${error.message}${colors.reset}`);
    return [];
  }
}

async function checkPerformance() {
  console.log(`${colors.blue}Running performance checks...${colors.reset}`);
  
  try {
    const client = await pool.connect();
    
    // Test a few simple queries
    console.log('Testing query performance...');
    
    const tests = [
      { name: 'Simple SELECT', query: 'SELECT * FROM users LIMIT 10' },
      { name: 'COUNT query', query: 'SELECT COUNT(*) FROM grants' },
      { name: 'JOIN query', query: 'SELECT a.* FROM applications a JOIN artists ar ON a.artist_id = ar.id LIMIT 10' }
    ];
    
    for (const test of tests) {
      const start = Date.now();
      try {
        await client.query(test.query);
        const duration = Date.now() - start;
        console.log(`  ${test.name}: ${colors.green}${duration}ms${colors.reset}`);
      } catch (error) {
        console.log(`  ${test.name}: ${colors.red}Failed - ${error.message}${colors.reset}`);
      }
    }
    
    client.release();
  } catch (error) {
    console.log(`${colors.red}✗ Failed to run performance checks: ${error.message}${colors.reset}`);
  }
}

async function runTests() {
  console.log(`${colors.magenta}=== GrantiFuel Database Health Check ===${colors.reset}`);
  
  // Check database connection
  const connected = await checkConnection();
  if (!connected) {
    console.log(`${colors.red}Cannot proceed with tests - database connection failed${colors.reset}`);
    return;
  }
  
  // Check expected tables
  const { missingTables, existingTables } = await checkTables();
  
  // Only proceed with further tests if we have tables
  if (existingTables.length > 0) {
    // Check row counts
    await checkTableCounts();
    
    // Check foreign keys
    await checkForeignKeys();
    
    // Check performance
    await checkPerformance();
  }
  
  // Summary
  console.log(`\n${colors.magenta}=== Test Summary ===${colors.reset}`);
  
  if (missingTables.length === 0 && connected) {
    console.log(`${colors.green}✓ Database appears to be healthy${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ Database has some issues that need attention${colors.reset}`);
  }
  
  // Close pool
  await pool.end();
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Error running database health check:${colors.reset}`, error);
  pool.end();
});