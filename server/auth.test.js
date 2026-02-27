/**
 * @jest-environment node
 */
const request = require('supertest');
const app = require('./index');
const { users } = require('./auth');

describe('Auth Endpoints', () => {
  // Clear users before each test if using in-memory store
  // Since 'users' is a const array, we can't easily clear it without modifying the module. 
  // However, for this suite we can just use unique users.

  let userToken;
  let adminToken;

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123',
        roles: ['user']
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'User registered successfully!');
  });

  it('should not register a duplicate user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123'
      });
    expect(res.statusCode).toEqual(400);
  });

  it('should login the user and return a token', async () => {
    const res = await request(app)
      .post('/api/auth/signin')
      .send({
        username: 'testuser',
        password: 'password123'
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('accessToken');
    userToken = res.body.accessToken;
  });

  it('should access protected user content with token', async () => {
    const res = await request(app)
      .get('/api/test/user')
      .set('x-access-token', userToken);
    expect(res.statusCode).toEqual(200);
    expect(res.text).toEqual('User Content.');
  });

  it('should fail to access protected content without token', async () => {
    const res = await request(app)
      .get('/api/test/user');
    expect(res.statusCode).toEqual(403);
  });

  it('should fail to access protected content with invalid token', async () => {
    const res = await request(app)
      .get('/api/test/user')
      .set('x-access-token', 'invalidtoken');
    expect(res.statusCode).toEqual(401);
  });

  // Admin Tests
  it('should register an admin user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'admin',
        email: 'admin@test.com',
        password: 'password123',
        roles: ['admin']
      });
    expect(res.statusCode).toEqual(200);
  });

  it('should login the admin', async () => {
    const res = await request(app)
      .post('/api/auth/signin')
      .send({
        username: 'admin',
        password: 'password123'
      });
    expect(res.statusCode).toEqual(200);
    adminToken = res.body.accessToken;
  });

  it('should allow admin to access admin content', async () => {
    const res = await request(app)
      .get('/api/test/admin')
      .set('x-access-token', adminToken);
    expect(res.statusCode).toEqual(200);
    expect(res.text).toEqual('Admin Content.');
  });

  it('should deny non-admin user from accessing admin content', async () => {
    const res = await request(app)
      .get('/api/test/admin')
      .set('x-access-token', userToken);
    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty('message', 'Require Admin Role!');
  });
});
