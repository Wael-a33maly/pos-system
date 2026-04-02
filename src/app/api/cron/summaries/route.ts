// ==================== API لتشغيل ملخصات المبيعات ====================

import { NextRequest, NextResponse } from 'next/server';
import {
  generateHourlySummary,
  generateDailySummary,
  archiveOldData,
  calculatePerformanceMetrics,
  cleanupDuplicateSummaries,
} from '@/services/cron/sales-summary';

// ==================== GET: حالة الملخصات ====================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const type = searchParams.get('type') || 'all';

    const results: Record<string, unknown> = {};

    // جلب الملخصات المتاحة
    if (type === 'hourly' || type === 'all') {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      results.hourlySummaries = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/cron/summaries/hourly?branchId=${branchId}&date=${startOfDay.toISOString()}`).then(r => r.json()).catch(() => null);
    }

    if (type === 'daily' || type === 'all') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      results.dailySummaries = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/cron/summaries/daily?branchId=${branchId}&from=${sevenDaysAgo.toISOString()}`).then(r => r.json()).catch(() => null);
    }

    if (type === 'performance' || type === 'all') {
      const performance = await calculatePerformanceMetrics(branchId || undefined);
      results.performance = performance.data;
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching summaries status:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب حالة الملخصات' },
      { status: 500 }
    );
  }
}

// ==================== POST: تشغيل يدوي للملخصات ====================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, date, branchId, daysOld } = body;

    let result;

    switch (action) {
      case 'hourly':
        result = await generateHourlySummary();
        return NextResponse.json({
          success: true,
          message: 'تم تشغيل ملخص الساعة',
          data: result,
        });

      case 'daily':
        const targetDate = date ? new Date(date) : undefined;
        result = await generateDailySummary(targetDate);
        return NextResponse.json({
          success: true,
          message: 'تم تشغيل الملخص اليومي',
          data: result,
        });

      case 'archive':
        const days = daysOld || 90;
        result = await archiveOldData(days);
        return NextResponse.json({
          success: result.success,
          message: result.message,
          data: { archivedCount: result.archivedCount },
        });

      case 'cleanup':
        result = await cleanupDuplicateSummaries();
        return NextResponse.json({
          success: result.success,
          message: result.message,
        });

      case 'performance':
        result = await calculatePerformanceMetrics(branchId);
        return NextResponse.json({
          success: result.success,
          data: result.data,
        });

      case 'all':
        // تشغيل جميع المهام
        const hourlyResults = await generateHourlySummary();
        const dailyResults = await generateDailySummary();
        
        return NextResponse.json({
          success: true,
          message: 'تم تشغيل جميع الملخصات',
          data: {
            hourly: hourlyResults,
            daily: dailyResults,
          },
        });

      default:
        return NextResponse.json(
          { success: false, error: 'إجراء غير معروف' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error running summary task:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تشغيل المهمة' },
      { status: 500 }
    );
  }
}
