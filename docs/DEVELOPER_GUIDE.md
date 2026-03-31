# 🔧 دليل المطور - نظام نقاط البيع POS

<div align="center">

![Developer Guide](https://img.shields.io/badge/دليل-المطور-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)

**دليل شامل للمطورين والمساهمين**

</div>

---

## 📑 فهرس المحتويات

1. [هيكل المشروع](#1-هيكل-المشروع)
2. [البنية المعيارية](#2-البنية-المعيارية)
3. [إضافة وحدة جديدة](#3-إضافة-وحدة-جديدة)
4. [إضافة API جديد](#4-إضافة-api-جديد)
5. [قاعدة البيانات](#5-قاعدة-البيانات)
6. [إدارة الحالة](#6-إدارة-الحالة)
7. [الاختبارات](#7-الاختبارات)
8. [معايير الكود](#8-معايير-الكود)

---

## 1. هيكل المشروع 📁

### الهيكل العام

```
pos-system/
├── 📁 src/                      # الكود المصدري
│   ├── 📁 app/                  # Next.js App Router
│   │   ├── 📁 api/              # API Routes
│   │   ├── 📁 login/            # صفحة الدخول
│   │   ├── layout.tsx           # التخطيط الرئيسي
│   │   ├── page.tsx             # الصفحة الرئيسية
│   │   └── globals.css          # الأنماط العامة
│   │
│   ├── 📁 components/           # المكونات المشتركة
│   │   ├── 📁 ui/               # مكونات shadcn/ui
│   │   ├── 📁 layout/           # مكونات التخطيط
│   │   └── 📁 ...               # مكونات أخرى
│   │
│   ├── 📁 modules/              # الوحدات المعيارية
│   │   ├── 📁 auth/             # وحدة المصادقة
│   │   ├── 📁 pos/              # وحدة نقطة البيع
│   │   ├── 📁 products/         # وحدة المنتجات
│   │   └── 📁 ...               # وحدات أخرى
│   │
│   ├── 📁 hooks/                # Custom Hooks
│   ├── 📁 lib/                  # المكتبات المساعدة
│   ├── 📁 store/                # إدارة الحالة (Zustand)
│   ├── 📁 types/                # TypeScript Types
│   ├── 📁 constants/            # الثوابت
│   └── 📁 shared/               # الكود المشترك
│
├── 📁 prisma/                   # Prisma ORM
│   ├── schema.prisma            # مخطط قاعدة البيانات
│   └── seed.ts                  # البيانات الأولية
│
├── 📁 public/                   # الملفات الثابتة
├── 📁 __tests__/                # الاختبارات
├── 📁 docs/                     # التوثيق
└── 📁 ...                       # ملفات التكوين
```

### ملفات التكوين

| الملف | الوصف |
|-------|-------|
| `package.json` | التبعيات والسكربتات |
| `tsconfig.json` | إعدادات TypeScript |
| `next.config.ts` | إعدادات Next.js |
| `tailwind.config.ts` | إعدادات Tailwind CSS |
| `jest.config.js` | إعدادات الاختبارات |
| `prisma/schema.prisma` | مخطط قاعدة البيانات |

---

## 2. البنية المعيارية 🧩

### فلسفة التصميم

نستخدم **Modular Architecture** لتنظيم الكود:

```
✅ كل وحدة مستقلة وقابلة للصيانة
✅ فصل واضح بين المسؤوليات
✅ إعادة استخدام المكونات
✅ سهولة الاختبار
```

### هيكل الوحدة النموذجية

```
src/modules/[module-name]/
├── 📁 components/           # مكونات الوحدة
│   ├── index.ts            # تصدير المكونات
│   ├── [Module]Page.tsx    # الصفحة الرئيسية
│   └── 📁 sub-components/   # مكونات فرعية
│
├── 📁 hooks/               # Hooks خاصة بالوحدة
│   ├── index.ts
│   └── use[Module].ts
│
├── 📁 types/               # أنواع TypeScript
│   ├── index.ts
│   └── [module].types.ts
│
└── index.ts                # تصدير الوحدة
```

### مثال: وحدة المنتجات

```
src/modules/products/
├── components/
│   ├── index.ts
│   ├── ProductsPage.tsx      # الصفحة الرئيسية
│   ├── CategoriesPage.tsx    # صفحة التصنيفات
│   ├── BrandsPage.tsx        # صفحة البراندات
│   ├── BarcodePrintPage.tsx  # طباعة الباركود
│   ├── ImportProductsPage.tsx# استيراد المنتجات
│   ├── StatsCard.tsx         # بطاقة الإحصائيات
│   └── ProductSkeleton.tsx   # هيكل التحميل
│
├── hooks/
│   ├── index.ts
│   └── useProducts.ts        # Hook للمنتجات
│
├── types/
│   ├── index.ts
│   └── products.types.ts     # أنواع المنتجات
│
└── index.ts                  # التصدير الرئيسي
```

---

## 3. إضافة وحدة جديدة 🆕

### الخطوة 1: إنشاء هيكل الوحدة

```bash
# إنشاء مجلد الوحدة
mkdir -p src/modules/my-module/{components,hooks,types}
```

### الخطوة 2: تعريف الأنواع

```typescript
// src/modules/my-module/types/my-module.types.ts

export interface MyItem {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MyModuleFilters {
  search?: string;
  status?: string;
}

export interface MyModuleStats {
  total: number;
  active: number;
  inactive: number;
}
```

```typescript
// src/modules/my-module/types/index.ts
export * from './my-module.types';
```

### الخطوة 3: إنشاء Hook

```typescript
// src/modules/my-module/hooks/useMyModule.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import type { MyItem, MyModuleFilters } from '../types';

export function useMyModule(filters?: MyModuleFilters) {
  const api = useApi();

  // جلب البيانات
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-module', filters],
    queryFn: () => api.get('/api/my-module', { params: filters }),
  });

  // إنشاء عنصر جديد
  const createMutation = useMutation({
    mutationFn: (item: Partial<MyItem>) => 
      api.post('/api/my-module', item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-module'] });
    },
  });

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    createItem: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
```

```typescript
// src/modules/my-module/hooks/index.ts
export * from './useMyModule';
```

### الخطوة 4: إنشاء الصفحة

```typescript
// src/modules/my-module/components/MyModulePage.tsx
'use client';

import { motion } from 'framer-motion';
import { useMyModule } from '../hooks';
import { StatsCard } from './StatsCard';
import { MyModuleTable } from './MyModuleTable';
import { MyModuleSkeleton } from './MyModuleSkeleton';

export function MyModulePage() {
  const { items, total, isLoading, error } = useMyModule();

  if (isLoading) return <MyModuleSkeleton />;
  if (error) return <div>خطأ في تحميل البيانات</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold">إدارة الوحدة</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="الإجمالي" value={total} />
      </div>

      <MyModuleTable items={items} />
    </motion.div>
  );
}
```

```typescript
// src/modules/my-module/components/index.ts
export * from './MyModulePage';
export * from './StatsCard';
export * from './MyModuleTable';
export * from './MyModuleSkeleton';
```

### الخطوة 5: تصدير الوحدة

```typescript
// src/modules/my-module/index.ts
export * from './components';
export * from './hooks';
export * from './types';
```

### الخطوة 6: استخدام الوحدة

```typescript
// src/app/page.tsx
import dynamic from 'next/dynamic';

const MyModulePage = dynamic(
  () => import('@/modules/my-module').then(m => ({ default: m.MyModulePage })),
  { 
    loading: () => <MyModuleSkeleton />,
    ssr: false 
  }
);

// في التطبيق
case 'my-module':
  return <MyModulePage />;
```

---

## 4. إضافة API جديد 🌐

### هيكل API Routes

```
src/app/api/
├── [resource]/
│   ├── route.ts          # GET, POST
│   └── [id]/
│       └── route.ts      # GET, PUT, DELETE
```

### إنشاء API جديد

#### القائمة (GET) والإنشاء (POST)

```typescript
// src/app/api/my-module/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// جلب القائمة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (search) {
      where.name = { contains: search };
    }

    const [items, total] = await Promise.all([
      db.myModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.myModel.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, limit });
  } catch (error) {
    console.error('Get error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    );
  }
}

// إنشاء عنصر جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const item = await db.myModel.create({
      data: {
        name: body.name,
        // ... الحقول الأخرى
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    console.error('Create error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'العنصر موجود بالفعل' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'حدث خطأ أثناء الإنشاء' },
      { status: 500 }
    );
  }
}
```

#### التفاصيل (GET) والتحديث (PUT) والحذف (DELETE)

```typescript
// src/app/api/my-module/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// جلب عنصر واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const item = await db.myModel.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'العنصر غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}

// تحديث عنصر
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const item = await db.myModel.update({
      where: { id },
      data: {
        name: body.name,
        // ... الحقول الأخرى
      },
    });

    return NextResponse.json({ item });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'العنصر غير موجود' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحديث' },
      { status: 500 }
    );
  }
}

// حذف عنصر
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.myModel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'العنصر غير موجود' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'حدث خطأ أثناء الحذف' },
      { status: 500 }
    );
  }
}
```

### معالجة الأخطاء الشائعة

| الخطأ | الكود | الوصف |
|-------|-------|-------|
| P2002 | Unique Constraint | انتهاك قيد الفريدة |
| P2025 | Record Not Found | السجل غير موجود |
| P2003 | Foreign Key | انتهاك المفتاح الأجنبي |
| P2014 | Relation Violation | انتهاك العلاقة |

---

## 5. قاعدة البيانات 🗄️

### Prisma Schema

```prisma
// prisma/schema.prisma

model Example {
  id          String   @id @default(cuid())
  name        String
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // العلاقات
  branchId    String?
  branch      Branch?  @relation(fields: [branchId], references: [id])

  // الفهارس
  @@index([name])
  @@index([isActive])
}
```

### أوامر Prisma

```bash
# إنشاء قاعدة البيانات
bun run db:push

# إنشاء Client
bun run db:generate

# إنشاء migration
bun run db:migrate

# إعادة تعيين قاعدة البيانات
bun run db:reset

# تشغيل البيانات الأولية
bun run db:seed
```

### أفضل الممارسات

#### ✅ استخدم include لجلب العلاقات

```typescript
// ❌ استعلامات متعددة
const products = await db.product.findMany();
for (const p of products) {
  p.category = await db.category.findUnique({ where: { id: p.categoryId } });
}

// ✅ استعلام واحد
const products = await db.product.findMany({
  include: { category: true, brand: true },
});
```

#### ✅ استخدم select لتحديد الحقول

```typescript
// ❌ جلب كل الحقول
const products = await db.product.findMany();

// ✅ جلب الحقول المطلوبة فقط
const products = await db.product.findMany({
  select: {
    id: true,
    name: true,
    price: true,
  },
});
```

#### ✅ أضف فهارس للحقول المتكررة

```prisma
model Product {
  // ...
  
  @@index([categoryId])
  @@index([branchId, isActive])
  @@index([name])
}
```

---

## 6. إدارة الحالة 🐻

### Zustand Store

```typescript
// src/store/index.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // الحالة
  user: User | null;
  branch: Branch | null;
  theme: 'light' | 'dark';
  
  // الإجراءات
  setUser: (user: User | null) => void;
  setBranch: (branch: Branch | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      branch: null,
      theme: 'light',
      
      setUser: (user) => set({ user }),
      setBranch: (branch) => set({ branch }),
      setTheme: (theme) => set({ theme }),
      logout: () => set({ user: null, branch: null }),
    }),
    {
      name: 'pos-storage',
    }
  )
);
```

### استخدام Store

```typescript
import { useStore } from '@/store';

function MyComponent() {
  const { user, setUser } = useStore();
  
  return (
    <div>
      <p>مرحباً، {user?.name}</p>
      <button onClick={() => setUser(null)}>تسجيل الخروج</button>
    </div>
  );
}
```

### TanStack Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function useProducts() {
  const queryClient = useQueryClient();

  // جلب البيانات
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(r => r.json()),
    staleTime: 5 * 60 * 1000, // 5 دقائق
  });

  // إنشاء منتج
  const createMutation = useMutation({
    mutationFn: (product) => 
      fetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(product),
      }),
    onSuccess: () => {
      // إبطال الكاش لجلب البيانات الجديدة
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    products: data?.products ?? [],
    isLoading,
    createProduct: createMutation.mutate,
  };
}
```

---

## 7. الاختبارات 🧪

### هيكل الاختبارات

```
__tests__/
├── api/                    # اختبارات APIs
│   ├── auth.test.ts
│   ├── products.test.ts
│   └── invoices.test.ts
│
├── components/             # اختبارات المكونات
│   ├── LoginPage.test.tsx
│   └── KPICard.test.tsx
│
└── hooks/                  # اختبارات Hooks
    └── useApi.test.ts
```

### اختبار API

```typescript
// __tests__/api/products.test.ts
import { GET, POST } from '@/app/api/products/route';
import { db } from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  db: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('Products API', () => {
  describe('GET /api/products', () => {
    it('should return products list', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', price: 100 },
      ];

      (db.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (db.product.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost/api/products');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.products).toHaveLength(1);
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const newProduct = {
        barcode: '123456',
        name: 'New Product',
        sellingPrice: 150,
      };

      (db.product.create as jest.Mock).mockResolvedValue({
        id: '1',
        ...newProduct,
      });

      const request = new NextRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify(newProduct),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.product.name).toBe('New Product');
    });
  });
});
```

### اختبار المكونات

```typescript
// __tests__/components/KPICard.test.tsx
import { render, screen } from '@testing-library/react';
import { KPICard } from '@/modules/dashboard/components/KPICard';

describe('KPICard', () => {
  it('should render title and value', () => {
    render(
      <KPICard
        title="المبيعات"
        value={15000}
        icon={<span>💰</span>}
      />
    );

    expect(screen.getByText('المبيعات')).toBeInTheDocument();
    expect(screen.getByText('15,000')).toBeInTheDocument();
  });

  it('should show change indicator', () => {
    render(
      <KPICard
        title="المبيعات"
        value={15000}
        change={12.5}
        changeType="increase"
      />
    );

    expect(screen.getByText('+12.5%')).toBeInTheDocument();
  });
});
```

### تشغيل الاختبارات

```bash
# تشغيل جميع الاختبارات
bun run test

# وضع المراقبة
bun run test:watch

# تقرير التغطية
bun run test:coverage

# اختبارات CI
bun run test:ci
```

---

## 8. معايير الكود 📏

### TypeScript

```typescript
// ✅ استخدم الأنواع دائماً
interface Product {
  id: string;
  name: string;
  price: number;
}

// ✅ تجنب any
function process(data: unknown): string {
  if (typeof data === 'string') return data;
  return '';
}

// ✅ استخدم const assertions
const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;
```

### React

```typescript
// ✅ استخدم Functional Components
export function MyComponent({ title }: { title: string }) {
  return <div>{title}</div>;
}

// ✅ استخدم Custom Hooks للمنطق
function useProductActions() {
  const [loading, setLoading] = useState(false);
  
  const create = async (data: Product) => {
    setLoading(true);
    // ...
    setLoading(false);
  };
  
  return { loading, create };
}

// ✅ استخدم memo للمكونات الثقيلة
const ProductCard = memo(function ProductCard({ product }: Props) {
  return <Card>{product.name}</Card>;
});
```

###命名 conventions

| النوع | التنسيق | مثال |
|-------|---------|------|
| المكونات | PascalCase | `ProductCard.tsx` |
| الملفات | camelCase | `useProducts.ts` |
| الـ APIs | kebab-case | `/api/payment-methods` |
| الثوابت | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |
| المتغيرات | camelCase | `productList` |

### التعليقات

```typescript
/**
 * حساب خصم المنتج
 * @param price - سعر المنتج
 * @param discount - نسبة الخصم
 * @returns السعر بعد الخصم
 */
function calculateDiscount(price: number, discount: number): number {
  return price * (1 - discount / 100);
}
```

---

## 🚀 نصائح الأداء

### Code Splitting

```typescript
// ✅ Lazy loading للصفحات
const ProductsPage = dynamic(
  () => import('@/modules/products').then(m => ({ default: m.ProductsPage })),
  { loading: () => <Skeleton />, ssr: false }
);
```

### Debounce

```typescript
// ✅ Debounce للبحث
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback((value) => {
  setSearch(value);
}, 300);
```

### Memoization

```typescript
// ✅ useMemo للحسابات الثقيلة
const filteredProducts = useMemo(() => {
  return products.filter(p => p.categoryId === selectedCategory);
}, [products, selectedCategory]);

// ✅ useCallback للدوال
const handleAddToCart = useCallback((product: Product) => {
  addToCart(product);
}, [addToCart]);
```

---

## 📞 الدعم

| القناة | الرابط |
|--------|--------|
| 📧 البريد | dev@pos-system.com |
| 💬 Discord | [مجتمع المطورين](https://discord.gg/pos-dev) |

---

<div align="center">

**📅 آخر تحديث:** يناير 2025

**📝 الإصدار:** 1.3.3

</div>
