/**
 * Auth API Tests
 * اختبارات API المصادقة
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import { POST } from '@/app/api/auth/login/route';
import { db } from '@/lib/db';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn((password) => `hashed_${password}`),
  generateToken: jest.fn(() => 'test-token-123'),
}));

// Helper to create mock request
function createMockRequest(url: string, options: { method?: string; body?: string } = {}) {
  return {
    url,
    method: options.method || 'POST',
    headers: new Map(),
    json: async () => JSON.parse(options.body || '{}'),
  } as any;
}

// Import mocked functions
const { hashPassword } = require('@/lib/auth');

describe('Auth API - POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation', () => {
    it('should return 400 when email is missing', async () => {
      const request = createMockRequest('http://localhost/api/auth/login', {
        body: JSON.stringify({ password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('البريد الإلكتروني وكلمة المرور مطلوبان');
    });

    it('should return 400 when password is missing', async () => {
      const request = createMockRequest('http://localhost/api/auth/login', {
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('البريد الإلكتروني وكلمة المرور مطلوبان');
    });

    it('should return 400 when both email and password are missing', async () => {
      const request = createMockRequest('http://localhost/api/auth/login', {
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('البريد الإلكتروني وكلمة المرور مطلوبان');
    });
  });

  describe('Authentication', () => {
    it('should return 401 when user does not exist', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest('http://localhost/api/auth/login', {
        body: JSON.stringify({ email: 'nonexistent@example.com', password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    });

    it('should return 401 when user is inactive', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed_password123',
        isActive: false,
        branch: null,
        permissions: [],
      });

      const request = createMockRequest('http://localhost/api/auth/login', {
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    });

    it('should return 401 when password is incorrect', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed_different_password',
        isActive: true,
        branch: null,
        permissions: [],
      });
      (hashPassword as jest.Mock).mockReturnValue('hashed_password123');

      const request = createMockRequest('http://localhost/api/auth/login', {
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    });
  });

  describe('Success', () => {
    it('should return user and token on successful login', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password123',
        isActive: true,
        role: 'ADMIN',
        branch: { id: 'branch-1', name: 'Main Branch' },
        permissions: [],
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (hashPassword as jest.Mock).mockReturnValue('hashed_password123');

      const request = createMockRequest('http://localhost/api/auth/login', {
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('test@example.com');
      expect(data.user.password).toBeUndefined(); // Password should not be returned
      expect(data.token).toBeDefined();
      expect(data.token).toBe('test-token-123');
    });

    it('should set auth cookie on successful login', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password123',
        isActive: true,
        branch: null,
        permissions: [],
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (hashPassword as jest.Mock).mockReturnValue('hashed_password123');

      const request = createMockRequest('http://localhost/api/auth/login', {
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      const response = await POST(request);
      const cookies = response.cookies.get('auth_token');

      expect(cookies).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      (db.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest('http://localhost/api/auth/login', {
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('حدث خطأ أثناء تسجيل الدخول');
    });
  });
});
