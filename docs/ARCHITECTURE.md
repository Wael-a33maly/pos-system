# 🏗️ البنية الهيكلية المثلى لنظام POS

## 📁 هيكل المجلدات المقترح

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth Group Routes
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/              # Dashboard Group Routes
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── (pos)/                    # POS Group Routes
│   │   └── page.tsx
│   ├── api/                      # API Routes
│   │   ├── [feature]/            # Feature-based API
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   └── trpc/                 # tRPC (اختياري)
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                       # مكونات UI أساسية (shadcn)
│   ├── common/                   # مكونات مشتركة
│   │   ├── DataTable.tsx
│   │   ├── PageHeader.tsx
│   │   ├── StatsCard.tsx
│   │   └── SearchInput.tsx
│   ├── pos/                      # مكونات نقطة البيع
│   │   ├── POSPage.tsx           # الصفحة الرئيسية (خفيفة)
│   │   ├── components/           # مكونات فرعية
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── Cart.tsx
│   │   │   ├── PaymentDialog.tsx
│   │   │   ├── InvoicePreview.tsx
│   │   │   └── CategoryTabs.tsx
│   │   └── hooks/                # Hooks خاصة
│   │       ├── useCart.ts
│   │       └── usePayment.ts
│   ├── dashboard/                # مكونات لوحة التحكم
│   │   ├── DashboardPage.tsx
│   │   ├── components/
│   │   │   ├── KPICards.tsx
│   │   │   ├── SalesChart.tsx
│   │   │   ├── RecentInvoices.tsx
│   │   │   └── TopProducts.tsx
│   │   └── hooks/
│   │       └── useDashboard.ts
│   └── layout/                   # مكونات التخطيط
│
├── hooks/                        # Custom Hooks عامة
│   ├── useApi.ts
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── useMediaQuery.ts
│
├── lib/                          # مكتبات مساعدة
│   ├── api/                      # API Client
│   │   ├── client.ts
│   │   └── endpoints.ts
│   ├── db.ts
│   ├── utils.ts
│   └── constants.ts
│
├── store/                        # إدارة الحالة
│   ├── index.ts
│   ├── slices/
│   │   ├── cartSlice.ts
│   │   ├── authSlice.ts
│   │   └── uiSlice.ts
│   └── middleware/
│
├── types/                        # TypeScript Types
│   ├── index.ts
│   ├── api.ts
│   └── models.ts
│
└── styles/
    └── globals.css
```

## ⚡ استراتيجيات تحسين الأداء

### 1. Code Splitting & Lazy Loading

```typescript
// ❌ قبل - تحميل كامل
import { ProductsPage } from '@/components/products/ProductsPage'

// ✅ بعد - تحميل عند الطلب
import dynamic from 'next/dynamic'

const ProductsPage = dynamic(
  () => import('@/components/products/ProductsPage'),
  { 
    loading: () => <PageSkeleton />,
    ssr: false 
  }
)
```

### 2. تقسيم المكونات الكبيرة

```typescript
// ❌ قبل - ملف واحد ضخم (POSPage.tsx: 1762 سطر)

// ✅ بعد - مكونات صغيرة ومركزة
// POSPage.tsx (50 سطر)
// components/ProductGrid.tsx (100 سطر)
// components/Cart.tsx (150 سطر)
// components/PaymentDialog.tsx (200 سطر)
// hooks/useCart.ts (100 سطر)
```

### 3. React.memo للمكونات الثقيلة

```typescript
import { memo } from 'react'

// مكون ProductCard لا يعاد رسمه إلا عند تغيير البيانات
const ProductCard = memo(({ product }: { product: Product }) => {
  return (
    <Card>
      <ProductImage product={product} />
      <ProductInfo product={product} />
    </Card>
  )
}, (prevProps, nextProps) => {
  // مقارنة مخصصة
  return prevProps.product.id === nextProps.product.id &&
         prevProps.product.price === nextProps.product.price
})

ProductCard.displayName = 'ProductCard'
```

### 4. Virtual Scrolling للقوائم الطويلة

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function ProductList({ products }: { products: Product[] }) {
  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5
  })

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <ProductCard 
            key={virtualRow.key}
            product={products[virtualRow.index]}
          />
        ))}
      </div>
    </div>
  )
}
```

### 5. Debounce للبحث

```typescript
import { useDebouncedCallback } from 'use-debounce'

function SearchInput() {
  const [query, setQuery] = useState('')
  
  const debouncedSearch = useDebouncedCallback((value: string) => {
    // API call بعد 300ms من التوقف عن الكتابة
    fetchProducts(value)
  }, 300)

  return (
    <Input 
      onChange={(e) => {
        setQuery(e.target.value)
        debouncedSearch(e.target.value)
      }}
    />
  )
}
```

### 6. تخزين مؤقت للبيانات (React Query)

```typescript
// hooks/useQueryWithCache.ts
import { useQuery } from '@tanstack/react-query'

export function useProducts(categoryId?: string) {
  return useQuery({
    queryKey: ['products', categoryId],
    queryFn: () => fetchProducts(categoryId),
    staleTime: 5 * 60 * 1000, // 5 دقائق
    gcTime: 10 * 60 * 1000,   // 10 دقائق
    refetchOnWindowFocus: false,
  })
}
```

### 7. تحسين الصور

```typescript
import Image from 'next/image'

// ❌ قبل
<img src="/logo.png" alt="Logo" />

// ✅ بعد
<Image 
  src="/logo.png" 
  alt="Logo" 
  width={200} 
  height={100}
  loading="lazy"
  priority={false}
/>
```

### 8. تحسين قاعدة البيانات

```typescript
// ❌ قبل - استعلامات متعددة
const products = await db.product.findMany()
const categories = await db.category.findMany()

// ✅ بعد - استعلام واحد مع include
const productsWithCategories = await db.product.findMany({
  include: { category: true },
  where: { isActive: true },
  select: {
    id: true,
    name: true,
    price: true,
    category: { select: { name: true } }
  }
})
```

## 📊 مؤشرات الأداء المستهدفة

| المؤشر | الهدف | الحالي |
|--------|-------|--------|
| First Contentful Paint | < 1.5s | ~2s |
| Largest Contentful Paint | < 2.5s | ~4s |
| Time to Interactive | < 3s | ~5s |
| Bundle Size (gzipped) | < 200KB | ~500KB |
| API Response Time | < 200ms | ~500ms |

## 🔧 تحسينات Next.js Config

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'standalone',
  
  // تقسيم الحزم
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu'
    ]
  },
  
  // تحسين الصور
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: []
  },
  
  // Headers للتخزين المؤقت
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 's-maxage=60, stale-while-revalidate=300' }
        ]
      }
    ]
  }
}
```

## 🚀 خطة التنفيذ

### المرحلة 1: تقسيم المكونات
1. تقسيم POSPage.tsx إلى مكونات صغيرة
2. تقسيم DashboardPage.tsx
3. إنشاء مكونات مشتركة (Common Components)

### المرحلة 2: تحسين التحميل
1. تطبيق Lazy Loading
2. تطبيق Virtual Scrolling
3. تحسين Bundle Size

### المرحلة 3: تحسين البيانات
1. تطبيق React Query
2. تحسين استعلامات Prisma
3. إضافة تخزين مؤقت

### المرحلة 4: مراقبة الأداء
1. إضافة Web Vitals
2. تحليل Bundle
3. اختبار الأداء
