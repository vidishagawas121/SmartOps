import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/authRoutes';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Google Authentication System', () => {
  it('should return 400 when attempting to use disabled Google Auth endpoint', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ role: 'Driver' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Google authentication is temporarily disabled');
  });

  it('should return 400 when registering with a googleToken', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ googleToken: 'mock-token' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Google authentication is temporarily disabled');
  });

  it('should return 400 when logging in with a googleToken', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ googleToken: 'mock-token' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Google authentication is temporarily disabled');
  });
});
