import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/authRoutes';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Google Authentication System', () => {
  it('should return 400 when attempting to authenticate without a token', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ role: 'Owner' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Google credential token is required');
  });

  it('should return 400 when registering with an invalid googleToken', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ googleToken: 'invalid-mock-token' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/token|verification|failed/i);
  });

  it('should return 400 when logging in with an invalid googleToken', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ googleToken: 'invalid-mock-token' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/token|verification|failed/i);
  });
});
