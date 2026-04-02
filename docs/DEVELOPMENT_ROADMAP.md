# 🗺️ خطة تطوير نظام POS الاحترافي

## 📋 جدول المحتويات

1. [نظام تحويلات المخزون](#1-نظام-تحويلات-المخزون-بين-الفروع)
2. [نظام الولاء](#2-نظام-الولاء)
3. [التقارير المجدولة](#3-التقارير-المجدولة)
4. [العروض التلقائية](#4-العروض-التلقائية)
5. [الجرد الدوري](#5-الجرد-الدوري)
6. [نظام المشتريات](#6-نظام-المشتريات)
7. [نظام طباعة الفواتير](#7-نظام-طباعة-وتصميم-الفواتير)

---

# 1. نظام تحويلات المخزون بين الفروع

## 📌 الوصف
نظام متكامل لتحويل المنتجات بين الفروع مع تتبع كامل للعمليات.

## 🎯 الأهداف
- تحسين توزيع المخزون بين الفروع
- تقليل نفاد المخزون في الفروع
- تتبع كامل لحركة البضائع

## 📊 مخطط قاعدة البيانات

```prisma
// prisma/schema.prisma

// ==================== تحويلات المخزون ====================
model StockTransfer {
  id              String              @id @default(cuid())
  transferNumber  String              @unique
  fromBranchId    String
  toBranchId      String
  status          StockTransferStatus @default(DRAFT)
  priority        TransferPriority    @default(NORMAL)
  requestedById   String
  approvedById    String?
  receivedById    String?
  
  // التواريخ
  requestedAt     DateTime            @default(now())
  approvedAt      DateTime?
  shippedAt       DateTime?
  receivedAt      DateTime?
  
  // الملاحظات
  notes           String?
  rejectionReason String?
  
  // المبالغ
  totalCost       Float               @default(0)
  totalItems      Int                 @default(0)
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  // العلاقات
  fromBranch      Branch              @relation("TransferFrom", fields: [fromBranchId], references: [id])
  toBranch        Branch              @relation("TransferTo", fields: [toBranchId], references: [id])
  requestedBy     User                @relation("TransferRequester", fields: [requestedById], references: [id])
  approvedBy      User?               @relation("TransferApprover", fields: [approvedById], references: [id])
  receivedBy      User?               @relation("TransferReceiver", fields: [receivedById], references: [id])
  items           StockTransferItem[]
  auditLog        StockTransferAudit[]
}

model StockTransferItem {
  id              String        @id @default(cuid())
  transferId      String
  productId       String
  variantId       String?
  
  // الكميات
  requestedQty    Int
  approvedQty     Int?
  shippedQty      Int?
  receivedQty     Int?
  varianceQty     Int?          // الفرق بين المرسل والمستلم
  
  // الأسعار
  costPrice       Float
  totalCost       Float
  
  // ملاحظات
  notes           String?
  
  createdAt       DateTime      @default(now())
  
  // العلاقات
  transfer        StockTransfer @relation(fields: [transferId], references: [id], onDelete: Cascade)
  product         Product       @relation(fields: [productId], references: [id])
  variant         ProductVariant? @relation(fields: [variantId], references: [id])
}

model StockTransferAudit {
  id              String        @id @default(cuid())
  transferId      String
  action          String        // CREATED, APPROVED, SHIPPED, RECEIVED, REJECTED, CANCELLED
  userId          String
  oldStatus       String?
  newStatus       String?
  notes           String?
  createdAt       DateTime      @default(now())
  
  transfer        StockTransfer @relation(fields: [transferId], references: [id])
  user            User          @relation(fields: [userId], references: [id])
}

enum StockTransferStatus {
  DRAFT           // مسودة
  PENDING         // في انتظار الاعتماد
  APPROVED        // معتمد
  IN_TRANSIT      // في الطريق
  RECEIVED        // مستلم
  PARTIAL         // استلام جزئي
  REJECTED        // مرفوض
  CANCELLED       // ملغي
}

enum TransferPriority {
  LOW             // منخفض
  NORMAL          // عادي
  HIGH            // عالي
  URGENT          // عاجل
}
```

## 🔌 APIs المطلوبة

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/stock-transfers` | قائمة التحويلات |
| GET | `/api/stock-transfers/:id` | تفاصيل تحويل |
| POST | `/api/stock-transfers` | إنشاء تحويل جديد |
| PUT | `/api/stock-transfers/:id` | تحديث تحويل |
| POST | `/api/stock-transfers/:id/approve` | اعتماد التحويل |
| POST | `/api/stock-transfers/:id/ship` | شحن التحويل |
| POST | `/api/stock-transfers/:id/receive` | استلام التحويل |
| POST | `/api/stock-transfers/:id/reject` | رفض التحويل |
| POST | `/api/stock-transfers/:id/cancel` | إلغاء التحويل |
| GET | `/api/stock-transfers/pending` | التحويلات المعلقة |
| GET | `/api/stock-transfers/report` | تقرير التحويلات |

## 📁 هيكل الملفات

```
src/
├── modules/
│   └── stock-transfers/
│       ├── components/
│       │   ├── StockTransfersPage.tsx      # الصفحة الرئيسية
│       │   ├── StockTransferForm.tsx       # نموذج إنشاء/تعديل
│       │   ├── StockTransferDetails.tsx    # صفحة التفاصيل
│       │   ├── StockTransferList.tsx       # قائمة التحويلات
│       │   ├── TransferApprovalDialog.tsx  # حوار الاعتماد
│       │   ├── TransferReceiveDialog.tsx   # حوار الاستلام
│       │   ├── TransferStatusBadge.tsx     # شارة الحالة
│       │   └── TransferStats.tsx           # إحصائيات
│       ├── hooks/
│       │   ├── useStockTransfers.ts        # هوك التحويلات
│       │   └── useTransferActions.ts       # هوك الإجراءات
│       ├── types/
│       │   └── index.ts                    # الأنواع
│       └── index.ts
├── app/
│   └── api/
│       └── stock-transfers/
│           ├── route.ts
│           ├── [id]/
│           │   ├── route.ts
│           │   ├── approve/route.ts
│           │   ├── ship/route.ts
│           │   ├── receive/route.ts
│           │   ├── reject/route.ts
│           │   └── cancel/route.ts
│           ├── pending/route.ts
│           └── report/route.ts
```

## 📅 الجدول الزمني

| المرحلة | المدة | المهام |
|---------|-------|--------|
| 1. قاعدة البيانات | يوم واحد | إنشاء Models + Migration |
| 2. الـ APIs | يومان | جميع الـ endpoints |
| 3. واجهة المستخدم | 3 أيام | الصفحات والحوارات |
| 4. الاختبار | يوم واحد | اختبار شامل |
| **المجموع** | **7 أيام** | |

## 🔗 الاعتماديات
- ✅ نظام الفروع (موجود)
- ✅ نظام المنتجات (موجود)
- ✅ نظام المخزون (موجود)
- ✅ نظام المستخدمين والصلاحيات (موجود)

---

# 2. نظام الولاء

## 📌 الوصف
نظام نقاط ولاء متكامل لمكافأة العملاء المخلصين وزيادة معدل الاحتفاظ.

## 🎯 الأهداف
- زيادة ولاء العملاء
- تشجيع المبيعات المتكررة
- تخصيص العروض للعملاء

## 📊 مخطط قاعدة البيانات

```prisma
// prisma/schema.prisma

// ==================== إعدادات نظام الولاء ====================
model LoyaltySettings {
  id                    String   @id @default(cuid())
  
  // نقاط الكسب
  pointsPerCurrency     Float    @default(1)    // نقطة لكل ريال
  minimumPurchase       Float    @default(0)    // الحد الأدنى للشراء
  pointsRounding        String   @default("DOWN") // UP, DOWN, NEAREST
  
  // استبدال النقاط
  pointValue            Float    @default(0.1)  // قيمة النقطة بالريال
  minimumPointsToRedeem Int      @default(100)  // أقل نقاط للاستبدال
  maxRedeemPercentage   Float    @default(50)   // أقصى نسبة من الفاتورة
  
  // مستويات العضوية
  enableTiers           Boolean  @default(true)
  
  // تاريخ انتهاء النقاط
  pointsExpiryMonths    Int?     // null = لا تنتهي
  
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

// ==================== حساب الولاء ====================
model LoyaltyAccount {
  id            String        @id @default(cuid())
  customerId    String        @unique
  totalPoints   Int           @default(0)
  usedPoints    Int           @default(0)
  expiredPoints Int           @default(0)
  currentTier   LoyaltyTier   @default(BRONZE)
  tierUpdatedAt DateTime?
  
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  customer      Customer      @relation(fields: [customerId], references: [id])
  transactions  LoyaltyTransaction[]
  pointBatches  LoyaltyPointBatch[]
}

// ==================== معاملات النقاط ====================
model LoyaltyTransaction {
  id              String              @id @default(cuid())
  accountId       String
  type            LoyaltyTransactionType
  points          Int                 // موجب = كسب، سالب = استبدال
  balance         Int                 // الرصيد بعد العملية
  
  // المرجع
  referenceType   String              // INVOICE, REDEMPTION, ADJUSTMENT, EXPIRY, BONUS
  referenceId     String?
  invoiceId       String?
  
  // التفاصيل
  description     String?
  amount          Float?              // المبلغ المرتبط
  
  // تاريخ الانتهاء
  expiresAt       DateTime?
  
  createdBy       String?
  createdAt       DateTime            @default(now())
  
  account         LoyaltyAccount      @relation(fields: [accountId], references: [id])
  invoice         Invoice?            @relation(fields: [invoiceId], references: [id])
}

// ==================== دفعات النقاط (لتتبع الانتهاء) ====================
model LoyaltyPointBatch {
  id              String        @id @default(cuid())
  accountId       String
  points          Int
  remainingPoints Int
  source          String        // PURCHASE, BONUS, REFERRAL
  sourceId        String?
  
  earnedAt        DateTime      @default(now())
  expiresAt       DateTime?
  
  account         LoyaltyAccount @relation(fields: [accountId], references: [id])
  transactions    LoyaltyTransaction[]
}

// ==================== مستويات العضوية ====================
model LoyaltyTierConfig {
  id              String        @id @default(cuid())
  name            String
  nameAr          String
  tier            LoyaltyTier   @unique
  minPoints       Int           // الحد الأدنى للوصول
  maxPoints       Int?          // الحد الأقصى (null = لا نهائي)
  
  // المكافآت
  pointsBonus     Float         @default(0)   // نسبة مكافأة إضافية
  discountPercent Float         @default(0)   // خصم خاص
  
  color           String        @default("#6b7280")
  icon            String?
  
  isActive        Boolean       @default(true)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

// ==================== مكافآت الولاء ====================
model LoyaltyReward {
  id              String        @id @default(cuid())
  name            String
  nameAr          String
  description     String?
  
  // نوع المكافأة
  type            RewardType
  pointsCost      Int           // تكلفة النقاط
  
  // قيمة المكافأة
  discountPercent Float?
  discountAmount  Float?
  freeProductId   String?
  
  // الشروط
  minimumPurchase Float?
  maxUses         Int?
  currentUses     Int           @default(0)
  validFrom       DateTime?
  validUntil      DateTime?
  
  isActive        Boolean       @default(true)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  freeProduct     Product?      @relation(fields: [freeProductId], references: [id])
}

enum LoyaltyTier {
  BRONZE    // برونزي
  SILVER    // فضي
  GOLD      // ذهبي
  PLATINUM  // بلاتيني
}

enum LoyaltyTransactionType {
  EARN          // كسب نقاط
  REDEEM        // استبدال نقاط
  ADJUSTMENT    // تعديل يدوي
  EXPIRY        // انتهاء صلاحية
  BONUS         // مكافأة
  REFERRAL      // إحالة صديق
  RETURN_ADJUST // تعديل مرتجع
}

enum RewardType {
  DISCOUNT_PERCENT   // خصم نسبة
  DISCOUNT_AMOUNT    // خصم مبلغ
  FREE_PRODUCT       // منتج مجاني
  FREE_SHIPPING      // شحن مجاني
  SPECIAL_OFFER      // عرض خاص
}
```

## 🔌 APIs المطلوبة

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/loyalty/settings` | إعدادات النظام |
| PUT | `/api/loyalty/settings` | تحديث الإعدادات |
| GET | `/api/loyalty/accounts` | قائمة الحسابات |
| GET | `/api/loyalty/accounts/:id` | تفاصيل حساب |
| GET | `/api/loyalty/customer/:customerId` | حساب عميل |
| POST | `/api/loyalty/earn` | كسب نقاط |
| POST | `/api/loyalty/redeem` | استبدال نقاط |
| POST | `/api/loyalty/adjust` | تعديل نقاط |
| GET | `/api/loyalty/transactions` | سجل المعاملات |
| GET | `/api/loyalty/rewards` | قائمة المكافآت |
| POST | `/api/loyalty/rewards` | إنشاء مكافأة |
| GET | `/api/loyalty/tiers` | إعدادات المستويات |
| PUT | `/api/loyalty/tiers/:id` | تحديث مستوى |
| POST | `/api/loyalty/calculate` | حساب النقاط (معاينة) |

## 📁 هيكل الملفات

```
src/
├── modules/
│   └── loyalty/
│       ├── components/
│       │   ├── LoyaltySettingsPage.tsx     # إعدادات النظام
│       │   ├── LoyaltyAccountsPage.tsx     # الحسابات
│       │   ├── LoyaltyAccountDetails.tsx   # تفاصيل حساب
│       │   ├── LoyaltyRewardsPage.tsx      # المكافآت
│       │   ├── RewardForm.tsx              # نموذج مكافأة
│       │   ├── TierConfigPage.tsx          # إعدادات المستويات
│       │   ├── LoyaltyStats.tsx            # إحصائيات
│       │   ├── PointsDisplay.tsx           # عرض النقاط (POS)
│       │   ├── RedeemDialog.tsx            # حوار الاستبدال
│       │   └── TierBadge.tsx               # شارة المستوى
│       ├── hooks/
│       │   ├── useLoyalty.ts               # هوك عام
│       │   ├── useLoyaltyAccount.ts        # هوك الحساب
│       │   └── useLoyaltyActions.ts        # هوك الإجراءات
│       ├── lib/
│       │   ├── pointsCalculator.ts         # حاسبة النقاط
│       │   ├── tierManager.ts              # مدير المستويات
│       │   └── expiryManager.ts            # مدير الانتهاء
│       ├── types/
│       │   └── index.ts
│       └── index.ts
├── app/
│   └── api/
│       └── loyalty/
│           ├── settings/route.ts
│           ├── accounts/
│           │   ├── route.ts
│           │   └── [id]/route.ts
│           ├── customer/[id]/route.ts
│           ├── earn/route.ts
│           ├── redeem/route.ts
│           ├── adjust/route.ts
│           ├── transactions/route.ts
│           ├── rewards/
│           │   ├── route.ts
│           │   └── [id]/route.ts
│           ├── tiers/route.ts
│           └── calculate/route.ts
```

## 📅 الجدول الزمني

| المرحلة | المدة | المهام |
|---------|-------|--------|
| 1. قاعدة البيانات | يوم واحد | Models + Migration |
| 2. منطق النقاط | يومان | حاسبة + مدير المستويات |
| 3. الـ APIs | يومان | جميع الـ endpoints |
| 4. واجهة الإعدادات | يومان | صفحات الإدارة |
| 5. تكامل POS | يوم واحد | عرض النقاط + الاستبدال |
| 6. الاختبار | يوم واحد | اختبار شامل |
| **المجموع** | **9 أيام** | |

## 🔗 الاعتماديات
- ✅ نظام العملاء (موجود)
- ✅ نظام الفواتير (موجود)
- ✅ نظام المنتجات (موجود)

---

# 3. التقارير المجدولة

## 📌 الوصف
نظام لإرسال التقارير تلقائياً عبر البريد الإلكتروني في أوقات محددة.

## 🎯 الأهداف
- توفير الوقت على المدراء
- إبقاء أصحاب القرار على اطلاع دائم
- أرشفة تلقائية للتقارير

## 📊 مخطط قاعدة البيانات

```prisma
// prisma/schema.prisma

// ==================== التقارير المجدولة ====================
model ScheduledReport {
  id              String              @id @default(cuid())
  name            String
  nameAr          String
  
  // نوع التقرير
  reportType      ScheduledReportType
  
  // الجدولة
  frequency       ReportFrequency
  scheduledTime   String              // HH:mm format
  scheduledDay    Int?                // يوم الأسبوع/الشهر
  timezone        String              @default("Asia/Riyadh")
  
  // المستلمون
  recipients      String              // JSON array of emails
  ccRecipients    String?             // JSON array
  bccRecipients   String?             // JSON array
  
  // الفلاتر
  filters         String?             // JSON filters
  branchIds       String?             // JSON array of branch IDs
  
  // إعدادات التنسيق
  format          ReportFormat        @default(PDF)
  includeCharts   Boolean             @default(true)
  includeSummary  Boolean             @default(true)
  
  // الحالة
  isActive        Boolean             @default(true)
  lastRunAt       DateTime?
  nextRunAt       DateTime?
  lastError       String?
  
  // المالك
  createdBy       String
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  user            User                @relation(fields: [createdBy], references: [id])
  history         ReportHistory[]
}

// ==================== سجل التقارير ====================
model ReportHistory {
  id              String          @id @default(cuid())
  scheduledReportId String
  
  // التنفيذ
  executedAt      DateTime        @default(now())
  status          ReportStatus
  duration        Int?            // milliseconds
  
  // النتيجة
  fileName        String?
  fileSize        Int?
  filePath        String?
  error           String?
  
  // الإرسال
  emailsSent      Int             @default(0)
  emailsFailed    Int             @default(0)
  
  report          ScheduledReport @relation(fields: [scheduledReportId], references: [id])
}

enum ScheduledReportType {
  SALES_SUMMARY        // ملخص المبيعات
  SALES_DETAILED       // مبيعات تفصيلي
  PRODUCTS_SALES       // مبيعات المنتجات
  INVENTORY_STATUS     // حالة المخزون
  LOW_STOCK_ALERT      // تنبيه المخزون المنخفض
  SHIFT_REPORT         // تقرير الورديات
  EXPENSE_SUMMARY      // ملخص المصروفات
  CUSTOMER_ACTIVITY    // نشاط العملاء
  PROFIT_REPORT        // تقرير الأرباح
  TAX_REPORT           // تقرير الضرائب
}

enum ReportFrequency {
  DAILY           // يومي
  WEEKLY          // أسبوعي
  BIWEEKLY        // كل أسبوعين
  MONTHLY         // شهري
  QUARTERLY       // ربع سنوي
}

enum ReportFormat {
  PDF
  EXCEL
  CSV
}

enum ReportStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}
```

## 🔌 APIs المطلوبة

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/scheduled-reports` | قائمة التقارير |
| GET | `/api/scheduled-reports/:id` | تفاصيل تقرير |
| POST | `/api/scheduled-reports` | إنشاء تقرير مجدول |
| PUT | `/api/scheduled-reports/:id` | تحديث تقرير |
| DELETE | `/api/scheduled-reports/:id` | حذف تقرير |
| POST | `/api/scheduled-reports/:id/run` | تشغيل فوري |
| GET | `/api/scheduled-reports/:id/history` | سجل التنفيذ |
| GET | `/api/scheduled-reports/:id/preview` | معاينة التقرير |
| POST | `/api/scheduled-reports/test-email` | اختبار الإرسال |

## 📁 هيكل الملفات

```
src/
├── modules/
│   └── scheduled-reports/
│       ├── components/
│       │   ├── ScheduledReportsPage.tsx    # الصفحة الرئيسية
│       │   ├── ScheduledReportForm.tsx     # نموذج الإنشاء
│       │   ├── ReportHistoryPage.tsx       # سجل التنفيذ
│       │   ├── RecipientsInput.tsx         # حقل المستلمين
│       │   ├── ScheduleConfig.tsx          # إعدادات الجدولة
│       │   ├── ReportFilters.tsx           # فلاتر التقرير
│       │   └── ReportPreviewDialog.tsx     # معاينة التقرير
│       ├── lib/
│       │   ├── reportGenerator.ts          # مولد التقارير
│       │   ├── emailSender.ts              # مرسل البريد
│       │   ├── scheduler.ts                # المجدول
│       │   └── templates/
│       │       ├── salesSummary.ts         # قالب مبيعات
│       │       ├── inventoryStatus.ts      # قالب مخزون
│       │       └── ...                     # قوالب أخرى
│       ├── hooks/
│       │   └── useScheduledReports.ts
│       ├── types/
│       │   └── index.ts
│       └── index.ts
├── app/
│   └── api/
│       └── scheduled-reports/
│           ├── route.ts
│           ├── [id]/
│           │   ├── route.ts
│           │   ├── run/route.ts
│           │   ├── history/route.ts
│           │   └── preview/route.ts
│           └── test-email/route.ts
├── cron/                    # مهام مجدولة
│   └── reports.ts           # تشغيل التقارير
```

## 📧 قالب البريد الإلكتروني

```html
<!-- نموذج قالب البريد -->
<!DOCTYPE html>
<html dir="rtl">
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; }
    .header { background: #10b981; color: white; padding: 20px; }
    .content { padding: 20px; }
    .summary { background: #f3f4f6; padding: 15px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{reportTitle}}</h1>
    <p>{{period}}</p>
  </div>
  <div class="content">
    <div class="summary">
      <!-- ملخص التقرير -->
    </div>
    <!-- محتوى التقرير -->
  </div>
</body>
</html>
```

## 📅 الجدول الزمني

| المرحلة | المدة | المهام |
|---------|-------|--------|
| 1. قاعدة البيانات | نصف يوم | Models + Migration |
| 2. نظام الإيميل | يوم واحد | تكوين SMTP + قوالب |
| 3. مولد التقارير | يومان | PDF/Excel generation |
| 4. المجدول (Cron) | يوم واحد | تشغيل تلقائي |
| 5. واجهة المستخدم | يومان | صفحات الإدارة |
| 6. الاختبار | نصف يوم | اختبار شامل |
| **المجموع** | **6 أيام** | |

## 🔗 الاعتماديات
- ✅ نظام التقارير (موجود)
- ⚠️ خدمة البريد (تحتاج تكوين SMTP)
- ✅ نظام الفروع (موجود)

---

# 4. العروض التلقائية

## 📌 الوصف
نظام متقدم لإنشاء وإدارة العروض والتخفيضات التلقائية.

## 🎯 الأهداف
- زيادة المبيعات
- تصريف المخزون
- جذب عملاء جدد

## 📊 مخطط قاعدة البيانات

```prisma
// prisma/schema.prisma

// ==================== العروض الترويجية ====================
model Promotion {
  id              String            @id @default(cuid())
  name            String
  nameAr          String
  description     String?
  
  // نوع العرض
  type            PromotionType
  
  // الفترة الزمنية
  startDate       DateTime
  endDate         DateTime
  
  // شروط الاستحقاق
  conditions      PromotionConditions
  
  // المكافأة
  reward          PromotionReward
  
  // نطاق التطبيق
  applicability   PromotionApplicability
  
  // الحالة
  status          PromotionStatus  @default(DRAFT)
  priority        Int              @default(0)
  
  // الحدود
  maxUses         Int?             // أقصى عدد استخدامات
  maxUsesPerCustomer Int?          // أقصى استخدامات لعميل
  currentUses     Int              @default(0)
  
  // التتبع
  usageCount      Int              @default(0)
  totalDiscount   Float            @default(0)
  
  createdBy       String
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  user            User             @relation(fields: [createdBy], references: [id])
  usages          PromotionUsage[]
}

// ==================== شروط العرض ====================
model PromotionConditions {
  id              String      @id @default(cuid())
  promotionId     String      @unique
  
  // الحد الأدنى
  minPurchaseAmount Float?
  minQuantity       Int?
  minCategories     String?    // JSON array
  
  // المنتجات المستهدفة
  productIds        String?    // JSON array
  categoryIds       String?    // JSON array
  brandIds          String?    // JSON array
  
  // العملاء المستهدفون
  customerIds       String?    // JSON array
  customerGroups    String?    // JSON array: NEW, LOYAL, VIP
  loyaltyTiers      String?    // JSON array
  
  // أيام وأوقات العمل
  activeDays        String?    // JSON array: [0,1,2,3,4,5,6]
  startTime         String?    // HH:mm
  endTime           String?    // HH:mm
  
  // فروع محددة
  branchIds         String?    // JSON array
  
  // كود الخصم
  couponCode        String?    @unique
  couponRequired    Boolean    @default(false)
  
  promotion         Promotion  @relation(fields: [promotionId], references: [id])
}

// ==================== مكافأة العرض ====================
model PromotionReward {
  id              String          @id @default(cuid())
  promotionId     String          @unique
  
  // نوع المكافأة
  type            RewardType
  
  // خصم نسبة
  discountPercent Float?
  maxDiscount     Float?          // أقصى مبلغ خصم
  
  // خصم مبلغ
  discountAmount  Float?
  
  // اشترِ X احصل على Y
  buyQuantity     Int?
  getQuantity     Int?
  getDiscountPercent Float?
  
  // منتج مجاني
  freeProductIds  String?         // JSON array
  
  // نقاط ولاء
  bonusPoints     Int?
  
  promotion       Promotion       @relation(fields: [promotionId], references: [id])
}

// ==================== نطاق التطبيق ====================
model PromotionApplicability {
  id              String      @id @default(cuid())
  promotionId     String      @unique
  
  applyTo         ApplyToType // ALL, PRODUCTS, CATEGORIES, BRANDS
  
  productIds      String?     // JSON array
  categoryIds     String?     // JSON array
  brandIds        String?     // JSON array
  
  excludeSaleItems Boolean   @default(false)
  
  promotion       Promotion  @relation(fields: [promotionId], references: [id])
}

// ==================== استخدام العرض ====================
model PromotionUsage {
  id              String      @id @default(cuid())
  promotionId     String
  invoiceId       String
  customerId      String?
  branchId        String
  
  discountApplied Float
  itemsAffected   Int
  
  createdAt       DateTime    @default(now())
  
  promotion       Promotion   @relation(fields: [promotionId], references: [id])
  invoice         Invoice     @relation(fields: [invoiceId], references: [id])
  customer        Customer?   @relation(fields: [customerId], references: [id])
  branch          Branch      @relation(fields: [branchId], references: [id])
}

enum PromotionType {
  PERCENTAGE_DISCOUNT    // خصم نسبة
  FIXED_DISCOUNT         // خصم مبلغ ثابت
  BUY_X_GET_Y            // اشترِ X احصل على Y
  BUNDLE_DEAL            // صفقة مجموعة
  FREE_SHIPPING          // شحن مجاني
  FREE_GIFT              // هدية مجانية
  LOYALTY_BONUS          // مكافأة ولاء
  FLASH_SALE             // عرض سريع
  HAPPY_HOUR             // ساعات سعيدة
  SEASONAL               // موسمي
}

enum PromotionStatus {
  DRAFT          // مسودة
  SCHEDULED      // مجدول
  ACTIVE         // نشط
  PAUSED         // متوقف مؤقتاً
  EXPIRED        // منتهي
  CANCELLED      // ملغي
}

enum ApplyToType {
  ALL            // جميع المنتجات
  PRODUCTS       // منتجات محددة
  CATEGORIES     // فئات محددة
  BRANDS         // ماركات محددة
}
```

## 🔌 APIs المطلوبة

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/promotions` | قائمة العروض |
| GET | `/api/promotions/:id` | تفاصيل عرض |
| POST | `/api/promotions` | إنشاء عرض |
| PUT | `/api/promotions/:id` | تحديث عرض |
| DELETE | `/api/promotions/:id` | حذف عرض |
| POST | `/api/promotions/:id/activate` | تفعيل عرض |
| POST | `/api/promotions/:id/pause` | إيقاف مؤقت |
| GET | `/api/promotions/active` | العروض النشطة |
| POST | `/api/promotions/validate` | التحقق من صلاحية العرض |
| POST | `/api/promotions/apply` | تطبيق العرض على السلة |
| GET | `/api/promotions/:id/stats` | إحصائيات العرض |
| GET | `/api/promotions/coupons/:code` | التحقق من كود الخصم |

## 📁 هيكل الملفات

```
src/
├── modules/
│   └── promotions/
│       ├── components/
│       │   ├── PromotionsPage.tsx          # الصفحة الرئيسية
│       │   ├── PromotionForm.tsx           # نموذج الإنشاء
│       │   ├── PromotionDetails.tsx        # تفاصيل العرض
│       │   ├── ConditionsBuilder.tsx       # منشئ الشروط
│       │   ├── RewardBuilder.tsx           # منشئ المكافأة
│       │   ├── ApplicabilitySelector.tsx   # نطاق التطبيق
│       │   ├── PromotionStats.tsx          # إحصائيات
│       │   ├── CouponInput.tsx             # حقل الكود (POS)
│       │   ├── ActivePromotions.tsx        # العروض النشطة (POS)
│       │   └── PromotionBadge.tsx          # شارة العرض
│       ├── lib/
│       │   ├── promotionEngine.ts          # محرك العروض
│       │   ├── conditionChecker.ts         # مدقق الشروط
│       │   ├── rewardCalculator.ts         # حاسبة المكافآت
│       │   └── couponGenerator.ts          # مولد الأكواد
│       ├── hooks/
│       │   ├── usePromotions.ts
│       │   └── usePromotionValidation.ts
│       ├── types/
│       │   └── index.ts
│       └── index.ts
├── app/
│   └── api/
│       └── promotions/
│           ├── route.ts
│           ├── [id]/
│           │   ├── route.ts
│           │   ├── activate/route.ts
│           │   ├── pause/route.ts
│           │   └── stats/route.ts
│           ├── active/route.ts
│           ├── validate/route.ts
│           ├── apply/route.ts
│           └── coupons/[code]/route.ts
```

## 🧮 محرك العروض

```typescript
// lib/promotionEngine.ts

interface PromotionResult {
  promotionId: string;
  discountAmount: number;
  affectedItems: CartItem[];
  message: string;
}

export class PromotionEngine {
  // البحث عن العروض القابلة للتطبيق
  findApplicablePromotions(cart: Cart, customer?: Customer): Promotion[] { }
  
  // التحقق من الشروط
  checkConditions(promotion: Promotion, context: PromotionContext): boolean { }
  
  // حساب الخصم
  calculateDiscount(promotion: Promotion, cart: Cart): PromotionResult { }
  
  // تطبيق أفضل العروض
  applyBestPromotion(cart: Cart): PromotionResult { }
  
  // تطبيق جميع العروض المتراكمة
  applyStackablePromotions(cart: Cart): PromotionResult[] { }
}
```

## 📅 الجدول الزمني

| المرحلة | المدة | المهام |
|---------|-------|--------|
| 1. قاعدة البيانات | يوم واحد | Models + Migration |
| 2. محرك العروض | يومان | منطق التحقق والحساب |
| 3. الـ APIs | يومان | جميع الـ endpoints |
| 4. واجهة الإدارة | يومان | صفحات الإدارة |
| 5. تكامل POS | يوم واحد | تطبيق العروض |
| 6. الاختبار | يوم واحد | اختبار شامل |
| **المجموع** | **8 أيام** | |

---

# 5. الجرد الدوري

## 📌 الوصف
نظام شامل للجرد الدوري والسنوي مع تسويات المخزون.

## 🎯 الأهداف
- دقة المخزون
- اكتشاف الفروقات
- التسوية الآلية

## 📊 مخطط قاعدة البيانات

```prisma
// prisma/schema.prisma

// ==================== عمليات الجرد ====================
model StockTake {
  id              String            @id @default(cuid())
  stockTakeNumber String            @unique
  branchId        String
  
  // النوع والميعاد
  type            StockTakeType     @default(FULL)
  scheduledDate   DateTime
  startedAt       DateTime?
  completedAt     DateTime?
  
  // الحالة
  status          StockTakeStatus   @default(DRAFT)
  
  // المسؤولون
  createdBy       String
  supervisorId    String?
  approvedBy      String?
  
  // النطاق
  categoryIds     String?           // JSON array - للجرد الجزئي
  productIds      String?           // JSON array
  
  // الملخص
  totalItems      Int               @default(0)
  countedItems    Int               @default(0)
  varianceItems   Int               @default(0)
  
  // القيم
  expectedValue   Float             @default(0)
  actualValue     Float             @default(0)
  varianceValue   Float             @default(0)
  
  // ملاحظات
  notes           String?
  varianceNotes   String?
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  branch          Branch            @relation(fields: [branchId], references: [id])
  creator         User              @relation("StockTakeCreator", fields: [createdBy], references: [id])
  supervisor      User?             @relation("StockTakeSupervisor", fields: [supervisorId], references: [id])
  approver        User?             @relation("StockTakeApprover", fields: [approvedBy], references: [id])
  items           StockTakeItem[]
  adjustments     StockAdjustment[]
}

// ==================== عناصر الجرد ====================
model StockTakeItem {
  id              String        @id @default(cuid())
  stockTakeId     String
  productId       String
  variantId       String?
  
  // الكميات
  systemQuantity  Int           // الكمية في النظام
  countedQuantity Int?          // الكمية الفعلية
  variance        Int?          // الفرق
  
  // أسعار التكلفة
  costPrice       Float
  varianceCost    Float?
  
  // الحالة
  status          ItemCountStatus @default(PENDING)
  
  // التعدادات (للمراجعة)
  count1          Int?
  count1By        String?
  count1At        DateTime?
  count2          Int?
  count2By        String?
  count2At        DateTime?
  count3          Int?
  count3By        String?
  count3At        DateTime?
  
  // ملاحظات
  notes           String?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  stockTake       StockTake     @relation(fields: [stockTakeId], references: [id], onDelete: Cascade)
  product         Product       @relation(fields: [productId], references: [id])
  variant         ProductVariant? @relation(fields: [variantId], references: [id])
  
  @@unique([stockTakeId, productId, variantId])
}

// ==================== تسويات المخزون ====================
model StockAdjustment {
  id                String              @id @default(cuid())
  adjustmentNumber  String              @unique
  
  // المرجع
  stockTakeId       String?
  type              AdjustmentType
  
  // التفاصيل
  branchId          String
  productId         String
  variantId         String?
  
  // الكميات
  previousQuantity  Int
  adjustmentQuantity Int                // موجب = إضافة، سالب = خصم
  newQuantity       Int
  
  // التكلفة
  costPrice         Float
  adjustmentValue   Float
  
  // السبب
  reason            AdjustmentReason
  notes             String?
  
  // الاعتماد
  status            AdjustmentStatus    @default(PENDING)
  requestedBy       String
  approvedBy        String?
  approvedAt        DateTime?
  
  createdAt         DateTime            @default(now())
  
  stockTake         StockTake?          @relation(fields: [stockTakeId], references: [id])
  branch            Branch              @relation(fields: [branchId], references: [id])
  product           Product             @relation(fields: [productId], references: [id])
  variant           ProductVariant?     @relation(fields: [variantId], references: [id])
  requester         User                @relation("AdjustmentRequester", fields: [requestedBy], references: [id])
  approver          User?               @relation("AdjustmentApprover", fields: [approvedBy], references: [id])
}

enum StockTakeType {
  FULL            // جرد شامل
  PARTIAL         // جرد جزئي
  CYCLE           // جرد دوري
  SPOT_CHECK      // جرد مفاجئ
}

enum StockTakeStatus {
  DRAFT           // مسودة
  SCHEDULED       // مجدول
  IN_PROGRESS     // جاري
  PENDING_REVIEW  // في انتظار المراجعة
  COMPLETED       // مكتمل
  CANCELLED       // ملغي
}

enum ItemCountStatus {
  PENDING         // في الانتظار
  COUNTED         // معدود
  VERIFIED        // موثق
  VARIANCE        // به فرق
}

enum AdjustmentType {
  STOCK_TAKE      // جرد
  DAMAGE          // تلف
  THEFT           // سرقة
  EXPIRY          // انتهاء صلاحية
  RETURN          // مرتجع
  TRANSFER_IN     // تحويل وارد
  TRANSFER_OUT    // تحويل صادر
  PRODUCTION      // إنتاج
  MANUAL          // يدوي
}

enum AdjustmentReason {
  STOCK_TAKE_VARIANCE
  DAMAGED_GOODS
  EXPIRED_PRODUCTS
  THEFT_LOSS
  CLERICAL_ERROR
  QUALITY_ISSUE
  SAMPLE_GIVEAWAY
  INTERNAL_USE
  OTHER
}

enum AdjustmentStatus {
  PENDING
  APPROVED
  REJECTED
}
```

## 🔌 APIs المطلوبة

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/stock-takes` | قائمة عمليات الجرد |
| GET | `/api/stock-takes/:id` | تفاصيل جرد |
| POST | `/api/stock-takes` | إنشاء جرد جديد |
| PUT | `/api/stock-takes/:id` | تحديث جرد |
| POST | `/api/stock-takes/:id/start` | بدء الجرد |
| POST | `/api/stock-takes/:id/count` | تسجيل العد |
| POST | `/api/stock-takes/:id/complete` | إكمال الجرد |
| POST | `/api/stock-takes/:id/approve` | اعتماد الجرد |
| GET | `/api/stock-takes/:id/variance` | تقرير الفروقات |
| GET | `/api/stock-adjustments` | قائمة التسويات |
| POST | `/api/stock-adjustments` | إنشاء تسوية |
| POST | `/api/stock-adjustments/:id/approve` | اعتماد تسوية |

## 📁 هيكل الملفات

```
src/
├── modules/
│   └── stock-take/
│       ├── components/
│       │   ├── StockTakesPage.tsx          # قائمة العمليات
│       │   ├── StockTakeForm.tsx           # إنشاء جرد
│       │   ├── StockTakeDetails.tsx        # تفاصيل الجرد
│       │   ├── CountingSheet.tsx           # ورقة العد
│       │   ├── CountingInput.tsx           # إدخال العد
│       │   ├── VarianceReport.tsx          # تقرير الفروقات
│       │   ├── StockAdjustmentsPage.tsx    # التسويات
│       │   ├── AdjustmentForm.tsx          # نموذج تسوية
│       │   └── StockTakeStats.tsx          # إحصائيات
│       ├── hooks/
│       │   ├── useStockTake.ts
│       │   └── useCounting.ts
│       ├── types/
│       │   └── index.ts
│       └── index.ts
├── app/
│   └── api/
│       ├── stock-takes/
│       │   ├── route.ts
│       │   ├── [id]/
│       │   │   ├── route.ts
│       │   │   ├── start/route.ts
│       │   │   ├── count/route.ts
│       │   │   ├── complete/route.ts
│       │   │   ├── approve/route.ts
│       │   │   └── variance/route.ts
│       └── stock-adjustments/
│           ├── route.ts
│           └── [id]/
│               ├── route.ts
│               └── approve/route.ts
```

## 📅 الجدول الزمني

| المرحلة | المدة | المهام |
|---------|-------|--------|
| 1. قاعدة البيانات | يوم واحد | Models + Migration |
| 2. نظام الجرد | يومان | منطق الجرد والعد |
| 3. نظام التسويات | يوم واحد | منطق التسويات |
| 4. الـ APIs | يومان | جميع الـ endpoints |
| 5. واجهة المستخدم | 3 أيام | جميع الصفحات |
| 6. الاختبار | يوم واحد | اختبار شامل |
| **المجموع** | **9 أيام** | |

---

# 6. نظام المشتريات

## 📌 الوصف
نظام متكامل لإدارة المشتريات من الموردين مع الارتباط بالمخازن.

## 🎯 الأهداف
- تنظيم عملية الشراء
- تتبع الطلبيات
- تحديث المخزون تلقائياً

## 📊 مخطط قاعدة البيانات

```prisma
// prisma/schema.prisma

// ==================== طلبات الشراء ====================
model PurchaseOrder {
  id                String              @id @default(cuid())
  orderNumber       String              @unique
  
  // المورد
  supplierId        String
  
  // الفرع المستلم
  receivingBranchId String
  
  // التواريخ
  orderDate         DateTime            @default(now())
  expectedDate      DateTime?
  receivedDate      DateTime?
  
  // الحالة
  status            PurchaseOrderStatus @default(DRAFT)
  
  // المبالغ
  subtotal          Float               @default(0)
  taxAmount         Float               @default(0)
  discountAmount    Float               @default(0)
  totalAmount       Float               @default(0)
  
  // الدفع
  paymentStatus     PaymentStatus       @default(UNPAID)
  paymentTerms      String?             // NET_15, NET_30, COD
  paidAmount        Float               @default(0)
  
  // المستندات
  supplierInvoice   String?             // رقم فاتورة المورد
  supplierInvoiceDate DateTime?
  attachments       String?             // JSON array
  
  // المسؤولون
  createdBy         String
  approvedBy        String?
  approvedAt        DateTime?
  receivedBy        String?
  
  // ملاحظات
  notes             String?
  internalNotes     String?
  
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  supplier          Supplier            @relation(fields: [supplierId], references: [id])
  receivingBranch   Branch              @relation(fields: [receivingBranchId], references: [id])
  creator           User                @relation("POCreator", fields: [createdBy], references: [id])
  approver          User?               @relation("POApprover", fields: [approvedBy], references: [id])
  receiver          User?               @relation("POReceiver", fields: [receivedBy], references: [id])
  items             PurchaseOrderItem[]
  receivings        PurchaseReceiving[]
  payments          PurchasePayment[]
}

// ==================== عناصر طلب الشراء ====================
model PurchaseOrderItem {
  id                String        @id @default(cuid())
  purchaseOrderId   String
  productId         String?
  variantId         String?
  
  // الوصف (للمنتجات غير المسجلة)
  description       String?
  
  // الكميات
  orderedQuantity   Int
  receivedQuantity  Int           @default(0)
  pendingQuantity   Int           @default(0)
  
  // الأسعار
  unitCost          Float
  taxRate           Float         @default(0)
  discountPercent   Float         @default(0)
  totalCost         Float
  
  // تواريخ الانتهاء (للمنتجات القابلة للتلف)
  expiryDate        DateTime?
  batchNumber       String?
  
  notes             String?
  
  createdAt         DateTime      @default(now())
  
  purchaseOrder     PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  product           Product?      @relation(fields: [productId], references: [id])
  variant           ProductVariant? @relation(fields: [variantId], references: [id])
  receivings        ReceivingItem[]
}

// ==================== استلام المشتريات ====================
model PurchaseReceiving {
  id                String          @id @default(cuid())
  receivingNumber   String          @unique
  purchaseOrderId   String
  branchId          String
  
  // التاريخ
  receivedAt        DateTime        @default(now())
  
  // الحالة
  status            ReceivingStatus @default(PARTIAL)
  
  // القيم
  totalReceived     Float           @default(0)
  
  // المسؤول
  receivedBy        String
  notes             String?
  
  createdAt         DateTime        @default(now())
  
  purchaseOrder     PurchaseOrder   @relation(fields: [purchaseOrderId], references: [id])
  branch            Branch          @relation(fields: [branchId], references: [id])
  receiver          User            @relation(fields: [receivedBy], references: [id])
  items             ReceivingItem[]
}

// ==================== عناصر الاستلام ====================
model ReceivingItem {
  id                String            @id @default(cuid())
  receivingId       String
  orderItemId       String
  
  // الكمية المستلمة
  quantity          Int
  quantityAccepted  Int
  quantityRejected  Int
  
  // سبب الرفض
  rejectionReason   String?
  
  // معلومات إضافية
  expiryDate        DateTime?
  batchNumber       String?
  
  createdAt         DateTime          @default(now())
  
  receiving         PurchaseReceiving @relation(fields: [receivingId], references: [id], onDelete: Cascade)
  orderItem         PurchaseOrderItem @relation(fields: [orderItemId], references: [id])
}

// ==================== مدفوعات المشتريات ====================
model PurchasePayment {
  id                String          @id @default(cuid())
  purchaseOrderId   String
  paymentNumber     String
  
  amount            Float
  paymentMethod     String
  reference         String?
  paymentDate       DateTime        @default(now())
  
  notes             String?
  
  createdAt         DateTime        @default(now())
  
  purchaseOrder     PurchaseOrder   @relation(fields: [purchaseOrderId], references: [id])
}

// ==================== إرجاع المشتريات ====================
model PurchaseReturn {
  id                String            @id @default(cuid())
  returnNumber      String            @unique
  purchaseOrderId   String
  supplierId        String
  branchId          String
  
  returnType        ReturnReason
  status            ReturnStatus      @default(DRAFT)
  
  totalAmount       Float             @default(0)
  
  returnedAt        DateTime?
  receivedBy        String?
  
  notes             String?
  
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  purchaseOrder     PurchaseOrder     @relation(fields: [purchaseOrderId], references: [id])
  supplier          Supplier          @relation(fields: [supplierId], references: [id])
  branch            Branch            @relation(fields: [branchId], references: [id])
  items             PurchaseReturnItem[]
}

model PurchaseReturnItem {
  id                String          @id @default(cuid())
  returnId          String
  productId         String
  variantId         String?
  
  quantity          Int
  unitCost          Float
  totalCost         Float
  
  reason            String?
  
  createdAt         DateTime        @default(now())
  
  purchaseReturn    PurchaseReturn  @relation(fields: [returnId], references: [id], onDelete: Cascade)
  product           Product         @relation(fields: [productId], references: [id])
  variant           ProductVariant? @relation(fields: [variantId], references: [id])
}

enum PurchaseOrderStatus {
  DRAFT           // مسودة
  PENDING         // في انتظار الاعتماد
  APPROVED        // معتمد
  ORDERED         // تم الطلب من المورد
  PARTIAL         // استلام جزئي
  RECEIVED        // مستلم بالكامل
  CANCELLED       // ملغي
}

enum ReceivingStatus {
  PARTIAL         // جزئي
  COMPLETED       // مكتمل
  CANCELLED       // ملغي
}

enum ReturnReason {
  DEFECTIVE       // معيب
  WRONG_ITEM      // صنف خطأ
  DAMAGED         // تالف
  EXPIRED         // منتهي الصلاحية
  OVERSTOCK       // زيادة كمية
  QUALITY_ISSUE   // مشكلة جودة
  OTHER           // أخرى
}

enum ReturnStatus {
  DRAFT
  PENDING
  APPROVED
  COMPLETED
  CANCELLED
}
```

## 🔌 APIs المطلوبة

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/purchase-orders` | قائمة طلبات الشراء |
| GET | `/api/purchase-orders/:id` | تفاصيل طلب |
| POST | `/api/purchase-orders` | إنشاء طلب جديد |
| PUT | `/api/purchase-orders/:id` | تحديث طلب |
| POST | `/api/purchase-orders/:id/submit` | تقديم للاعتماد |
| POST | `/api/purchase-orders/:id/approve` | اعتماد الطلب |
| POST | `/api/purchase-orders/:id/receive` | استلام البضاعة |
| POST | `/api/purchase-orders/:id/cancel` | إلغاء الطلب |
| GET | `/api/purchase-orders/:id/receivings` | سجل الاستلام |
| POST | `/api/purchase-receivings` | تسجيل استلام |
| GET | `/api/purchase-payments` | المدفوعات |
| POST | `/api/purchase-payments` | تسجيل دفعة |
| GET | `/api/purchase-returns` | المرتجعات |
| POST | `/api/purchase-returns` | إنشاء مرتجع |
| GET | `/api/suppliers/:id/orders` | طلبات مورد |

## 📁 هيكل الملفات

```
src/
├── modules/
│   └── purchases/
│       ├── components/
│       │   ├── PurchaseOrdersPage.tsx     # قائمة الطلبات
│       │   ├── PurchaseOrderForm.tsx      # نموذج الطلب
│       │   ├── PurchaseOrderDetails.tsx   # تفاصيل الطلب
│       │   ├── ReceivingDialog.tsx        # حوار الاستلام
│       │   ├── PurchaseReceivingsPage.tsx # سجل الاستلام
│       │   ├── PurchasePaymentsPage.tsx   # المدفوعات
│       │   ├── PaymentDialog.tsx          # حوار الدفع
│       │   ├── PurchaseReturnsPage.tsx    # المرتجعات
│       │   ├── ReturnForm.tsx             # نموذج الإرجاع
│       │   ├── SupplierOrdersWidget.tsx   # طلبات المورد
│       │   └── PurchaseStats.tsx          # إحصائيات
│       ├── hooks/
│       │   ├── usePurchaseOrders.ts
│       │   ├── useReceiving.ts
│       │   └── usePurchasePayments.ts
│       ├── types/
│       │   └── index.ts
│       └── index.ts
├── app/
│   └── api/
│       ├── purchase-orders/
│       │   ├── route.ts
│       │   ├── [id]/
│       │   │   ├── route.ts
│       │   │   ├── submit/route.ts
│       │   │   ├── approve/route.ts
│       │   │   ├── receive/route.ts
│       │   │   ├── cancel/route.ts
│       │   │   └── receivings/route.ts
│       ├── purchase-receivings/
│       │   └── route.ts
│       ├── purchase-payments/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       └── purchase-returns/
│           ├── route.ts
│           └── [id]/route.ts
```

## 📅 الجدول الزمني

| المرحلة | المدة | المهام |
|---------|-------|--------|
| 1. قاعدة البيانات | يوم واحد | Models + Migration |
| 2. نظام الطلبات | يومان | إنشاء وإدارة الطلبات |
| 3. نظام الاستلام | يومان | استلام وتحديث المخزون |
| 4. نظام المدفوعات | يوم واحد | تسجيل الدفعات |
| 5. نظام المرتجعات | يوم واحد | إرجاع للمورد |
| 6. الـ APIs | يومان | جميع الـ endpoints |
| 7. واجهة المستخدم | 3 أيام | جميع الصفحات |
| 8. الاختبار | يوم واحد | اختبار شامل |
| **المجموع** | **12 يوم** | |

---

# 7. نظام طباعة وتصميم الفواتير

## 📌 الوصف
نظام متقدم لتصميم وطباعة الفواتير الحرارية والعادية.

## 🎯 الأهداف
- مرونة في التصميم
- دعم متعدد للطابعات
- طباعة احترافية

## 📊 مخطط قاعدة البيانات

```prisma
// prisma/schema.prisma (تحديث النموذج الموجود)

// ==================== قوالب الفواتير (محدث) ====================
model ReceiptTemplate {
  id                String   @id @default(cuid())
  name              String
  nameAr            String?
  type              ReceiptType @default(INVOICE)
  branchId          String?
  
  // أبعاد الورق
  paperWidth        Int      @default(80)    // mm
  paperType         PaperType @default(THERMAL)
  
  // إعدادات الخطوط
  fontFamily        String   @default("monospace")
  fontSizeSmall     Int      @default(10)
  fontSizeNormal    Int      @default(12)
  fontSizeLarge     Int      @default(14)
  fontSizeTitle     Int      @default(18)
  fontSizeTotal     Int      @default(16)
  fontBold          Boolean  @default(true)
  
  // إعدادات الـ Header
  showLogo          Boolean  @default(true)
  logoAlignment     Alignment @default(CENTER)
  logoMaxWidth      Int      @default(200)   // px
  logoMaxHeight     Int      @default(80)    // px
  showCompanyName   Boolean  @default(true)
  companyNameStyle  TextStyle @default(BOLD_LARGE)
  showBranchName    Boolean  @default(true)
  showBranchAddress Boolean  @default(true)
  showBranchPhone   Boolean  @default(true)
  showTaxNumber     Boolean  @default(true)
  headerAlignment   Alignment @default(CENTER)
  headerSpacing     Int      @default(2)
  
  // إعدادات الـ Body
  showSku           Boolean  @default(false)
  showProductName   Boolean  @default(true)
  showVariant       Boolean  @default(true)
  showQuantity      Boolean  @default(true)
  showUnitPrice     Boolean  @default(true)
  showDiscount      Boolean  @default(true)
  showTax           Boolean  @default(true)
  showLineTotal     Boolean  @default(true)
  showBarcode       Boolean  @default(false)
  productAlignment  Alignment @default(RIGHT)
  showProductNotes  Boolean  @default(false)
  
  // إعدادات الـ Totals
  showSubtotal      Boolean  @default(true)
  showDiscountTotal Boolean  @default(true)
  showTaxTotal      Boolean  @default(true)
  showTaxBreakdown  Boolean  @default(false)
  showTotal         Boolean  @default(true)
  showPaid          Boolean  @default(true)
  showChange        Boolean  @default(true)
  totalsAlignment   Alignment @default(RIGHT)
  totalsBoxStyle    BoxStyle @default(LINE)
  
  // إعدادات الـ Footer
  showThankYou      Boolean  @default(true)
  thankYouMessage   String   @default("شكراً لزيارتكم")
  showReturnPolicy  Boolean  @default(false)
  returnPolicyText  String?
  showQRCode        Boolean  @default(false)
  qrCodeSize        Int      @default(80)
  qrCodeContent     QRContent @default(INVOICE_LINK)
  showInvoiceBarcode Boolean @default(true)
  showDateTime      Boolean  @default(true)
  showCashier       Boolean  @default(true)
  showInvoiceNumber Boolean  @default(true)
  showShiftNumber   Boolean  @default(false)
  footerAlignment   Alignment @default(CENTER)
  
  // إعدادات متقدمة
  showSeparator     Boolean  @default(true)
  separatorChar     String   @default("-")
  separatorStyle    SeparatorStyle @default(SINGLE)
  marginTop         Int      @default(0)
  marginBottom      Int      @default(0)
  marginLeft        Int      @default(0)
  marginRight       Int      @default(0)
  lineSpacing       Int      @default(1)
  showBorder        Boolean  @default(false)
  
  // Custom HTML/CSS
  customCSS         String?
  customHeader      String?  // Custom HTML
  customFooter      String?  // Custom HTML
  
  // حالات
  isDefault         Boolean  @default(false)
  isActive          Boolean  @default(true)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// ==================== إعدادات الطباعة للفرع ====================
model BranchPrintConfig {
  id                    String   @id @default(cuid())
  branchId              String   @unique
  
  // قوالب افتراضية
  invoiceTemplateId     String?
  returnTemplateId      String?
  shiftCloseTemplateId  String?
  expenseTemplateId     String?
  
  // إعدادات الطابعة
  printerName           String?
  printerType           PrinterType @default(THERMAL)
  connectionType        ConnectionType @default(USB)
  printerIp             String?
  printerPort           Int?
  
  // خيارات الطباعة
  autoPrintInvoice      Boolean  @default(true)
  autoPrintReturn       Boolean  @default(true)
  printCopies           Int      @default(1)
  openCashDrawer        Boolean  @default(true)
  cutPaper              Boolean  @default(true)
  
  // إعدادات متقدمة
  printDelay            Int      @default(500)  // ms
  retryAttempts         Int      @default(3)
  paperSaveMode         Boolean  @default(false)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

// ==================== سجل الطباعة ====================
model PrintLog {
  id              String      @id @default(cuid())
  templateId      String?
  branchId        String
  userId          String
  type            PrintType
  referenceId     String?
  referenceNumber String?
  printMethod     PrintMethod
  
  copies          Int         @default(1)
  success         Boolean     @default(true)
  errorMessage    String?
  printDuration   Int?        // ms
  
  printedAt       DateTime    @default(now())
}

enum ReceiptType {
  INVOICE         // فاتورة بيع
  RETURN          // فاتورة مرتجع
  SHIFT_CLOSE     // تقرير إغلاق وردية
  EXPENSE         // إيصال مصروف
  QUOTE           // عرض سعر
  ORDER           // طلب
}

enum PaperType {
  THERMAL         // حراري
  A4              // A4
  A5              // A5
  CUSTOM          // مخصص
}

enum Alignment {
  LEFT
  CENTER
  RIGHT
}

enum TextStyle {
  NORMAL
  BOLD
  BOLD_LARGE
  UNDERLINE
}

enum BoxStyle {
  NONE
  LINE
  DOUBLE_LINE
  DASHED
}

enum QRContent {
  INVOICE_LINK
  INVOICE_DATA
  COMPANY_INFO
  CUSTOM
}

enum SeparatorStyle {
  SINGLE
  DOUBLE
  DASHED
  DOTTED
  EQUALS
}

enum PrinterType {
  THERMAL
  LASER
  INKJET
  DOT_MATRIX
}

enum ConnectionType {
  USB
  NETWORK
  BLUETOOTH
  SERIAL
}

enum PrintType {
  INVOICE
  RETURN
  SHIFT_CLOSE
  EXPENSE
  REPORT
  BARCODE
  LABEL
}

enum PrintMethod {
  THERMAL
  PDF
  BROWSER
}
```

## 🖨️ محرك الطباعة

```typescript
// lib/printEngine.ts

export class PrintEngine {
  // طباعة حرارية
  async printThermal(template: ReceiptTemplate, data: InvoiceData): Promise<void> { }
  
  // طباعة PDF
  async printPDF(template: ReceiptTemplate, data: InvoiceData): Promise<Blob> { }
  
  // طباعة متصفح
  async printBrowser(template: ReceiptTemplate, data: InvoiceData): Promise<void> { }
  
  // معاينة
  async preview(template: ReceiptTemplate, data: InvoiceData): Promise<string> { }
  
  // إنشاء QR Code
  async generateQRCode(data: string): Promise<string> { }
  
  // فتح درج النقدية
  async openCashDrawer(): Promise<void> { }
  
  // قص الورق
  async cutPaper(): Promise<void> { }
}
```

## 🔌 APIs المطلوبة

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/receipt-templates` | قائمة القوالب |
| GET | `/api/receipt-templates/:id` | تفاصيل قالب |
| POST | `/api/receipt-templates` | إنشاء قالب |
| PUT | `/api/receipt-templates/:id` | تحديث قالب |
| DELETE | `/api/receipt-templates/:id` | حذف قالب |
| POST | `/api/receipt-templates/:id/duplicate` | نسخ قالب |
| POST | `/api/receipt-templates/:id/set-default` | تعيين كافتراضي |
| GET | `/api/receipt-templates/:id/preview` | معاينة القالب |
| POST | `/api/print/invoice/:id` | طباعة فاتورة |
| POST | `/api/print/preview` | معاينة قبل الطباعة |
| POST | `/api/print/test` | اختبار الطابعة |
| GET | `/api/print-config/:branchId` | إعدادات الطباعة |
| PUT | `/api/print-config/:branchId` | تحديث الإعدادات |
| GET | `/api/print-logs` | سجل الطباعة |

## 📁 هيكل الملفات

```
src/
├── modules/
│   └── printing/
│       ├── components/
│       │   ├── ReceiptTemplatesPage.tsx    # قائمة القوالب
│       │   ├── TemplateDesigner.tsx        # مصمم القوالب
│       │   ├── TemplateEditor.tsx          # محرر القالب
│       │   ├── TemplatePreview.tsx         # معاينة حية
│       │   ├── HeaderSettings.tsx          # إعدادات الهيدر
│       │   ├── BodySettings.tsx            # إعدادات المتن
│       │   ├── FooterSettings.tsx          # إعدادات الفوتر
│       │   ├── StyleSettings.tsx           # إعدادات التنسيق
│       │   ├── PrintConfigPage.tsx         # إعدادات الطباعة
│       │   ├── PrinterSettings.tsx         # إعدادات الطابعة
│       │   ├── PrintDialog.tsx             # حوار الطباعة
│       │   └── PrintPreviewDialog.tsx      # معاينة الطباعة
│       ├── lib/
│       │   ├── printEngine.ts              # محرك الطباعة
│       │   ├── thermalPrinter.ts           # طباعة حرارية
│       │   ├── pdfGenerator.ts             # مولد PDF
│       │   ├── qrGenerator.ts              # مولد QR
│       │   └── templateRenderer.ts         # معالج القوالب
│       ├── hooks/
│       │   ├── useTemplates.ts
│       │   └── usePrint.ts
│       ├── types/
│       │   └── index.ts
│       └── index.ts
├── app/
│   └── api/
│       ├── receipt-templates/
│       │   ├── route.ts
│       │   ├── [id]/
│       │   │   ├── route.ts
│       │   │   ├── duplicate/route.ts
│       │   │   ├── set-default/route.ts
│       │   │   └── preview/route.ts
│       ├── print/
│       │   ├── invoice/[id]/route.ts
│       │   ├── preview/route.ts
│       │   └── test/route.ts
│       ├── print-config/
│       │   └── [branchId]/route.ts
│       └── print-logs/
│           └── route.ts
```

## 📅 الجدول الزمني

| المرحلة | المدة | المهام |
|---------|-------|--------|
| 1. قاعدة البيانات | يوم واحد | تحديث Models |
| 2. محرك الطباعة | يومان | الطباعة بجميع أنواعها |
| 3. مولد PDF | يوم واحد | إنشاء PDF |
| 4. مصمم القوالب | 3 أيام | واجهة التصميم |
| 5. الـ APIs | يوم واحد | جميع الـ endpoints |
| 6. تكامل POS | يوم واحد | طباعة من نقطة البيع |
| 7. الاختبار | يوم واحد | اختبار شامل |
| **المجموع** | **10 أيام** | |

---

# 📊 ملخص الجدول الزمني الإجمالي

| # | الميزة | المدة | الأولوية |
|---|--------|-------|----------|
| 1 | تحويلات المخزون | 7 أيام | 🔴 عالية |
| 2 | نظام الولاء | 9 أيام | 🔴 عالية |
| 3 | التقارير المجدولة | 6 أيام | 🟡 متوسطة |
| 4 | العروض التلقائية | 8 أيام | 🟡 متوسطة |
| 5 | الجرد الدوري | 9 أيام | 🔴 عالية |
| 6 | نظام المشتريات | 12 يوم | 🔴 عالية |
| 7 | نظام طباعة الفواتير | 10 أيام | 🟡 متوسطة |
| **الإجمالي** | | **61 يوم** | |

## 📅 ترتيب التنفيذ المقترح

```
الشهر الأول:
├── الأسبوع 1-2: نظام المشتريات (أساسي)
├── الأسبوع 3: تحويلات المخزون
└── الأسبوع 4: الجرد الدوري

الشهر الثاني:
├── الأسبوع 1-2: نظام الولاء
├── الأسبوع 3: العروض التلقائية
└── الأسبوع 4: التقارير المجدولة

الشهر الثالث:
└── الأسبوع 1-2: نظام طباعة الفواتير
```

---

# 📝 ملاحظات إضافية

## المتطلبات التقنية

1. **خدمة البريد الإلكتروني**
   - تكوين SMTP (Gmail, SendGrid, etc.)
   - أو استخدام خدمة مثل Resend

2. **مجدول المهام (Cron)**
   - استخدام node-cron أو مشابه
   - أو خدمة خارجية مثل Vercel Cron

3. **مكتبات الطباعة**
   - `escpos` للطباعة الحرارية
   - `pdfmake` أو `puppeteer` لـ PDF
   - `qrcode` لإنشاء QR Codes

4. **تحديث User Model**
   - إضافة علاقات جديدة للموديلات المذكورة

---

*تم إنشاء هذه الوثيقة كخطة تطوير مستقبلية لنظام POS*
*آخر تحديث: $(date)*
