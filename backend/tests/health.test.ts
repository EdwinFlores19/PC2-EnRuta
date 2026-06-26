import { jest, describe, it, expect } from '@jest/globals';

const mockPrisma: any = {
  $connect: jest.fn() as any,
  $disconnect: jest.fn() as any,
  $on: jest.fn() as any,
  $queryRaw: (jest.fn() as any).mockResolvedValue([{ current_database: 'test', current_user: 'test' }]),
  user: {
    findUnique: jest.fn() as any,
    findMany: jest.fn() as any,
    create: jest.fn() as any,
    update: jest.fn() as any,
    count: jest.fn() as any,
  },
};

jest.mock('../config/database', () => ({
  prisma: mockPrisma,
  connectDatabase: jest.fn() as any,
  disconnectDatabase: jest.fn() as any,
}));

import request from 'supertest';
import app from '../server';

describe('Health Check', () => {
  it('GET /api/health debería retornar status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
