// ============================================
// Printing Template API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/printing/[id] - Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const template = await db.receiptTemplate.findUnique({
      where: { id },
    });
    
    if (!template) {
      return NextResponse.json({ error: 'القالب غير موجود' }, { status: 404 });
    }
    
    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'خطأ في جلب القالب' }, { status: 500 });
  }
}

// PUT /api/printing/[id] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // If setting as default, unset other defaults of same type
    if (data.isDefault) {
      const currentTemplate = await db.receiptTemplate.findUnique({
        where: { id },
        select: { type: true },
      });
      
      if (currentTemplate) {
        await db.receiptTemplate.updateMany({
          where: { 
            type: currentTemplate.type,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }
    }
    
    const template = await db.receiptTemplate.update({
      where: { id },
      data: {
        name: data.name,
        nameAr: data.nameAr,
        paperWidth: data.paperWidth,
        paperType: data.paperType,
        fontFamily: data.fontFamily,
        fontSizeSmall: data.fontSizeSmall,
        fontSizeNormal: data.fontSizeNormal,
        fontSizeLarge: data.fontSizeLarge,
        fontSizeTitle: data.fontSizeTitle,
        fontSizeTotal: data.fontSizeTotal,
        fontBold: data.fontBold,
        showLogo: data.showLogo,
        logoAlignment: data.logoAlignment,
        showCompanyName: data.showCompanyName,
        companyNameStyle: data.companyNameStyle,
        showBranchName: data.showBranchName,
        showBranchAddress: data.showBranchAddress,
        showBranchPhone: data.showBranchPhone,
        showTaxNumber: data.showTaxNumber,
        headerAlignment: data.headerAlignment,
        showSku: data.showSku,
        showProductName: data.showProductName,
        showVariant: data.showVariant,
        showQuantity: data.showQuantity,
        showUnitPrice: data.showUnitPrice,
        showDiscount: data.showDiscount,
        showTax: data.showTax,
        showLineTotal: data.showLineTotal,
        showBarcode: data.showBarcode,
        showSubtotal: data.showSubtotal,
        showDiscountTotal: data.showDiscountTotal,
        showTaxTotal: data.showTaxTotal,
        showTotal: data.showTotal,
        showPaid: data.showPaid,
        showChange: data.showChange,
        totalsAlignment: data.totalsAlignment,
        showThankYou: data.showThankYou,
        thankYouMessage: data.thankYouMessage,
        showReturnPolicy: data.showReturnPolicy,
        returnPolicyText: data.returnPolicyText,
        showQRCode: data.showQRCode,
        showInvoiceBarcode: data.showInvoiceBarcode,
        showDateTime: data.showDateTime,
        showCashier: data.showCashier,
        showInvoiceNumber: data.showInvoiceNumber,
        showSeparator: data.showSeparator,
        separatorChar: data.separatorChar,
        marginTop: data.marginTop,
        marginBottom: data.marginBottom,
        lineSpacing: data.lineSpacing,
        isDefault: data.isDefault,
        isActive: data.isActive,
      },
    });
    
    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'خطأ في تحديث القالب' }, { status: 500 });
  }
}

// DELETE /api/printing/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Soft delete by setting isActive to false
    const template = await db.receiptTemplate.update({
      where: { id },
      data: { isActive: false },
    });
    
    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'خطأ في حذف القالب' }, { status: 500 });
  }
}
