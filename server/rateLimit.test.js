const request = require('supertest');
const app = require('./index');

describe('Rate Limiting', () => {
  it('should allow requests within the limit', async () => {
    // Send 5 requests (limit is 10)
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/auth/signin')
        .send({ username: 'test', password: 'password' });
      // We expect 404 (User Not Found) or 401 (Invalid Password) or 200, but NOT 429
      expect(res.statusCode).not.toEqual(429);
    }
  });

  it('should block requests over the limit', async () => {
    // Send 15 requests (limit is 10)
    // We already sent 5 above, so this will push it over
    let blocked = false;
    for (let i = 0; i < 15; i++) {
      const res = await request(app)
        .post('/api/auth/signin')
        .send({ username: 'test', password: 'password' });

      if (res.statusCode === 429) {
        blocked = true;
        break;
      }
    }
    expect(blocked).toBe(true);
  });
});
