/**
 * Invoices API Tests
 * اختبارات API الفواتير
 */

import { GET, POST } from '@/app/api/invoices/route';
import { db } from '@/lib/db';

// Mock database
jest.mock('@/lib/db', () => ({
  db: {
    invoice: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
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

describe('Invoices API - GET /api/invoices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('List Invoices', () => {
    it('should return list of invoices', async () => {
      const mockInvoices = [
        { id: '1', invoiceNumber: 'INV-000001', totalAmount: 500 },
        { id: '2', invoiceNumber: 'INV-000002', totalAmount: 750 },
      ];

      (db.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);
      (db.invoice.count as jest.Mock).mockResolvedValue(2);

      const request = createMockRequest('http://localhost/api/invoices');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.invoices).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('should filter invoices by status', async () => {
      const mockInvoices = [
        { id: '1', invoiceNumber: 'INV-000001', status: 'COMPLETED' },
      ];

      (db.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);
      (db.invoice.count as jest.Mock).mockResolvedValue(1);

      const request = createMockRequest('http://localhost/api/invoices?status=COMPLETED');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(db.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'COMPLETED',
          }),
        })
      );
    });

    it('should filter invoices by branch', async () => {
      const mockInvoices = [
        { id: '1', invoiceNumber: 'INV-000001', branchId: 'branch-1' },
      ];

      (db.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);
      (db.invoice.count as jest.Mock).mockResolvedValue(1);

      const request = createMockRequest('http://localhost/api/invoices?branchId=branch-1');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(db.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branchId: 'branch-1',
          }),
        })
      );
    });

    it('should search invoices by invoice number', async () => {
      const mockInvoices = [
        { id: '1', invoiceNumber: 'INV-000001' },
      ];

      (db.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);
      (db.invoice.count as jest.Mock).mockResolvedValue(1);

      const request = createMockRequest('http://localhost/api/invoices?search=INV-000001');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(db.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            invoiceNumber: { contains: 'INV-000001' },
          }),
        })
      );
    });

    it('should support pagination', async () => {
      (db.invoice.findMany as jest.Mock).mockResolvedValue([]);
      (db.invoice.count as jest.Mock).mockResolvedValue(100);

      const request = createMockRequest('http://localhost/api/invoices?page=2&limit=20');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(db.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      (db.invoice.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('http://localhost/api/invoices');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('حدث خطأ');
    });
  });
});

describe('Invoices API - POST /api/invoices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Invoice', () => {
    it('should create a new invoice with auto-generated invoice number', async () => {
      const mockInvoice = {
        id: '1',
        invoiceNumber: 'INV-000001',
        totalAmount: 500,
        status: 'COMPLETED',
        items: [],
        payments: [],
      };

      (db.invoice.findFirst as jest.Mock).mockResolvedValue(null);
      (db.invoice.create as jest.Mock).mockResolvedValue(mockInvoice);

      const request = createMockRequest('http://localhost/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          branchId: 'branch-1',
          userId: 'user-1',
          totalAmount: 500,
          paidAmount: 500,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.invoice.invoiceNumber).toBe('INV-000001');
    });

    it('should increment invoice number from last invoice', async () => {
      const mockInvoice = {
        id: '2',
        invoiceNumber: 'INV-000002',
        totalAmount: 750,
      };

      (db.invoice.findFirst as jest.Mock).mockResolvedValue({
        invoiceNumber: 'INV-000001',
      });
      (db.invoice.create as jest.Mock).mockResolvedValue(mockInvoice);

      const request = createMockRequest('http://localhost/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          branchId: 'branch-1',
          userId: 'user-1',
          totalAmount: 750,
          paidAmount: 750,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.invoice.invoiceNumber).toBe('INV-000002');
    });

    it('should create invoice with default status COMPLETED', async () => {
      const mockInvoice = {
        id: '1',
        invoiceNumber: 'INV-000001',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
      };

      (db.invoice.findFirst as jest.Mock).mockResolvedValue(null);
      (db.invoice.create as jest.Mock).mockResolvedValue(mockInvoice);

      const request = createMockRequest('http://localhost/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          branchId: 'branch-1',
          userId: 'user-1',
          totalAmount: 500,
          paidAmount: 500,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(db.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
            paymentStatus: 'PAID',
          }),
        })
      );
    });

    it('should return 500 on database error', async () => {
      (db.invoice.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('http://localhost/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          branchId: 'branch-1',
          userId: 'user-1',
          totalAmount: 500,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('حدث خطأ أثناء إنشاء الفاتورة');
    });
  });
});
