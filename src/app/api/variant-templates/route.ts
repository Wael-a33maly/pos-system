import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all variant templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const withValues = searchParams.get('withValues') === 'true';

    const templates = await db.variantTemplate.findMany({
      where: { isActive: true },
      include: withValues ? {
        values: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      } : undefined,
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching variant templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variant templates' },
      { status: 500 }
    );
  }
}

// POST - Create new variant template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nameAr, values } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      );
    }

    // Create template with values in a transaction
    const template = await db.variantTemplate.create({
      data: {
        name,
        nameAr,
        values: values && values.length > 0 ? {
          create: values.map((v: any, index: number) => ({
            value: v.value,
            valueAr: v.valueAr,
            code: v.code,
            sortOrder: index,
            isActive: true
          }))
        } : undefined
      },
      include: {
        values: true
      }
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating variant template:', error);
    return NextResponse.json(
      { error: 'Failed to create variant template' },
      { status: 500 }
    );
  }
}
