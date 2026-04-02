import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Types for the response
interface ProductPerformance {
  productId: string;
  productName: string;
  productNameAr: string | null;
  barcode: string;
  sku: string | null;
  category: string | null;
  brand: string | null;
  totalQuantitySold: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  turnoverRate: number;
  currentStock: number;
}

interface InventoryReport {
  productId: string;
  productName: string;
  productNameAr: string | null;
  barcode: string;
  category: string | null;
  brand: string | null;
  currentStock: number;
  minStock: number;
  maxStock: number | null;
  stockStatus: 'low' | 'normal' | 'high';
  stockValue: number;
  costPrice: number;
  sellingPrice: number;
  lastSaleDate: Date | null;
  daysWithoutSale: number | null;
  isStagnant: boolean;
}

interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  categoryNameAr: string | null;
  productCount: number;
  totalQuantitySold: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  stockValue: number;
  lowStockCount: number;
}

interface ProductReportResponse {
  performance: {
    topSelling: ProductPerformance[];
    lowSelling: ProductPerformance[];
    profitMargins: ProductPerformance[];
    turnoverRates: ProductPerformance[];
  };
  inventory: {
    lowStock: InventoryReport[];
    stockValue: number;
    stagnantProducts: InventoryReport[];
    summary: {
      totalProducts: number;
      totalStockValue: number;
      lowStockCount: number;
      stagnantCount: number;
    };
  };
  categories: {
    salesByCategory: CategoryPerformance[];
    categoryPerformance: CategoryPerformance[];
  };
  filters: {
    appliedFilters: {
      startDate: string;
      endDate: string;
      branchIds: string[] | null;
      categoryId: string | null;
      brandId: string | null;
      supplierId: string | null;
      stockStatus: string | null;
    };
  };
}

