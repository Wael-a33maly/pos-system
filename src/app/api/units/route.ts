import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all units
export async function GET() {
  try {
    let units = await db.unit.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // If no units exist, create default ones
    if (units.length === 0) {
      const defaultUnits = [
        { name: 'Piece', nameAr: 'قطعة', symbol: 'pcs', isActive: true },
        { name: 'Kilogram', nameAr: 'كيلوغرام', symbol: 'kg', isActive: true },
        { name: 'Gram', nameAr: 'غرام', symbol: 'g', isActive: true },
        { name: 'Meter', nameAr: 'متر', symbol: 'm', isActive: true },
        { name: 'Liter', nameAr: 'لتر', symbol: 'L', isActive: true },
        { name: 'Box', nameAr: 'علبة', symbol: 'box', isActive: true },
        { name: 'Pack', nameAr: 'باكيت', symbol: 'pack', isActive: true },
        { name: 'Carton', nameAr: 'كرتون', symbol: 'ctn', isActive: true },
      ];

      await db.unit.createMany({
        data: defaultUnits,
      });

      units = await db.unit.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 });
  }
}

// POST - Create a new unit
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, nameAr, symbol, isActive } = body;

    if (!name || !symbol) {
      return NextResponse.json({ error: 'Name and symbol are required' }, { status: 400 });
    }

    // Check if symbol already exists
    const existingUnit = await db.unit.findUnique({
      where: { symbol },
    });

    if (existingUnit) {
      return NextResponse.json({ error: 'Unit symbol already exists' }, { status: 400 });
    }

    const unit = await db.unit.create({
      data: {
        name,
        nameAr: nameAr || name,
        symbol,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(unit, { status: 201 });
  } catch (error) {
    console.error('Error creating unit:', error);
    return NextResponse.json({ error: 'Failed to create unit' }, { status: 500 });
  }
}
