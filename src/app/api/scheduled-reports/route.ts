import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب التقارير المجدولة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'executions') {
      const executions = await db.reportExecution.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      return NextResponse.json({ executions });
    }
    
    const reports = await db.scheduledReport.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Get scheduled reports error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// POST - إنشاء تقرير مجدول
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const report = await db.scheduledReport.create({
      data: {
        name: body.name,
        nameAr: body.nameAr,
        description: body.description,
        reportType: body.reportType,
        scheduleType: body.scheduleType,
        time: body.time,
        dayOfWeek: body.dayOfWeek,
        dayOfMonth: body.dayOfMonth,
        filters: body.filters ? JSON.stringify(body.filters) : null,
        format: body.format || 'PDF',
        recipients: body.recipients,
        isActive: body.isActive ?? true,
        createdById: body.createdById
      }
    });
    
    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error('Create scheduled report error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// PUT - تحديث تقرير مجدول
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const report = await db.scheduledReport.update({
      where: { id: body.id },
      data: {
        name: body.name,
        nameAr: body.nameAr,
        description: body.description,
        reportType: body.reportType,
        scheduleType: body.scheduleType,
        time: body.time,
        dayOfWeek: body.dayOfWeek,
        dayOfMonth: body.dayOfMonth,
        filters: body.filters ? JSON.stringify(body.filters) : null,
        format: body.format,
        recipients: body.recipients,
        isActive: body.isActive
      }
    });
    
    return NextResponse.json({ report });
  } catch (error) {
    console.error('Update scheduled report error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// DELETE - حذف تقرير مجدول
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'معرف التقرير مطلوب' }, { status: 400 });
    }
    
    await db.scheduledReport.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete scheduled report error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
