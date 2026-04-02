import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch a single unit
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const unit = await db.unit.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    return NextResponse.json(unit);
  } catch (error) {
    console.error('Error fetching unit:', error);
    return NextResponse.json({ error: 'Failed to fetch unit' }, { status: 500 });
  }
}

// PUT - Update a unit
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, nameAr, symbol, isActive } = body;

    const existingUnit = await db.unit.findUnique({
      where: { id },
    });

    if (!existingUnit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    // Check if symbol is taken by another unit
    if (symbol && symbol !== existingUnit.symbol) {
      const symbolTaken = await db.unit.findUnique({
        where: { symbol },
      });
      if (symbolTaken) {
        return NextResponse.json({ error: 'Unit symbol already exists' }, { status: 400 });
      }
    }

    const unit = await db.unit.update({
      where: { id },
      data: {
        name: name ?? existingUnit.name,
        nameAr: nameAr ?? existingUnit.nameAr,
        symbol: symbol ?? existingUnit.symbol,
        isActive: isActive ?? existingUnit.isActive,
      },
    });

    return NextResponse.json(unit);
  } catch (error) {
    console.error('Error updating unit:', error);
    return NextResponse.json({ error: 'Failed to update unit' }, { status: 500 });
  }
}

// DELETE - Delete a unit
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if unit is used by any products
    const productUnits = await db.productUnit.count({
      where: { unitId: id },
    });

    if (productUnits > 0) {
      return NextResponse.json(
        { error: 'Cannot delete unit. It is being used by products.' },
        { status: 400 }
      );
    }

    await db.unit.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting unit:', error);
    return NextResponse.json({ error: 'Failed to delete unit' }, { status: 500 });
  }
}
