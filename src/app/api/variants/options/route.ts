import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Create a new variant option with prices
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { variantTypeId, name, nameAr, prices } = body;

    if (!variantTypeId || !name) {
      return NextResponse.json({ error: 'Variant type ID and name are required' }, { status: 400 });
    }

    // Get the max sort order for this variant type
    const maxSortOrder = await db.variantOption.aggregate({
      where: { variantTypeId },
      _max: { sortOrder: true },
    });

    const option = await db.variantOption.create({
      data: {
        variantTypeId,
        name,
        nameAr: nameAr || name,
        sortOrder: (maxSortOrder._max.sortOrder || -1) + 1,
        prices: prices
          ? {
              create: prices.map((p: { name: string; nameAr: string; costPrice: number; sellingPrice: number; barcode: string }) => ({
                name: p.name,
                nameAr: p.nameAr || p.name,
                costPrice: p.costPrice || 0,
                sellingPrice: p.sellingPrice || 0,
                barcode: p.barcode || null,
              })),
            }
          : undefined,
      },
      include: {
        prices: true,
      },
    });

    return NextResponse.json(option, { status: 201 });
  } catch (error) {
    console.error('Error creating variant option:', error);
    return NextResponse.json({ error: 'Failed to create variant option' }, { status: 500 });
  }
}
