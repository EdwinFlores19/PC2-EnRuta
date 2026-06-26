import { jest, describe, it, expect } from '@jest/globals';

// Mockear base de datos y conexión para evitar fallos de inicialización
const mockPrisma: any = {
  $connect: jest.fn() as any,
  $disconnect: jest.fn() as any,
  $on: jest.fn() as any,
  $queryRaw: (jest.fn() as any).mockResolvedValue([{ current_database: 'test', current_user: 'test' }]),
};

jest.mock('../config/database', () => ({
  prisma: mockPrisma,
  connectDatabase: jest.fn() as any,
  disconnectDatabase: jest.fn() as any,
}));

// Mockear el middleware de autenticación para bypass de seguridad en pruebas
jest.mock('../src/middlewares/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', email: 'test@example.com', role: 'USER' };
    next();
  },
  authorize: (...roles: string[]) => (req: any, res: any, next: any) => {
    next();
  },
}));

// Mockear el servicio de IA general para probar el controlador de forma aislada
const mockGenerateText = jest.fn() as any;
const mockGenerateChat = jest.fn() as any;

jest.mock('../src/services/ai.service', () => ({
  generateText: mockGenerateText,
  generateChat: mockGenerateChat,
}));

// Mockear el servicio de IA especializada para probar los nuevos controladores
const mockParseCV = jest.fn() as any;
const mockHandleCandidateCoachChat = jest.fn() as any;
const mockHandleEmployerMatcherChat = jest.fn() as any;

jest.mock('../src/services/ai_models.service', () => ({
  parseCV: mockParseCV,
  handleCandidateCoachChat: mockHandleCandidateCoachChat,
  handleEmployerMatcherChat: mockHandleEmployerMatcherChat,
}));

import request from 'supertest';
import app from '../server';

describe('AI Module Endpoints', () => {
  describe('GET /api/v1/ai/test', () => {
    it('debería retornar 200 en éxito con el eco de la IA', async () => {
      mockGenerateText.mockResolvedValueOnce('Gemini está 100% operativo en este servidor.');

      const res = await request(app).get('/api/v1/ai/test');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('connection', 'successful');
      expect(res.body.data).toHaveProperty('response', 'Gemini está 100% operativo en este servidor.');
    });

    it('debería retornar 502 si el SDK de Google falla', async () => {
      mockGenerateText.mockRejectedValueOnce(new Error('API_KEY_SERVICE_BLOCKED'));

      const res = await request(app).get('/api/v1/ai/test');

      expect(res.status).toBe(502);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toContain('API_KEY_SERVICE_BLOCKED');
    });
  });

  describe('POST /api/v1/ai/generate', () => {
    it('debería rechazar prompts vacíos con error de validación 422', async () => {
      const res = await request(app)
        .post('/api/v1/ai/generate')
        .send({ prompt: '' });

      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('status', 'error');
    });

    it('debería procesar correctamente una solicitud de generación válida', async () => {
      mockGenerateText.mockResolvedValueOnce('Texto generado con éxito.');

      const res = await request(app)
        .post('/api/v1/ai/generate')
        .send({ prompt: 'Dame un reporte rápido.' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('text', 'Texto generado con éxito.');
    });
  });

  describe('POST /api/v1/ai/chat', () => {
    it('debería responder exitosamente y actualizar el historial', async () => {
      const mockResult = {
        text: 'Respuesta conversacional.',
        updatedHistory: [
          { role: 'user', text: 'Hola' },
          { role: 'model', text: 'Respuesta conversacional.' },
        ],
      };
      mockGenerateChat.mockResolvedValueOnce(mockResult);

      const res = await request(app)
        .post('/api/v1/ai/chat')
        .send({
          message: 'Hola',
          history: [],
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('text', 'Respuesta conversacional.');
      expect(res.body.data.updatedHistory).toHaveLength(2);
    });
  });

  describe('POST /api/v1/ai/cv/parse', () => {
    it('debería retornar 422 si rawText está vacío', async () => {
      const res = await request(app)
        .post('/api/v1/ai/cv/parse')
        .send({ rawText: '' });

      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('status', 'error');
    });

    it('debería retornar 201 en éxito con el perfil formalizado', async () => {
      const mockProfile = {
        formalTitle: 'Técnico de Detallado Vehicular',
        summary: 'Resumen profesional...',
        location: 'Breña',
      };
      mockParseCV.mockResolvedValueOnce(mockProfile);

      const res = await request(app)
        .post('/api/v1/ai/cv/parse')
        .send({ rawText: 'Hola, trabajé lavando carros...' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('formalTitle', 'Técnico de Detallado Vehicular');
    });
  });

  describe('POST /api/v1/ai/chat/candidate', () => {
    it('debería responder con éxito e incluir la respuesta de Fito', async () => {
      const mockResult = {
        sessionId: 'session-123',
        text: 'Hola, soy Fito...',
        history: [{ role: 'user', text: 'Hola' }, { role: 'model', text: 'Hola, soy Fito...' }],
      };
      mockHandleCandidateCoachChat.mockResolvedValueOnce(mockResult);

      const res = await request(app)
        .post('/api/v1/ai/chat/candidate')
        .send({ message: 'Hola' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('text', 'Hola, soy Fito...');
    });
  });

  describe('POST /api/v1/ai/chat/employer', () => {
    it('debería responder con éxito e incluir las recomendaciones de Ramiro', async () => {
      const mockResult = {
        sessionId: 'session-456',
        text: 'Recomiendo a los siguientes candidatos...',
        history: [{ role: 'user', text: 'Busco personal' }, { role: 'model', text: 'Recomiendo...' }],
      };
      mockHandleEmployerMatcherChat.mockResolvedValueOnce(mockResult);

      const res = await request(app)
        .post('/api/v1/ai/chat/employer')
        .send({ message: 'Busco personal' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('text', 'Recomiendo a los siguientes candidatos...');
    });
  });
});
