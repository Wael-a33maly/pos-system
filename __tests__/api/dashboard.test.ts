/**
 * Dashboard API Tests
 * اختبارات API لوحة التحكم
 */

import { GET } from '@/app/api/dashboard/stats/route';
import { db } from '@/lib/db';

// Mock database
jest.mock('@/lib/db', () => ({
  db: {
    invoice: {
      findMany: jest.fn(),
    },
    invoiceItem: {
      findMany: jest.fn(),
    },
    shift: {
      count: jest.fn(),
    },
    inventory: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
    },
    branch: {
      findMany: jest.fn(),
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

describe('Dashboard API - GET /api/dashboard/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('KPIs', () => {
    it('should return dashboard KPIs', async () => {
      const mockInvoices = [
        { id: '1', totalAmount: 500, items: [], branchId: 'branch-1', userId: 'user-1', branch: { name: 'Branch 1' }, user: { name: 'User 1' } },
        { id: '2', totalAmount: 300, items: [], branchId: 'branch-1', userId: 'user-1', branch: { name: 'Branch 1' }, user: { name: 'User 1' } },
      ];

      (db.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);
      (db.shift.count as jest.Mock).mockResolvedValue(2);
      (db.inventory.count as jest.Mock).mockResolvedValue(5);
      (db.payment.findMany as jest.Mock).mockResolvedValue([]);
      (db.invoiceItem.findMany as jest.Mock).mockResolvedValue([]);
      (db.branch.findMany as jest.Mock).mockResolvedValue([]);
      (db.inventory.findMany as jest.Mock).mockResolvedValue([]);

      const request = createMockRequest('http://localhost/api/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.kpis).toBeDefined();
      expect(data.kpis.todaySales).toBe(800);
      expect(data.kpis.todayInvoices).toBe(2);
    });

    it('should calculate average order value correctly', async () => {
      const mockInvoices = [
        { id: '1', totalAmount: 500, items: [], branchId: 'branch-1', userId: 'user-1', branch: { name: 'Branch 1' }, user: { name: 'User 1' } },
        { id: '2', totalAmount: 300, items: [], branchId: 'branch-1', userId: 'user-1', branch: { name: 'Branch 1' }, user: { name: 'User 1' } },
        { id: '3', totalAmount: 400, items: [], branchId: 'branch-1', userId: 'user-1', branch: { name: 'Branch 1' }, user: { name: 'User 1' } },
      ];

      (db.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);
      (db.shift.count as jest.Mock).mockResolvedValue(2);
      (db.inventory.count as jest.Mock).mockResolvedValue(5);
      (db.payment.findMany as jest.Mock).mockResolvedValue([]);
      (db.invoiceItem.findMany as jest.Mock).mockResolvedValue([]);
      (db.branch.findMany as jest.Mock).mockResolvedValue([]);
      (db.inventory.findMany as jest.Mock).mockResolvedValue([]);

      const request = createMockRequest('http://localhost/api/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.kpis.averageOrderValue).toBe(400); // (500 + 300 + 400) / 3
    });

    it('should handle zero sales gracefully', async () => {
      (db.invoice.findMany as jest.Mock).mockResolvedValue([]);
      (db.shift.count as jest.Mock).mockResolvedValue(0);
      (db.inventory.count as jest.Mock).mockResolvedValue(0);
      (db.payment.findMany as jest.Mock).mockResolvedValue([]);
      (db.invoiceItem.findMany as jest.Mock).mockResolvedValue([]);
      (db.branch.findMany as jest.Mock).mockResolvedValue([]);
      (db.inventory.findMany as jest.Mock).mockResolvedValue([]);

      const request = createMockRequest('http://localhost/api/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.kpis.todaySales).toBe(0);
      expect(data.kpis.todayInvoices).toBe(0);
      expect(data.kpis.averageOrderValue).toBe(0);
      expect(data.kpis.salesChange).toBe(0);
    });
  });

  describe('Branch Filter', () => {
    it('should filter by branch when branchId is provided', async () => {
      (db.invoice.findMany as jest.Mock).mockResolvedValue([]);
      (db.shift.count as jest.Mock).mockResolvedValue(0);
      (db.inventory.count as jest.Mock).mockResolvedValue(0);
      (db.payment.findMany as jest.Mock).mockResolvedValue([]);
      (db.invoiceItem.findMany as jest.Mock).mockResolvedValue([]);
      (db.branch.findMany as jest.Mock).mockResolvedValue([]);
      (db.inventory.findMany as jest.Mock).mockResolvedValue([]);

      const request = createMockRequest('http://localhost/api/dashboard/stats?branchId=branch-1');
      const response = await GET(request);

      expect(response.status).toBe(200);
      // Check that branchId filter is applied
      expect(db.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branchId: 'branch-1',
          }),
        })
      );
    });
  });

  describe('Hourly Sales', () => {
    it('should return hourly sales data for 24 hours', async () => {
      const mockInvoices = [
        { id: '1', totalAmount: 100, createdAt: new Date('2024-01-01T10:00:00'), items: [] },
        { id: '2', totalAmount: 200, createdAt: new Date('2024-01-01T10:30:00'), items: [] },
        { id: '3', totalAmount: 150, createdAt: new Date('2024-01-01T14:00:00'), items: [] },
      ];

      (db.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);
      (db.shift.count as jest.Mock).mockResolvedValue(0);
      (db.inventory.count as jest.Mock).mockResolvedValue(0);
      (db.payment.findMany as jest.Mock).mockResolvedValue([]);
      (db.invoiceItem.findMany as jest.Mock).mockResolvedValue([]);
      (db.branch.findMany as jest.Mock).mockResolvedValue([]);
      (db.inventory.findMany as jest.Mock).mockResolvedValue([]);

      const request = createMockRequest('http://localhost/api/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hourlySales).toBeDefined();
      expect(data.hourlySales).toHaveLength(24);
    });
  });

  describe('Top Products', () => {
    it('should return top selling products', async () => {
      const mockItems = [
        { productId: 'prod-1', productName: 'Product 1', quantity: 10, unitPrice: 100, costPrice: 50, totalAmount: 1000 },
        { productId: 'prod-2', productName: 'Product 2', quantity: 5, unitPrice: 200, costPrice: 100, totalAmount: 1000 },
        { productId: 'prod-1', productName: 'Product 1', quantity: 3, unitPrice: 100, costPrice: 50, totalAmount: 300 },
      ];

      (db.invoice.findMany as jest.Mock).mockResolvedValue([]);
      (db.shift.count as jest.Mock).mockResolvedValue(0);
      (db.inventory.count as jest.Mock).mockResolvedValue(0);
      (db.payment.findMany as jest.Mock).mockResolvedValue([]);
      (db.invoiceItem.findMany as jest.Mock).mockResolvedValue(mockItems);
      (db.branch.findMany as jest.Mock).mockResolvedValue([]);
      (db.inventory.findMany as jest.Mock).mockResolvedValue([]);

      const request = createMockRequest('http://localhost/api/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.topProducts).toBeDefined();
    });
  });

  describe('Low Stock Alert', () => {
    it('should return products with low stock', async () => {
      const mockLowStock = [
        {
          product: { id: 'prod-1', name: 'Product 1', nameAr: 'منتج 1', barcode: '123', minStock: 10, category: { name: 'Category 1' } },
          branch: { name: 'Branch 1' },
          quantity: 0,
        },
        {
          product: { id: 'prod-2', name: 'Product 2', nameAr: 'منتج 2', barcode: '456', minStock: 5, category: { name: 'Category 2' } },
          branch: { name: 'Branch 1' },
          quantity: -2,
        },
      ];

      (db.invoice.findMany as jest.Mock).mockResolvedValue([]);
      (db.shift.count as jest.Mock).mockResolvedValue(0);
      (db.inventory.count as jest.Mock).mockResolvedValue(2);
      (db.payment.findMany as jest.Mock).mockResolvedValue([]);
      (db.invoiceItem.findMany as jest.Mock).mockResolvedValue([]);
      (db.branch.findMany as jest.Mock).mockResolvedValue([]);
      (db.inventory.findMany as jest.Mock).mockResolvedValue(mockLowStock);

      const request = createMockRequest('http://localhost/api/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lowStockAlert).toBeDefined();
      expect(data.kpis.lowStockProducts).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      (db.invoice.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('http://localhost/api/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('حدث خطأ في تحميل البيانات');
    });
  });
});
