import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get single variant template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const template = await db.variantTemplate.findUnique({
      where: { id },
      include: {
        values: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching variant template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variant template' },
      { status: 500 }
    );
  }
}

// PUT - Update variant template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, nameAr, isActive, values } = body;

    // Update template
    const template = await db.variantTemplate.update({
      where: { id },
      data: {
        name,
        nameAr,
        isActive
      },
      include: {
        values: true
      }
    });

    // If values provided, update them
    if (values) {
      // Delete existing values
      await db.variantTemplateValue.deleteMany({
        where: { templateId: id }
      });

      // Create new values
      if (values.length > 0) {
        await db.variantTemplateValue.createMany({
          data: values.map((v: any, index: number) => ({
            templateId: id,
            value: v.value,
            valueAr: v.valueAr,
            code: v.code,
            sortOrder: index,
            isActive: true
          }))
        });
      }

      // Fetch updated template with new values
      const updatedTemplate = await db.variantTemplate.findUnique({
        where: { id },
        include: {
          values: {
            orderBy: { sortOrder: 'asc' }
          }
        }
      });
      
      return NextResponse.json({ template: updatedTemplate });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error updating variant template:', error);
    return NextResponse.json(
      { error: 'Failed to update variant template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete variant template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete by setting isActive to false
    await db.variantTemplate.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting variant template:', error);
    return NextResponse.json(
      { error: 'Failed to delete variant template' },
      { status: 500 }
    );
  }
}
