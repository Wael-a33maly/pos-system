import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all custom fields
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleFilter = searchParams.get('module');

    const where = moduleFilter ? { module: moduleFilter } : {};

    const customFields = await db.customField.findMany({
      where,
      orderBy: [{ module: 'asc' }, { sortOrder: 'asc' }],
      include: {
        _count: {
          select: { values: true },
        },
      },
    });

    return NextResponse.json(
      customFields.map((field) => ({
        ...field,
        valuesCount: field._count.values,
      }))
    );
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    return NextResponse.json({ error: 'Failed to fetch custom fields' }, { status: 500 });
  }
}

// POST - Create a new custom field
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, nameAr, type, options, module: moduleName, isRequired, isActive, sortOrder } = body;

    if (!name || !type || !moduleName) {
      return NextResponse.json({ error: 'Name, type, and module are required' }, { status: 400 });
    }

    // Get the max sort order for this module
    const maxSortOrder = await db.customField.findFirst({
      where: { module: moduleName },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const customField = await db.customField.create({
      data: {
        name,
        nameAr: nameAr || name,
        type,
        options: options ? JSON.stringify(options) : null,
        module: moduleName,
        isRequired: isRequired ?? false,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? (maxSortOrder?.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json(customField, { status: 201 });
  } catch (error) {
    console.error('Error creating custom field:', error);
    return NextResponse.json({ error: 'Failed to create custom field' }, { status: 500 });
  }
}