export async function GET(request: NextRequest): Promise<NextResponse<ProductReportResponse | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();
    const branchIds = searchParams.get('branchIds')?.split(',').filter(Boolean) || null;
    const categoryId = searchParams.get('categoryId');
    const brandId = searchParams.get('brandId');
    const supplierId = searchParams.get('supplierId');
    const stockStatus = searchParams.get('stockStatus') as 'low' | 'normal' | 'high' | null;

    // Build product where clause
    const productWhere: any = {
      isActive: true,
    };
    if (categoryId) productWhere.categoryId = categoryId;
    if (brandId) productWhere.brandId = brandId;
    if (supplierId) productWhere.supplierId = supplierId;

    // Build invoice where clause for date filtering
    const invoiceWhere: any = {
      createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
      status: 'COMPLETED',
    };
    if (branchIds && branchIds.length > 0) {
      invoiceWhere.branchId = { in: branchIds };
    }

    // Fetch products with their data
    const products = await db.product.findMany({
      where: productWhere,
      include: {
        category: true,
        brand: true,
        supplier: true,
        inventory: branchIds && branchIds.length > 0 
          ? { where: { branchId: { in: branchIds } } }
          : true,
        invoiceItems: {
          where: {
            invoice: invoiceWhere,
          },
          include: {
            invoice: { select: { createdAt: true } },
          },
        },
      },
    });

    // Fetch all invoice items for the period
    const invoiceItems = await db.invoiceItem.findMany({
      where: {
        invoice: invoiceWhere,
        productId: { not: null },
      },
      include: {
        invoice: { select: { createdAt: true, isReturn: true } },
      },
    });

    // Calculate product performance metrics
    const productPerformanceMap = new Map<string, ProductPerformance>();

    products.forEach(product => {
      const productItems = invoiceItems.filter(item => item.productId === product.id);
      
      // Calculate total quantity sold (excluding returns)
      let totalQuantitySold = 0;
      let totalRevenue = 0;
      let totalCost = 0;
      let lastSaleDate: Date | null = null;

      productItems.forEach(item => {
        if (!item.invoice.isReturn) {
          totalQuantitySold += item.quantity;
          totalRevenue += item.totalAmount;
          totalCost += item.costPrice * item.quantity;
          
          if (!lastSaleDate || item.invoice.createdAt > lastSaleDate) {
            lastSaleDate = item.invoice.createdAt;
          }
        }
      });

      // Calculate current stock
      const currentStock = product.inventory?.reduce((sum, inv) => sum + inv.quantity, 0) || 0;
      
      // Calculate profit and margin
      const profit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      
      // Calculate turnover rate (sold quantity / average stock)
      // If no stock, assume sold through completely
      const averageStock = currentStock > 0 ? currentStock : 1;
      const turnoverRate = totalQuantitySold / averageStock;

      productPerformanceMap.set(product.id, {
        productId: product.id,
        productName: product.name,
        productNameAr: product.nameAr,
        barcode: product.barcode,
        sku: product.sku,
        category: product.category?.name || null,
        brand: product.brand?.name || null,
        totalQuantitySold,
        totalRevenue,
        totalCost,
        profit,
        profitMargin,
        turnoverRate,
        currentStock,
      });
    });

    // Sort products for different reports
    const allPerformanceData = Array.from(productPerformanceMap.values());
    
    // Top selling products (by quantity)
    const topSelling = [...allPerformanceData]
      .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
      .slice(0, 20);

    // Low selling products (by quantity, excluding zero sales)
    const lowSelling = [...allPerformanceData]
      .filter(p => p.totalQuantitySold > 0)
      .sort((a, b) => a.totalQuantitySold - b.totalQuantitySold)
      .slice(0, 20);

    // Products by profit margin
    const profitMargins = [...allPerformanceData]
      .filter(p => p.totalRevenue > 0)
      .sort((a, b) => b.profitMargin - a.profitMargin)
      .slice(0, 20);

    // Products by turnover rate
    const turnoverRates = [...allPerformanceData]
      .filter(p => p.totalQuantitySold > 0)
      .sort((a, b) => b.turnoverRate - a.turnoverRate)
      .slice(0, 20);

    // ===== INVENTORY REPORT =====
    const inventoryReports: InventoryReport[] = products.map(product => {
      const currentStock = product.inventory?.reduce((sum, inv) => sum + inv.quantity, 0) || 0;
      const stockValue = currentStock * product.costPrice;
      
      // Determine stock status
      let stockStatus: 'low' | 'normal' | 'high' = 'normal';
      if (currentStock <= product.minStock) {
        stockStatus = 'low';
      } else if (product.maxStock && currentStock >= product.maxStock) {
        stockStatus = 'high';
      }

      // Calculate last sale date and stagnant status
      const productItems = invoiceItems.filter(item => item.productId === product.id);
      let lastSaleDate: Date | null = null;
      
      productItems.forEach(item => {
        if (!item.invoice.isReturn) {
          if (!lastSaleDate || item.invoice.createdAt > lastSaleDate) {
            lastSaleDate = item.invoice.createdAt;
          }
        }
      });

      const daysWithoutSale = lastSaleDate 
        ? Math.floor((new Date().getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      // Product is stagnant if no sales in the last 30 days
      const isStagnant = daysWithoutSale !== null && daysWithoutSale > 30;

      return {
        productId: product.id,
        productName: product.name,
        productNameAr: product.nameAr,
        barcode: product.barcode,
        category: product.category?.name || null,
        brand: product.brand?.name || null,
        currentStock,
        minStock: product.minStock,
        maxStock: product.maxStock,
        stockStatus,
        stockValue,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        lastSaleDate,
        daysWithoutSale,
        isStagnant,
      };
    });

    // Filter by stock status if provided
    let filteredInventoryReports = inventoryReports;
    if (stockStatus) {
      filteredInventoryReports = inventoryReports.filter(r => r.stockStatus === stockStatus);
    }

    // Low stock products
    const lowStock = filteredInventoryReports
      .filter(r => r.stockStatus === 'low')
      .sort((a, b) => a.currentStock - b.currentStock);

    // Stagnant products
    const stagnantProducts = filteredInventoryReports
      .filter(r => r.isStagnant)
      .sort((a, b) => (b.daysWithoutSale || 0) - (a.daysWithoutSale || 0));

    // Total stock value
    const totalStockValue = inventoryReports.reduce((sum, r) => sum + r.stockValue, 0);

    // ===== CATEGORY REPORT =====
    const categoryPerformanceMap = new Map<string, CategoryPerformance>();

    products.forEach(product => {
      if (!product.categoryId || !product.category) return;

      const performance = productPerformanceMap.get(product.id);
      const inventory = inventoryReports.find(r => r.productId === product.id);
      
      if (!performance || !inventory) return;

      if (!categoryPerformanceMap.has(product.categoryId)) {
        categoryPerformanceMap.set(product.categoryId, {
          categoryId: product.categoryId,
          categoryName: product.category.name,
          categoryNameAr: product.category.nameAr,
          productCount: 0,
          totalQuantitySold: 0,
          totalRevenue: 0,
          totalProfit: 0,
          profitMargin: 0,
          stockValue: 0,
          lowStockCount: 0,
        });
      }

      const category = categoryPerformanceMap.get(product.categoryId)!;
      category.productCount += 1;
      category.totalQuantitySold += performance.totalQuantitySold;
      category.totalRevenue += performance.totalRevenue;
      category.totalProfit += performance.profit;
      category.stockValue += inventory.stockValue;
      if (inventory.stockStatus === 'low') {
        category.lowStockCount += 1;
      }
    });

    // Calculate profit margin for each category
    const categoriesData = Array.from(categoryPerformanceMap.values()).map(cat => ({
      ...cat,
      profitMargin: cat.totalRevenue > 0 ? (cat.totalProfit / cat.totalRevenue) * 100 : 0,
    }));

    // Sales by category (sorted by revenue)
    const salesByCategory = [...categoriesData]
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Category performance (sorted by profit margin)
    const categoryPerformance = [...categoriesData]
      .filter(c => c.totalRevenue > 0)
      .sort((a, b) => b.profitMargin - a.profitMargin);

    // Build response
    const response: ProductReportResponse = {
      performance: {
        topSelling,
        lowSelling,
        profitMargins,
        turnoverRates,
      },
      inventory: {
        lowStock,
        stockValue: totalStockValue,
        stagnantProducts,
        summary: {
          totalProducts: products.length,
          totalStockValue,
          lowStockCount: lowStock.length,
          stagnantCount: stagnantProducts.length,
        },
      },
      categories: {
        salesByCategory,
        categoryPerformance,
      },
      filters: {
        appliedFilters: {
          startDate,
          endDate,
          branchIds,
          categoryId,
          brandId,
          supplierId,
          stockStatus,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Product report error:', error);
    return NextResponse.json({ error: 'حدث خطأ في تحميل تقرير المنتجات' }, { status: 500 });
  }
}
