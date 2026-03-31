import { db } from '@/lib/db';
import type { User } from '@/types';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Simple password hashing (in production, use bcrypt)
export function hashPassword(password: string): string {
  // In production, use bcrypt or similar
  return Buffer.from(password).toString('base64');
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

// Generate session token
export function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Get current user from cookie
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) return null;
    
    // For now, return mock user - in production, verify token from database
    const user = await db.user.findFirst({
      where: { email: 'admin@pos.com' },
      include: {
        branch: true,
        permissions: true,
      },
    });
    
    return user as User | null;
  } catch {
    return null;
  }
}

// Check if user has permission
export function hasPermission(
  user: User,
  module: string,
  action: string
): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  
  const permission = user.permissions?.find(
    (p) => p.module === module && p.action === action
  );
  
  return permission?.allowed ?? false;
}

// Middleware-like function to require auth
export async function requireAuth(request?: NextRequest): Promise<User | null> {
  return getCurrentUser();
}

// Create default admin user
export async function createDefaultAdmin() {
  try {
    const existingAdmin = await db.user.findUnique({
      where: { email: 'admin@pos.com' },
    });
    
    if (!existingAdmin) {
      await db.user.create({
        data: {
          email: 'admin@pos.com',
          password: hashPassword('admin123'),
          name: 'مدير النظام',
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      });
      
      console.log('Default admin user created');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
}

// Create default data
export async function seedDatabase() {
  try {
    // Create default branch
    const branchCount = await db.branch.count();
    if (branchCount === 0) {
      await db.branch.create({
        data: {
          name: 'الفرع الرئيسي',
          nameAr: 'الفرع الرئيسي',
          address: 'الرياض، المملكة العربية السعودية',
          phone: '920000000',
          isActive: true,
        },
      });
    }
    
    // Create default payment methods
    const paymentMethodsCount = await db.paymentMethod.count();
    if (paymentMethodsCount === 0) {
      await db.paymentMethod.createMany({
        data: [
          { name: 'Cash', nameAr: 'نقداً', code: 'CASH', isActive: true },
          { name: 'Card', nameAr: 'بطاقة', code: 'CARD', isActive: true },
          { name: 'KNET', nameAr: 'كي نت', code: 'KNET', isActive: true },
          { name: 'Multi', nameAr: 'متعدد', code: 'MULTI', isActive: true },
        ],
      });
    }
    
    // Create default currency
    const currencyCount = await db.currency.count();
    if (currencyCount === 0) {
      await db.currency.create({
        data: {
          name: 'Saudi Riyal',
          nameAr: 'ريال سعودي',
          code: 'SAR',
          symbol: 'ر.س',
          decimalPlaces: 2,
          isDefault: true,
          isActive: true,
        },
      });
    }
    
    // Create default expense categories
    const expenseCategoriesCount = await db.expenseCategory.count();
    if (expenseCategoriesCount === 0) {
      await db.expenseCategory.createMany({
        data: [
          { name: 'رواتب', nameAr: 'رواتب', isActive: true },
          { name: 'إيجار', nameAr: 'إيجار', isActive: true },
          { name: 'كهرباء', nameAr: 'كهرباء', isActive: true },
          { name: 'ماء', nameAr: 'ماء', isActive: true },
          { name: 'صيانة', nameAr: 'صيانة', isActive: true },
          { name: 'أخرى', nameAr: 'أخرى', isActive: true },
        ],
      });
    }
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
