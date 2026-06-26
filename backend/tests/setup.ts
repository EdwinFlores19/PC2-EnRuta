process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-64bytes-fake-secret!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-only-64bytes-fake!';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.LOG_LEVEL = 'silent';
