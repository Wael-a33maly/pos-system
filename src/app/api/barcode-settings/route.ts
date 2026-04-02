import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const settings = await db.barcodeSetting.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // If setting as default, remove default from others
    if (body.isDefault) {
      await db.barcodeSetting.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const setting = await db.barcodeSetting.create({
      data: {
        name: body.name,
        paperWidth: body.paperWidth || 80,
        paperHeight: body.paperHeight || 50,
        labelWidth: body.labelWidth || 70,
        labelHeight: body.labelHeight || 40,
        columns: body.columns || 3,
        rows: body.rows || 8,
        showProductName: body.showProductName ?? true,
        showPrice: body.showPrice ?? true,
        showBarcode: body.showBarcode ?? true,
        showSku: body.showSku ?? false,
        fontSize: body.fontSize || 10,
        barcodeHeight: body.barcodeHeight || 20,
        isActive: body.isActive ?? true,
        isDefault: body.isDefault ?? false,
      },
    });
    return NextResponse.json({ setting }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
