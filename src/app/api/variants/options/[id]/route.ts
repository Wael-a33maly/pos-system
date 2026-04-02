import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch a single variant option
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const option = await db.variantOption.findUnique({
      where: { id },
      include: {
        prices: true,
        variantType: true,
      },
    });

    if (!option) {
      return NextResponse.json({ error: 'Variant option not found' }, { status: 404 });
    }

    return NextResponse.json(option);
  } catch (error) {
    console.error('Error fetching variant option:', error);
    return NextResponse.json({ error: 'Failed to fetch variant option' }, { status: 500 });
  }
}

// PUT - Update a variant option with prices
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, nameAr, prices } = body;

    const existingOption = await db.variantOption.findUnique({
      where: { id },
      include: { prices: true },
    });

    if (!existingOption) {
      return NextResponse.json({ error: 'Variant option not found' }, { status: 404 });
    }

    // Delete existing prices and create new ones
    await db.$transaction(async (tx) => {
      // Delete existing prices
      await tx.variantPrice.deleteMany({
        where: { optionId: id },
      });

      // Update option and create new prices
      await tx.variantOption.update({
        where: { id },
        data: {
          name: name ?? existingOption.name,
          nameAr: nameAr ?? existingOption.nameAr,
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
    });

    // Fetch the updated option
    const updatedOption = await db.variantOption.findUnique({
      where: { id },
      include: {
        prices: true,
      },
    });

    return NextResponse.json(updatedOption);
  } catch (error) {
    console.error('Error updating variant option:', error);
    return NextResponse.json({ error: 'Failed to update variant option' }, { status: 500 });
  }
}

// DELETE - Delete a variant option
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Prices will be deleted automatically due to cascade
    await db.variantOption.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting variant option:', error);
    return NextResponse.json({ error: 'Failed to delete variant option' }, { status: 500 });
  }
}
