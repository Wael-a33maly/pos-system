import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const shifts = await db.shift.findMany({
      where,
      include: { user: true, branch: true, closedByUser: true },
      orderBy: { startTime: 'desc' },
    });

    return NextResponse.json({ shifts });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Creating shift with data:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.branchId) {
      return NextResponse.json({ error: 'معرف الفرع مطلوب' }, { status: 400 });
    }
    if (!body.userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }
    
    // Check if branch exists
    const branch = await db.branch.findUnique({
      where: { id: body.branchId },
    });
    
    console.log('Branch check:', body.branchId, branch ? 'found' : 'not found');
    
    if (!branch) {
      return NextResponse.json({ error: 'الفرع غير موجود', branchId: body.branchId }, { status: 400 });
    }
    
    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: body.userId },
    });
    
    console.log('User check:', body.userId, user ? 'found' : 'not found');
    
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود', userId: body.userId }, { status: 400 });
    }
    
    // Check for open shift
    const openShift = await db.shift.findFirst({
      where: { userId: body.userId, status: 'OPEN' },
    });
    
    if (openShift) {
      return NextResponse.json({ error: 'يوجد وردية مفتوحة بالفعل', shift: openShift }, { status: 400 });
    }

    // Create shift without include first
    const shift = await db.shift.create({
      data: {
        branchId: body.branchId,
        userId: body.userId,
        openingCash: body.openingCash || 0,
        status: 'OPEN',
      },
    });

    // Then fetch with relations
    const shiftWithRelations = await db.shift.findUnique({
      where: { id: shift.id },
      include: { user: true, branch: true },
    });

    console.log('Shift created successfully:', shift.id);
    return NextResponse.json({ shift: shiftWithRelations }, { status: 201 });
  } catch (error) {
    console.error('Error creating shift:', error);
    return NextResponse.json({ error: 'حدث خطأ في إنشاء الوردية', details: String(error) }, { status: 500 });
  }
}
