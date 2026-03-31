/**
 * Products API Tests
 * اختبارات API المنتجات
 */

import { GET, POST } from '@/app/api/products/route';
import { db } from '@/lib/db';

// Mock database
jest.mock('@/lib/db', () => ({
  db: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Helper to create mock request
function createMockRequest(url: string, options: { method?: string; body?: string } = {}) {
  return {
    url,
    method: options.method || 'GET',
    headers: new Map(),
    json: async () => JSON.parse(options.body || '{}'),
  } as any;
}

describe('Products API - GET /api/products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('List Products', () => {
    it('should return list of products', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', barcode: '123', price: 100 },
        { id: '2', name: 'Product 2', barcode: '456', price: 200 },
      ];

      (db.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (db.product.count as jest.Mock).mockResolvedValue(2);

      const request = createMockRequest('http://localhost/api/products');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.products).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('should filter products by search term', async () => {
      const mockProducts = [
        { id: '1', name: 'Test Product', barcode: '123', price: 100 },
      ];

      (db.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (db.product.count as jest.Mock).mockResolvedValue(1);

      const request = createMockRequest('http://localhost/api/products?search=Test');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'Test' } },
              { barcode: { contains: 'Test' } },
              { sku: { contains: 'Test' } },
            ]),
          }),
        })
      );
    });

    it('should filter products by category', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', categoryId: 'cat-1' },
      ];

      (db.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (db.product.count as jest.Mock).mockResolvedValue(1);

      const request = createMockRequest('http://localhost/api/products?categoryId=cat-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'cat-1',
          }),
        })
      );
    });

    it('should support pagination', async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([]);
      (db.product.count as jest.Mock).mockResolvedValue(100);

      const request = createMockRequest('http://localhost/api/products?page=2&limit=10');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should return empty array when no products found', async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([]);
      (db.product.count as jest.Mock).mockResolvedValue(0);

      const request = createMockRequest('http://localhost/api/products');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.products).toHaveLength(0);
      expect(data.total).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      (db.product.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('http://localhost/api/products');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('حدث خطأ أثناء جلب المنتجات');
    });
  });
});

describe('Products API - POST /api/products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Product', () => {
    it('should create a new product successfully', async () => {
      const mockProduct = {
        id: '1',
        name: 'New Product',
        barcode: '789',
        sellingPrice: 150,
        costPrice: 100,
        isActive: true,
      };

      (db.product.create as jest.Mock).mockResolvedValue(mockProduct);

      const request = createMockRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Product',
          barcode: '789',
          sellingPrice: 150,
          costPrice: 100,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.product.name).toBe('New Product');
    });

    it('should create product with default values', async () => {
      const mockProduct = {
        id: '1',
        name: 'New Product',
        barcode: '789',
        costPrice: 0,
        sellingPrice: 0,
        minStock: 0,
        unit: 'piece',
        isActive: true,
        hasVariants: false,
      };

      (db.product.create as jest.Mock).mockResolvedValue(mockProduct);

      const request = createMockRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Product',
          barcode: '789',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(db.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            costPrice: 0,
            sellingPrice: 0,
            minStock: 0,
            unit: 'piece',
            isActive: true,
            hasVariants: false,
          }),
        })
      );
    });

    it('should return 400 for duplicate barcode', async () => {
      const error = new Error('Unique constraint failed') as any;
      error.code = 'P2002';
      (db.product.create as jest.Mock).mockRejectedValue(error);

      const request = createMockRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Product',
          barcode: 'existing-barcode',
          sellingPrice: 100,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('الباركود مستخدم بالفعل');
    });

    it('should return 500 on database error', async () => {
      (db.product.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Product',
          barcode: '789',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('حدث خطأ أثناء إنشاء المنتج');
    });
  });
});
