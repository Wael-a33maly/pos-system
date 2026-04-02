import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

// GET /api/receipt-templates - جلب القوالب
export async function GET(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const branchId = searchParams.get('branchId');

    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type;
    if (branchId) where.branchId = branchId;

    const templates = await db.receiptTemplate.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }]
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Receipt templates fetch error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// POST /api/receipt-templates - إنشاء قالب جديد
export async function POST(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user || user.role === 'USER') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await req.json();
    
    const template = await db.receiptTemplate.create({
      data: {
        name: body.name,
        nameAr: body.nameAr,
        type: body.type || 'invoice',
        branchId: body.branchId,
        paperWidth: body.paperWidth || 80,
        paperType: body.paperType || 'thermal',
        fontFamily: body.fontFamily || 'monospace',
        fontSizeSmall: body.fontSizeSmall || 10,
        fontSizeNormal: body.fontSizeNormal || 12,
        fontSizeLarge: body.fontSizeLarge || 14,
        fontSizeTitle: body.fontSizeTitle || 18,
        fontSizeTotal: body.fontSizeTotal || 16,
        fontBold: body.fontBold ?? true,
        showLogo: body.showLogo ?? true,
        logoAlignment: body.logoAlignment || 'center',
        showCompanyName: body.showCompanyName ?? true,
        companyNameStyle: body.companyNameStyle || 'bold_large',
        showBranchName: body.showBranchName ?? true,
        showBranchAddress: body.showBranchAddress ?? true,
        showBranchPhone: body.showBranchPhone ?? true,
        showTaxNumber: body.showTaxNumber ?? true,
        headerAlignment: body.headerAlignment || 'center',
        showSku: body.showSku ?? false,
        showProductName: body.showProductName ?? true,
        showVariant: body.showVariant ?? true,
        showQuantity: body.showQuantity ?? true,
        showUnitPrice: body.showUnitPrice ?? true,
        showDiscount: body.showDiscount ?? true,
        showTax: body.showTax ?? true,
        showLineTotal: body.showLineTotal ?? true,
        showBarcode: body.showBarcode ?? false,
        showSubtotal: body.showSubtotal ?? true,
        showDiscountTotal: body.showDiscountTotal ?? true,
        showTaxTotal: body.showTaxTotal ?? true,
        showTotal: body.showTotal ?? true,
        showPaid: body.showPaid ?? true,
        showChange: body.showChange ?? true,
        totalsAlignment: body.totalsAlignment || 'right',
        showThankYou: body.showThankYou ?? true,
        thankYouMessage: body.thankYouMessage || 'شكراً لزيارتكم',
        showReturnPolicy: body.showReturnPolicy ?? false,
        returnPolicyText: body.returnPolicyText,
        showQRCode: body.showQRCode ?? false,
        showInvoiceBarcode: body.showInvoiceBarcode ?? true,
        showDateTime: body.showDateTime ?? true,
        showCashier: body.showCashier ?? true,
        showInvoiceNumber: body.showInvoiceNumber ?? true,
        showSeparator: body.showSeparator ?? true,
        separatorChar: body.separatorChar || '-',
        marginTop: body.marginTop || 0,
        marginBottom: body.marginBottom || 0,
        lineSpacing: body.lineSpacing || 1,
        isDefault: body.isDefault ?? false,
        isActive: body.isActive ?? true,
      }
    });

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('Receipt template create error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
