import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch a single variant type
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const variantType = await db.variantType.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' },
          include: {
            prices: true,
          },
        },
      },
    });

    if (!variantType) {
      return NextResponse.json({ error: 'Variant type not found' }, { status: 404 });
    }

    return NextResponse.json(variantType);
  } catch (error) {
    console.error('Error fetching variant type:', error);
    return NextResponse.json({ error: 'Failed to fetch variant type' }, { status: 500 });
  }
}

// PUT - Update a variant type
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, nameAr, isActive, sortOrder } = body;

    const existingType = await db.variantType.findUnique({
      where: { id },
    });

    if (!existingType) {
      return NextResponse.json({ error: 'Variant type not found' }, { status: 404 });
    }

    const variantType = await db.variantType.update({
      where: { id },
      data: {
        name: name ?? existingType.name,
        nameAr: nameAr ?? existingType.nameAr,
        isActive: isActive ?? existingType.isActive,
        sortOrder: sortOrder ?? existingType.sortOrder,
      },
      include: {
        options: {
          include: {
            prices: true,
          },
        },
      },
    });

    return NextResponse.json(variantType);
  } catch (error) {
    console.error('Error updating variant type:', error);
    return NextResponse.json({ error: 'Failed to update variant type' }, { status: 500 });
  }
}

// DELETE - Delete a variant type
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete all options and prices first (cascade)
    await db.variantType.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting variant type:', error);
    return NextResponse.json({ error: 'Failed to delete variant type' }, { status: 500 });
  }
}
