const request = require('supertest');
const app = require('./index');
const { authController, users } = require('./auth');
const jwt = require('jsonwebtoken');

// Mock google-auth-library
jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => {
      return {
        verifyIdToken: jest.fn().mockImplementation(async ({ idToken }) => {
          if (idToken === 'valid_token') {
            return {
              getPayload: () => ({
                email: 'googleuser@example.com',
                name: 'Google User',
                sub: '1234567890'
              })
            };
          } else {
             throw new Error('Invalid token');
          }
        })
      };
    })
  };
});

describe('Google Authentication', () => {
  beforeEach(() => {
    // Clear users
    users.length = 0;
  });

  it('should sign up a new user with valid Google token', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ token: 'valid_token' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.email).toBe('googleuser@example.com');
    expect(users.length).toBe(1);
    expect(users[0].email).toBe('googleuser@example.com');
    expect(users[0].password).toBeNull();
  });

  it('should sign in an existing user with valid Google token', async () => {
    // Pre-populate user
    users.push({
      id: 1,
      username: 'Google User',
      email: 'googleuser@example.com',
      password: null,
      roles: ['user']
    });

    const res = await request(app)
      .post('/api/auth/google')
      .send({ token: 'valid_token' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(users.length).toBe(1); // Should not duplicate
  });

  it('should fail with invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ token: 'invalid_token' });

    expect(res.statusCode).toEqual(401);
  });

  it('should prevent password login for google user (null password)', async () => {
     users.push({
      id: 1,
      username: 'Google User',
      email: 'googleuser@example.com',
      password: null,
      roles: ['user']
    });

    const res = await request(app)
      .post('/api/auth/signin')
      .send({ username: 'Google User', password: 'anypassword' });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe("Please login with Google.");
  });
});
