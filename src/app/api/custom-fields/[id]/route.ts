import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch a single custom field
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customField = await db.customField.findUnique({
      where: { id },
      include: {
        values: {
          take: 10,
        },
      },
    });

    if (!customField) {
      return NextResponse.json({ error: 'Custom field not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...customField,
      options: customField.options ? JSON.parse(customField.options) : null,
    });
  } catch (error) {
    console.error('Error fetching custom field:', error);
    return NextResponse.json({ error: 'Failed to fetch custom field' }, { status: 500 });
  }
}

// PUT - Update a custom field
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, nameAr, type, options, module, isRequired, isActive, sortOrder, isVisible } = body;

    const existingField = await db.customField.findUnique({
      where: { id },
    });

    if (!existingField) {
      return NextResponse.json({ error: 'Custom field not found' }, { status: 404 });
    }

    const customField = await db.customField.update({
      where: { id },
      data: {
        name: name ?? existingField.name,
        nameAr: nameAr ?? existingField.nameAr,
        type: type ?? existingField.type,
        options: options ? JSON.stringify(options) : existingField.options,
        module: module ?? existingField.module,
        isRequired: isRequired ?? existingField.isRequired,
        isActive: isActive ?? existingField.isActive,
        sortOrder: sortOrder ?? existingField.sortOrder,
      },
    });

    return NextResponse.json({
      ...customField,
      options: customField.options ? JSON.parse(customField.options) : null,
      isVisible: isVisible ?? true,
    });
  } catch (error) {
    console.error('Error updating custom field:', error);
    return NextResponse.json({ error: 'Failed to update custom field' }, { status: 500 });
  }
}

// DELETE - Delete a custom field
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete all field values first (cascade)
    await db.customFieldValue.deleteMany({
      where: { fieldId: id },
    });

    await db.customField.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom field:', error);
    return NextResponse.json({ error: 'Failed to delete custom field' }, { status: 500 });
  }
}
