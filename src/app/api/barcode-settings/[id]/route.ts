import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const setting = await db.barcodeSetting.findUnique({ where: { id } });
    if (!setting) return NextResponse.json({ error: 'الإعداد غير موجود' }, { status: 404 });
    return NextResponse.json({ setting });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // If setting as default, remove default from others
    if (body.isDefault) {
      await db.barcodeSetting.updateMany({
        where: { isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const setting = await db.barcodeSetting.update({
      where: { id },
      data: {
        name: body.name,
        paperWidth: body.paperWidth,
        paperHeight: body.paperHeight,
        labelWidth: body.labelWidth,
        labelHeight: body.labelHeight,
        columns: body.columns,
        rows: body.rows,
        showProductName: body.showProductName,
        showPrice: body.showPrice,
        showBarcode: body.showBarcode,
        showSku: body.showSku,
        fontSize: body.fontSize,
        barcodeHeight: body.barcodeHeight,
        isActive: body.isActive,
        isDefault: body.isDefault,
      },
    });
    return NextResponse.json({ setting });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.barcodeSetting.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
