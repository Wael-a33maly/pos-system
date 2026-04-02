import { NextRequest, NextResponse } from 'next/server';
import { getZReport } from '@/lib/reports';

// ==================== API تقرير Z ====================
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shiftId = searchParams.get('shiftId');

    if (!shiftId) {
      return NextResponse.json({ 
        success: false,
        error: 'معرف الوردية مطلوب' 
      }, { status: 400 });
    }

    const report = await getZReport(shiftId);

    if (!report.success) {
      return NextResponse.json(report, { status: 404 });
    }

    return NextResponse.json(report);

  } catch (error) {
    console.error('Z-Report error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'حدث خطأ أثناء توليد التقرير',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
