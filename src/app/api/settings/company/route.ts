import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// جلب إعدادات الشركة
export async function GET() {
  try {
    const settings = await db.setting.findMany({
      where: {
        key: {
          in: ['company_name_ar', 'company_name_en', 'company_phone', 'company_email', 'company_address', 'company_tax_number', 'company_logo']
        }
      }
    });

    const result: Record<string, string> = {};
    settings.forEach(s => {
      result[s.key.replace('company_', '')] = s.value;
    });

    return NextResponse.json({ settings: result });
  } catch (error) {
    console.error('Failed to fetch company settings:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// حفظ إعدادات الشركة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const settingsMap: Record<string, string> = {
      company_name_ar: body.nameAr || '',
      company_name_en: body.nameEn || '',
      company_phone: body.phone || '',
      company_email: body.email || '',
      company_address: body.address || '',
      company_tax_number: body.taxNumber || '',
      company_logo: body.logo || '',
    };

    // حفظ كل إعداد
    for (const [key, value] of Object.entries(settingsMap)) {
      await db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save company settings:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
