# 📡 مرجع API - نظام نقاط البيع POS

<div align="center">

![API Reference](https://img.shields.io/badge/API-Reference-purple)
![REST API](https://img.shields.io/badge/REST-API-green)
![JSON](https://img.shields.io/badge/Format-JSON-blue)

**توثيق كامل لجميع نقاط النهاية (Endpoints)**

</div>

---

## 📑 فهرس المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [المصادقة](#المصادقة)
3. [المنتجات](#المنتجات)
4. [الفواتير](#الفواتير)
5. [العملاء](#العملاء)
6. [التقارير](#التقارير)
7. [الورديات](#الورديات)
8. [المستخدمين](#المستخدمين)
9. [الإعدادات](#الإعدادات)
10. [المخزون](#المخزون)

---

## نظرة عامة

### Base URL

```
http://localhost:3000/api
```

### تنسيق الطلبات

جميع الطلبات والاستجابات بتنسيق JSON:

```typescript
// Headers
Content-Type: application/json
Accept: application/json

// مع التوكن (بعد تسجيل الدخول)
Cookie: auth_token=<token>
```

### رموز الاستجابة

| الرمز | المعنى |
|-------|--------|
| `200` | نجاح ✅ |
| `201` | تم الإنشاء ✅ |
| `400` | طلب غير صالح ❌ |
| `401` | غير مصرح ❌ |
| `404` | غير موجود ❌ |
| `500` | خطأ في الخادم ❌ |

### هيكل الاستجابة

```typescript
// استجابة ناجحة
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 50
}

// استجابة بخطأ
{
  "error": "رسالة الخطأ"
}
```

---

## المصادقة 🔐

### تسجيل الدخول

**POST** `/api/auth/login`

#### الطلب

```json
{
  "email": "admin@pos.com",
  "password": "admin123"
}
```

#### الاستجابة

```json
{
  "user": {
    "id": "clx123...",
    "email": "admin@pos.com",
    "name": "مدير النظام",
    "role": "SUPER_ADMIN",
    "branch": {
      "id": "clx456...",
      "name": "الفرع الرئيسي"
    },
    "permissions": [
      { "module": "dashboard", "action": "view", "allowed": true },
      { "module": "products", "action": "create", "allowed": true }
    ]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### أمثلة الكود

```typescript
// TypeScript
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};
```

```bash
# cURL
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pos.com","password":"admin123"}'
```

---

### جلب المستخدم الحالي

**GET** `/api/auth/me`

#### Headers

```
Cookie: auth_token=<token>
```

#### الاستجابة

```json
{
  "user": {
    "id": "clx123...",
    "email": "admin@pos.com",
    "name": "مدير النظام",
    "role": "SUPER_ADMIN",
    "branch": { "id": "...", "name": "الفرع الرئيسي" }
  }
}
```

---

### تسجيل الخروج

**POST** `/api/auth/logout`

#### الاستجابة

```json
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح"
}
```

---

## المنتجات 📦

### جلب قائمة المنتجات

**GET** `/api/products`

#### معاملات الاستعلام

| المعامل | النوع | الوصف | مطلوب |
|---------|-------|-------|-------|
| `search` | string | البحث بالاسم أو الباركود | لا |
| `categoryId` | string | تصفية حسب التصنيف | لا |
| `branchId` | string | تصفية حسب الفرع | لا |
| `barcode` | string | البحث بالباركود الدقيق | لا |
| `page` | number | رقم الصفحة (افتراضي: 1) | لا |
| `limit` | number | عدد العناصر (افتراضي: 50) | لا |

#### مثال الطلب

```
GET /api/products?search=قهوة&categoryId=cat123&page=1&limit=20
```

#### الاستجابة

```json
{
  "products": [
    {
      "id": "clx123...",
      "barcode": "6281001234567",
      "sku": "COF-001",
      "name": "قهوة عربية",
      "nameAr": "قهوة عربية",
      "description": "قهوة عربية ممتازة",
      "costPrice": 15.0,
      "sellingPrice": 25.0,
      "wholesalePrice": 20.0,
      "unit": "piece",
      "isActive": true,
      "category": {
        "id": "cat123",
        "name": "مشروبات"
      },
      "brand": {
        "id": "brand123",
        "name": "براند A"
      },
      "variants": [],
      "inventory": [
        {
          "branchId": "branch1",
          "quantity": 150
        }
      ],
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### إنشاء منتج جديد

**POST** `/api/products`

#### الطلب

```json
{
  "barcode": "6281001234568",
  "sku": "TEA-001",
  "name": "شاي أخضر",
  "nameAr": "شاي أخضر",
  "description": "شاي أخضر طبيعي",
  "categoryId": "cat123",
  "brandId": "brand456",
  "supplierId": "sup789",
  "branchId": "branch1",
  "costPrice": 10.0,
  "sellingPrice": 18.0,
  "wholesalePrice": 15.0,
  "minStock": 20,
  "maxStock": 200,
  "unit": "piece",
  "hasVariants": false,
  "isActive": true
}
```

#### الاستجابة

```json
{
  "product": {
    "id": "clx789...",
    "barcode": "6281001234568",
    "name": "شاي أخضر",
    "sellingPrice": 18.0,
    "createdAt": "2025-01-20T14:30:00.000Z"
  }
}
```

#### الأخطاء

| الكود | الرسالة | السبب |
|-------|---------|-------|
| 400 | الباركود مستخدم بالفعل | تكرار الباركود |

---

### جلب منتج واحد

**GET** `/api/products/[id]`

#### الاستجابة

```json
{
  "product": {
    "id": "clx123...",
    "barcode": "6281001234567",
    "name": "قهوة عربية",
    "sellingPrice": 25.0,
    "category": { "id": "...", "name": "مشروبات" }
  }
}
```

---

### تحديث منتج

**PUT** `/api/products/[id]`

#### الطلب

```json
{
  "name": "قهوة عربية ممتازة",
  "sellingPrice": 28.0
}
```

#### الاستجابة

```json
{
  "product": {
    "id": "clx123...",
    "name": "قهوة عربية ممتازة",
    "sellingPrice": 28.0
  }
}
```

---

### حذف منتج

**DELETE** `/api/products/[id]`

#### الاستجابة

```json
{
  "success": true
}
```

---

## الفواتير 📄

### جلب قائمة الفواتير

**GET** `/api/invoices`

#### معاملات الاستعلام

| المعامل | النوع | الوصف |
|---------|-------|-------|
| `search` | string | البحث برقم الفاتورة |
| `status` | enum | الحالة (PENDING, COMPLETED, CANCELLED) |
| `branchId` | string | تصفية حسب الفرع |
| `userId` | string | تصفية حسب المستخدم |
| `shiftId` | string | تصفية حسب الوردية |
| `startDate` | date | تاريخ البداية |
| `endDate` | date | تاريخ النهاية |
| `page` | number | رقم الصفحة |
| `limit` | number | عدد العناصر |

#### مثال الطلب

```
GET /api/invoices?branchId=branch1&startDate=2025-01-01&endDate=2025-01-31
```

#### الاستجابة

```json
{
  "invoices": [
    {
      "id": "inv123...",
      "invoiceNumber": "INV-000001",
      "status": "COMPLETED",
      "paymentStatus": "PAID",
      "subtotal": 100.0,
      "taxAmount": 15.0,
      "discountAmount": 10.0,
      "totalAmount": 105.0,
      "paidAmount": 105.0,
      "changeAmount": 0.0,
      "createdAt": "2025-01-20T14:30:00.000Z",
      "branch": { "id": "...", "name": "الفرع الرئيسي" },
      "customer": { "id": "...", "name": "أحمد محمد" },
      "user": { "id": "...", "name": "كاشير 1" },
      "items": [
        {
          "id": "item1",
          "productName": "قهوة عربية",
          "quantity": 2,
          "unitPrice": 25.0,
          "totalAmount": 50.0
        }
      ],
      "payments": [
        {
          "id": "pay1",
          "amount": 105.0,
          "paymentMethod": { "name": "نقدي" }
        }
      ]
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 50
}
```

---

### إنشاء فاتورة جديدة

**POST** `/api/invoices`

#### الطلب

```json
{
  "branchId": "branch1",
  "userId": "user1",
  "customerId": "cust1",
  "shiftId": "shift1",
  "status": "COMPLETED",
  "paymentStatus": "PAID",
  "subtotal": 100.0,
  "taxAmount": 15.0,
  "discountAmount": 10.0,
  "totalAmount": 105.0,
  "paidAmount": 110.0,
  "changeAmount": 5.0,
  "notes": "عميل مميز",
  "items": [
    {
      "productId": "prod1",
      "productName": "قهوة عربية",
      "quantity": 2,
      "unitPrice": 25.0,
      "costPrice": 15.0,
      "totalAmount": 50.0
    },
    {
      "productId": "prod2",
      "productName": "شاي أخضر",
      "quantity": 3,
      "unitPrice": 18.0,
      "costPrice": 10.0,
      "totalAmount": 54.0
    }
  ],
  "payments": [
    {
      "paymentMethodId": "pm1",
      "amount": 110.0
    }
  ]
}
```

#### الاستجابة

```json
{
  "invoice": {
    "id": "inv124...",
    "invoiceNumber": "INV-000002",
    "status": "COMPLETED",
    "totalAmount": 105.0,
    "createdAt": "2025-01-20T15:00:00.000Z"
  }
}
```

---

### جلب فاتورة واحدة

**GET** `/api/invoices/[id]`

#### الاستجابة

```json
{
  "invoice": {
    "id": "inv123",
    "invoiceNumber": "INV-000001",
    "status": "COMPLETED",
    "totalAmount": 105.0,
    "items": [...],
    "payments": [...]
  }
}
```

---

## العملاء 👥

### جلب قائمة العملاء

**GET** `/api/customers`

#### معاملات الاستعلام

| المعامل | النوع | الوصف |
|---------|-------|-------|
| `search` | string | البحث بالاسم أو الهاتف |
| `branchId` | string | تصفية حسب الفرع |

#### الاستجابة

```json
{
  "customers": [
    {
      "id": "cust123",
      "name": "أحمد محمد",
      "nameAr": "أحمد محمد",
      "phone": "0501234567",
      "email": "ahmed@email.com",
      "address": "الرياض",
      "taxNumber": "300123456789003",
      "notes": "عميل مميز",
      "isActive": true,
      "createdAt": "2025-01-10T10:00:00.000Z"
    }
  ]
}
```

---

### إنشاء عميل جديد

**POST** `/api/customers`

#### الطلب

```json
{
  "name": "محمد علي",
  "nameAr": "محمد علي",
  "phone": "0559876543",
  "email": "mohammed@email.com",
  "address": "جدة",
  "taxNumber": "300987654321003",
  "notes": "عميل جديد",
  "branchId": "branch1",
  "isActive": true
}
```

#### الاستجابة

```json
{
  "customer": {
    "id": "cust789",
    "name": "محمد علي",
    "phone": "0559876543",
    "createdAt": "2025-01-20T16:00:00.000Z"
  }
}
```

---

## التقارير 📊

### إحصائيات لوحة التحكم

**GET** `/api/dashboard/stats`

#### معاملات الاستعلام

| المعامل | النوع | الوصف |
|---------|-------|-------|
| `branchId` | string | تصفية حسب الفرع |

#### الاستجابة

```json
{
  "kpis": {
    "todaySales": 15000.0,
    "todayOrders": 45,
    "todayCustomers": 38,
    "lowStockProducts": 5,
    "totalProducts": 500,
    "activeShifts": 2
  },
  "salesByHour": [
    { "hour": 8, "sales": 500.0, "count": 3 },
    { "hour": 9, "sales": 1200.0, "count": 8 },
    { "hour": 10, "sales": 1800.0, "count": 12 }
  ],
  "topProducts": [
    { "name": "قهوة عربية", "sold": 50, "revenue": 1250.0 },
    { "name": "شاي أخضر", "sold": 35, "revenue": 630.0 }
  ],
  "recentInvoices": [...]
}
```

---

### تقرير المبيعات

**GET** `/api/reports/sales`

#### معاملات الاستعلام

| المعامل | النوع | الوصف |
|---------|-------|-------|
| `startDate` | date | تاريخ البداية |
| `endDate` | date | تاريخ النهاية |
| `branchId` | string | الفرع |

#### الاستجابة

```json
{
  "summary": {
    "totalSales": 150000.0,
    "totalOrders": 450,
    "averageOrder": 333.33,
    "totalReturns": 5000.0,
    "netSales": 145000.0
  },
  "dailyData": [
    {
      "date": "2025-01-20",
      "sales": 15000.0,
      "orders": 45,
      "returns": 500.0
    }
  ]
}
```

---

### تقرير المنتجات

**GET** `/api/reports/products`

#### معاملات الاستعلام

| المعامل | النوع | الوصف |
|---------|-------|-------|
| `startDate` | date | تاريخ البداية |
| `endDate` | date | تاريخ النهاية |
| `branchId` | string | الفرع |
| `categoryId` | string | التصنيف |
| `sortBy` | string | الترتيب (sold, revenue, profit) |

#### الاستجابة

```json
{
  "products": [
    {
      "id": "prod1",
      "name": "قهوة عربية",
      "sold": 200,
      "revenue": 5000.0,
      "cost": 3000.0,
      "profit": 2000.0,
      "profitMargin": 40.0
    }
  ],
  "total": 50
}
```

---

### تقرير المخزون

**GET** `/api/reports/inventory`

#### الاستجابة

```json
{
  "items": [
    {
      "productId": "prod1",
      "productName": "قهوة عربية",
      "quantity": 50,
      "minStock": 20,
      "status": "low"
    }
  ]
}
```

---

## الورديات ⏰

### جلب الورديات

**GET** `/api/shifts`

#### الاستجابة

```json
{
  "shifts": [
    {
      "id": "shift1",
      "branchId": "branch1",
      "userId": "user1",
      "startTime": "2025-01-20T08:00:00.000Z",
      "endTime": null,
      "openingCash": 500.0,
      "totalSales": 15000.0,
      "totalReturns": 200.0,
      "totalExpenses": 150.0,
      "status": "OPEN",
      "user": { "name": "كاشير 1" },
      "branch": { "name": "الفرع الرئيسي" }
    }
  ]
}
```

---

### فتح وردية جديدة

**POST** `/api/shifts`

#### الطلب

```json
{
  "branchId": "branch1",
  "userId": "user1",
  "openingCash": 500.0,
  "notes": "بداية وردية الصباح"
}
```

---

### إغلاق وردية

**POST** `/api/shifts/close`

#### الطلب

```json
{
  "shiftId": "shift1",
  "closingCash": 520.0,
  "notes": "نهاية وردية سلسة"
}
```

#### الاستجابة

```json
{
  "shift": {
    "id": "shift1",
    "status": "CLOSED",
    "endTime": "2025-01-20T16:00:00.000Z",
    "summary": {
      "totalSales": 15000.0,
      "totalReturns": 200.0,
      "totalExpenses": 150.0,
      "expectedCash": 15150.0,
      "actualCash": 520.0,
      "difference": 30.0
    }
  }
}
```

---

### تقرير Z

**GET** `/api/shifts/[id]/z-report`

#### الاستجابة

```json
{
  "report": {
    "shiftNumber": 1,
    "date": "2025-01-20",
    "openedBy": "كاشير 1",
    "closedBy": "مشرف 1",
    "openingCash": 500.0,
    "sales": {
      "cash": 8000.0,
      "card": 5000.0,
      "other": 2000.0,
      "total": 15000.0
    },
    "returns": 200.0,
    "expenses": 150.0,
    "invoices": {
      "total": 45,
      "completed": 43,
      "cancelled": 2
    },
    "expectedCash": 15150.0,
    "actualCash": 520.0
  }
}
```

---

## المستخدمين 👤

### جلب المستخدمين

**GET** `/api/users`

#### الاستجابة

```json
{
  "users": [
    {
      "id": "user1",
      "email": "admin@pos.com",
      "name": "مدير النظام",
      "role": "SUPER_ADMIN",
      "isActive": true,
      "branch": { "name": "الفرع الرئيسي" },
      "permissions": [
        { "module": "dashboard", "action": "view", "allowed": true }
      ]
    }
  ]
}
```

---

### إنشاء مستخدم

**POST** `/api/users`

#### الطلب

```json
{
  "email": "cashier@pos.com",
  "password": "password123",
  "name": "كاشير جديد",
  "phone": "0551234567",
  "role": "USER",
  "branchId": "branch1",
  "permissions": [
    { "module": "pos", "action": "view", "allowed": true },
    { "module": "pos", "action": "create", "allowed": true }
  ]
}
```

---

## الإعدادات ⚙️

### جلب الإعدادات

**GET** `/api/settings`

#### الاستجابة

```json
{
  "settings": [
    { "key": "company_name", "value": "شركتي" },
    { "key": "company_tax_number", "value": "300123456789003" },
    { "key": "default_currency", "value": "SAR" }
  ]
}
```

---

### تحديث الإعدادات

**PUT** `/api/settings`

#### الطلب

```json
{
  "settings": [
    { "key": "company_name", "value": "شركتي الجديدة" },
    { "key": "company_phone", "value": "+966123456789" }
  ]
}
```

---

## المخزون 📦

### جلب المخزون

**GET** `/api/inventory`

#### معاملات الاستعلام

| المعامل | النوع | الوصف |
|---------|-------|-------|
| `branchId` | string | الفرع |
| `lowStock` | boolean | المخزون المنخفض فقط |

#### الاستجابة

```json
{
  "inventory": [
    {
      "id": "inv1",
      "productId": "prod1",
      "branchId": "branch1",
      "quantity": 50,
      "product": {
        "name": "قهوة عربية",
        "minStock": 20
      }
    }
  ]
}
```

---

## المرتجعات 🔄

### جلب المرتجعات

**GET** `/api/returns`

#### الاستجابة

```json
{
  "returns": [
    {
      "id": "ret1",
      "returnNumber": "RET-000001",
      "status": "PENDING",
      "totalAmount": 100.0,
      "reason": "DEFECTIVE",
      "refundMethod": "CASH",
      "originalInvoice": {
        "invoiceNumber": "INV-000050"
      },
      "items": [
        {
          "productName": "قهوة عربية",
          "quantity": 2,
          "unitPrice": 25.0
        }
      ]
    }
  ]
}
```

---

### إنشاء مرتجع

**POST** `/api/returns`

#### الطلب

```json
{
  "originalInvoiceId": "inv50",
  "customerId": "cust1",
  "branchId": "branch1",
  "userId": "user1",
  "reason": "DEFECTIVE",
  "refundMethod": "CASH",
  "notes": "منتج تالف",
  "items": [
    {
      "invoiceItemId": "item1",
      "productId": "prod1",
      "productName": "قهوة عربية",
      "quantity": 2,
      "unitPrice": 25.0
    }
  ]
}
```

---

## أنواع البيانات

### Invoice Status

```typescript
type InvoiceStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'RETURNED';
```

### Payment Status

```typescript
type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
```

### Shift Status

```typescript
type ShiftStatus = 'OPEN' | 'CLOSED';
```

### User Role

```typescript
type UserRole = 'SUPER_ADMIN' | 'BRANCH_ADMIN' | 'USER';
```

### Return Reason

```typescript
type ReturnReason = 'DEFECTIVE' | 'WRONG_ITEM' | 'NOT_AS_DESCRIBED' | 'CUSTOMER_CHANGE' | 'OTHER';
```

### Return Status

```typescript
type ReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
```

### Refund Method

```typescript
type RefundMethod = 'CASH' | 'CREDIT' | 'EXCHANGE';
```

---

## Webhooks (قريباً)

### الأحداث المتاحة

| الحدث | الوصف |
|-------|-------|
| `invoice.created` | عند إنشاء فاتورة جديدة |
| `invoice.cancelled` | عند إلغاء فاتورة |
| `shift.opened` | عند فتح وردية |
| `shift.closed` | عند إغلاق وردية |
| `low_stock.alert` | عند انخفاض المخزون |

---

<div align="center">

**📅 آخر تحديث:** يناير 2025

**📝 الإصدار:** 1.3.3

</div>
