import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST() {
  try {
    // Check if demo user exists, if not create one
    let demoUser = await db.user.findUnique({
      where: { email: 'demo@pos.com' },
      include: { branch: true, permissions: true },
    });

    if (!demoUser) {
      // Create demo user
      demoUser = await db.user.create({
        data: {
          email: 'demo@pos.com',
          password: hashPassword('demo123'),
          name: 'مستخدم تجريبي',
          role: 'SUPER_ADMIN',
          isActive: true,
        },
        include: { branch: true, permissions: true },
      });
    }

    // Ensure user is active
    if (!demoUser.isActive) {
      await db.user.update({
        where: { id: demoUser.id },
        data: { isActive: true },
      });
    }

    const token = generateToken();
    const { password: _, ...userWithoutPassword } = demoUser;

    const response = NextResponse.json({ user: userWithoutPassword, token });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الدخول التجريبي' },
      { status: 500 }
    );
  }
}
