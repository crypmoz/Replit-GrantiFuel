import request from 'supertest';
import { Express } from 'express';
import { createTestServer, generateTestUser, clearDatabase } from './setup';

describe('Authentication API', () => {
  let app: Express;

  beforeAll(async () => {
    app = createTestServer();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = generateTestUser();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe(userData.username);
      expect(response.body.email).toBe(userData.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 400 for invalid registration data', async () => {
      const invalidData = {
        username: 'test',
        password: '123', // Too short
        email: 'invalid-email',
        name: ''
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 for duplicate username', async () => {
      const userData = generateTestUser();
      
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Second registration with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('UNIQUE_CONSTRAINT_VIOLATION');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const userData = generateTestUser();
      
      // Register user first
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: userData.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(userData.username);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for incorrect password', async () => {
      const userData = generateTestUser();
      
      // Register user first
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to login with wrong password
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toBe('Invalid credentials');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const userData = generateTestUser();
      
      // Register and login user first
      await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: userData.password
        });

      const cookie = loginResponse.headers['set-cookie'];

      // Try to logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie);

      expect(response.status).toBe(200);
      expect(response.headers['set-cookie'][0]).toMatch(/Max-Age=0/);
    });
  });
}); 