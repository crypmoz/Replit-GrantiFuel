import { type Express } from 'express';
import request from 'supertest';
import { db } from '../db';
import { redis } from '../middleware/cache';

// Global setup
beforeAll(async () => {
  // Clear database and cache before all tests
  await clearDatabase();
  await clearCache();
});

// Global teardown
afterAll(async () => {
  // Close database and Redis connections
  await db.end();
  await redis.quit();
});

// Clear database helper
export async function clearDatabase() {
  // Add tables to clear here
  const tables = [
    'users',
    'grants',
    'artists',
    'applications',
    'documents',
    'subscriptions',
    'subscription_plans'
  ];

  for (const table of tables) {
    await db.execute(`TRUNCATE TABLE ${table} CASCADE`);
  }
}

// Clear cache helper
export async function clearCache() {
  await redis.flushall();
}

// Test utilities
export function createTestServer() {
  return require('../index').default as Express;
}

// Auth helpers
export async function loginTestUser(server: Express, credentials: { username: string; password: string }) {
  const response = await request(server)
    .post('/api/auth/login')
    .send(credentials);
  
  return response.headers['set-cookie'];
}

export async function createTestUser(server: Express, userData: {
  username: string;
  password: string;
  email: string;
  name: string;
}) {
  return request(server)
    .post('/api/auth/register')
    .send(userData);
}

// Test data generators
export function generateTestUser(overrides = {}) {
  return {
    username: `test-${Date.now()}`,
    password: 'Test123!@#',
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    ...overrides
  };
}

export function generateTestGrant(overrides = {}) {
  return {
    name: `Test Grant ${Date.now()}`,
    organization: 'Test Organization',
    amount: 10000,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    description: 'Test grant description',
    requirements: ['requirement1', 'requirement2'],
    ...overrides
  };
}

export function generateTestArtist(overrides = {}) {
  return {
    name: `Test Artist ${Date.now()}`,
    email: `artist-${Date.now()}@example.com`,
    phone: '+1234567890',
    genres: ['rock', 'jazz'],
    bio: 'Test artist bio',
    ...overrides
  };
}

export function generateTestApplication(overrides = {}) {
  return {
    status: 'draft',
    content: 'Test application content',
    startedAt: new Date(),
    submittedAt: null,
    ...overrides
  };
}

// Mock Stripe helper
export const mockStripe = {
  customers: {
    create: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
  },
  subscriptions: {
    create: jest.fn().mockResolvedValue({ id: 'sub_test123' }),
  },
  paymentIntents: {
    create: jest.fn().mockResolvedValue({ 
      id: 'pi_test123',
      client_secret: 'test_secret' 
    }),
  }
}; 