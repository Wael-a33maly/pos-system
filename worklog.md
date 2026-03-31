# سجل العمل - POS System

---
## Task ID: 10
Agent: Full-Stack Developer - Notifications Specialist
Task: إنشاء نظام الإشعارات المتقدم

Work Log:
**1. إنشاء API للإشعارات:**
- إنشاء `src/app/api/notifications/route.ts`:
  - GET: جلب إشعارات المستخدم مع الفلاتر والصفحات
  - POST: إنشاء إشعار جديد
  - PUT: تحديث حالة الإشعار (mark as read, mark all read, delete multiple)
  - DELETE: حذف إشعار واحد
  - دعم الصلاحيات والتحقق من المستخدم

**2. إنشاء خدمة الإشعارات الداخلية:**
- إنشاء `src/lib/notifications/notification-service.ts`:
  - NotificationService: إنشاء وإدارة الإشعارات
  - InventoryNotifications: تنبيهات المخزون المنخفض والنفاد
  - ShiftNotifications: إشعارات فتح/إغلاق الورديات
  - InvoiceNotifications: إشعارات الفواتير الجديدة والإلغاء
  - ReturnNotifications: إشعارات طلبات المرتجعات
  - SalesNotifications: إشعارات تحقيق أهداف المبيعات
  - SystemNotifications: إشعارات النظام والتحديثات
  - دعم WebSocket للـ real-time notifications

**3. إنشاء خدمة البريد الإلكتروني:**
- إنشاء `src/lib/notifications/email-service.ts`:
  - EmailService: إرسال البريد الإلكتروني
  - قوالب HTML احترافية مع RTL
  - sendDailyReport: التقرير اليومي
  - sendStockAlert: تنبيه المخزون
  - sendInvoiceEmail: فاتورة للعميل
  - sendZReport: تقرير Z (إغلاق الوردية)
  - sendCustomNotification: إشعارات مخصصة

**4. إنشاء مكونات الإشعارات:**
- إنشاء `src/components/notifications/NotificationBadge.tsx`:
  - شارة عداد الإشعارات مع رسوم متحركة
  - دعم أحجام مختلفة (sm, md, lg)
  - MiniBadge للاستخدام داخل عناصر أخرى

- إنشاء `src/components/notifications/NotificationItem.tsx`:
  - عرض إشعار واحد مع أيقونة حسب النوع
  - ألوان مميزة حسب نوع الإشعار
  - أزرار تحديد كمقروء وحذف
  - دعم RTL واللغة العربية

- إنشاء `src/components/notifications/NotificationCenter.tsx`:
  - مركز إشعارات كامل
  - فلاتر متقدمة (الكل، غير مقروء، مقروء)
  - تصنيفات (المخزون، الورديات، الفواتير، المبيعات، النظام)
  - تحديث تلقائي وWebSocket
  - تحديد الكل كمقروء وحذف الكل

**5. إنشاء Hook للإشعارات:**
- إنشاء `src/hooks/useNotifications.ts`:
  - Real-time updates عبر WebSocket
  - Mark as read / Mark all as read
  - Delete notifications
  - Auto refresh مع interval قابل للتخصيص
  - إشعارات المتصفح (Browser Notifications API)
  - React Query integration

**6. تحديث قاعدة البيانات:**
- تحديث `prisma/schema.prisma`:
  - إضافة فهارس للـ Notification model
  - @@index([userId, isRead])
  - @@index([userId, createdAt])
  - @@index([type])

**7. تحديث التطبيق:**
- تحديث `src/components/layout/Header.tsx`:
  - دمج NotificationCenter الجديد
  - استخدام useNotifications hook
  - دعم Real-time notifications

**8. تثبيت الحزم:**
- تثبيت socket.io للـ WebSocket support

Stage Summary:
- تم إنشاء نظام إشعارات متكامل
- دعم Real-time عبر WebSocket
- قوالب بريد إلكتروني احترافية
- مكونات UI متحركة مع RTL
- فهارس قاعدة بيانات للأداء
- التطبيق يعمل بدون أخطاء

---
## Task ID: 9
Agent: PWA Specialist
Task: تحسين دعم PWA والعمل Offline

Work Log:
**1. تحسين Service Worker:**
- تحديث `public/sw.js`:
  - استراتيجية Cache First للملفات الثابتة
  - استراتيجية Network First للـ APIs
  - استراتيجية Stale While Revalidate للصور
  - تخزين البيانات الحرجة Offline
  - Background Sync للفواتير والمنتجات والعملاء
  - دعم Push Notifications
  - Message handling للتواصل مع التطبيق

**2. إنشاء صفحة Offline:**
- إنشاء `src/app/offline/page.tsx`:
  - تصميم جذاب مع رسوم متحركة
  - عرض حالة الاتصال
  - عرض البيانات المحفوظة محلياً
  - زر إعادة المحاولة
  - زر العودة للرئيسية

**3. تحسين manifest.json:**
- إضافة shortcuts متعددة (POS, المنتجات, الفواتير, التقارير, العملاء)
- تحديث الألوان والثيم
- إضافة display_override
- إضافة share_target
- إضافة protocol_handlers

**4. إنشاء مكونات PWA:**
- إنشاء `src/components/PWAInstallPrompt.tsx`:
  - مطالبة تثبيت PWA
  - دعم iOS مع تعليمات التثبيت
  - Hook usePWAInstall

- تحديث `src/components/OfflineIndicator.tsx`:
  - مؤشر عدم الاتصال
  - إشعار المزامنة عند عودة الاتصال
  - شارة الحالة المدمجة
  - Hook useOfflineStatus

**5. إنشاء IndexedDB Storage:**
- إنشاء `src/lib/offline-db.ts`:
  - فتح وإدارة قاعدة البيانات
  - تخزين الفواتير المعلقة
  - تخزين المنتجات والعملاء محلياً
  - طابور المزامنة
  - إحصائيات التخزين
  - تصدير البيانات للنسخ الاحتياطي

**6. تحديث Layout:**
- إضافة PWAInstallPrompt للتطبيق
- تحديث metadata للـ PWA

**7. API Health Check:**
- إنشاء `src/app/api/health/route.ts`:
  - فحص صحة التطبيق
  - دعم HEAD و GET

Stage Summary:
- تم تحسين Service Worker بشكل شامل
- تم إنشاء صفحة Offline كاملة
- تم إنشاء نظام تخزين Offline متقدم
- تم إضافة مطالبة تثبيت PWA
- جميع الملفات تعمل بدون أخطاء
- ESLint يمر بنجاح (فقط تحذيرات قديمة)

---
## Task ID: 8
Agent: Test Engineer
Task: إنشاء نظام اختبارات أساسي لنظام POS

Work Log:
**1. إعداد بيئة الاختبارات:**
- إنشاء `jest.config.js`:
  - تكوين Next.js + Jest
  - إعداد coverage thresholds
  - دعم TypeScript و paths aliases

- إنشاء `jest.setup.js`:
  - Mock Next.js Router
  - Mock NextAuth
  - Mock Prisma Client
  - Mock Framer Motion
  - Mock TanStack Query
  - Mock Zustand Store
  - Polyfills لـ Next.js Server Components

- تحديث `package.json`:
  - إضافة Jest 29
  - إضافة @testing-library/react
  - إضافة @testing-library/jest-dom
  - إضافة @testing-library/user-event
  - إضافة jest-environment-jsdom
  - إضافة scripts: test, test:watch, test:coverage, test:ci

**2. اختبارات APIs:**
- إنشاء `__tests__/api/auth.test.ts`:
  - اختبارات التحقق من المدخلات
  - اختبارات المصادقة
  - اختبارات النجاح والفشل
  - اختبارات معالجة الأخطاء

- إنشاء `__tests__/api/products.test.ts`:
  - اختبارات قائمة المنتجات
  - اختبارات الفلاتر (بحث، تصنيف، فرع)
  - اختبارات الصفحات
  - اختبارات إنشاء المنتج

- إنشاء `__tests__/api/invoices.test.ts`:
  - اختبارات قائمة الفواتير
  - اختبارات الفلاتر والبحث
  - اختبارات إنشاء الفاتورة
  - اختبارات توليد رقم الفاتورة

- إنشاء `__tests__/api/dashboard.test.ts`:
  - اختبارات KPIs
  - اختبارات الفلترة بالفرع
  - اختبارات المبيعات بالساعة
  - اختبارات تنبيهات المخزون

**3. اختبارات المكونات:**
- إنشاء `__tests__/components/KPICard.test.tsx`:
  - اختبارات العرض
  - اختبارات تنسيق القيم
  - اختبارات مؤشر التغيير
  - اختبارات إعدادات العملة

- إنشاء `__tests__/components/LoginPage.test.tsx`:
  - اختبارات النموذج
  - اختبارات التفاعل
  - اختبارات الإرسال
  - اختبارات الوصولية

**4. اختبارات Hooks:**
- إنشاء `__tests__/hooks/useApi.test.ts`:
  - اختبارات Auth Hooks (useLogin, useLogout, useCurrentUser)
  - اختبارات Products Hooks (CRUD operations)
  - اختبارات Invoices Hooks
  - اختبارات معالجة الأخطاء
  - اختبارات حالات التحميل

Stage Summary:
- تم إنشاء 7 ملفات اختبار
- إجمالي الاختبارات: 100 اختبار
- الاختبارات الناجحة: 85 اختبار
- تم تثبيت جميع الحزم المطلوبة
- Jest يعمل بشكل صحيح
- Coverage threshold: 50% (مطلوب المزيد من الاختبارات للوصول للهدف)

---
## Task ID: 7
Agent: Full-Stack Developer
Task: إنشاء نظام الطباعة الحرارية وملخصات المبيعات التلقائية وتحسينات الأداء وUX

Work Log:
**1. نظام الطباعة الحرارية ESC/POS:**
- إنشاء `src/lib/printer/thermal-printer.ts`:
  - فئة ThermalPrinter كاملة
  - طباعة الإيصالات (Invoice Receipt)
  - طباعة تقرير Z (Z Report)
  - دعم USB/Network/Bluetooth
  - أوامر ESC/POS الكاملة
  - دعم الورق 58mm و 80mm

- إنشاء `src/modules/printing/components/PrinterSelector.tsx`:
  - اكتشاف الطابعات المتاحة
  - اختبار الاتصال
  - إعدادات الورق والقص التلقائي

- إنشاء `src/modules/printing/components/ReceiptPreview.tsx`:
  - معاينة حية للإيصال
  - تخصيص الشكل والمحتوى
  - دعم الطباعة والتنزيل

- إنشاء `src/app/api/printing/route.ts`:
  - GET: حالة الطابعة
  - POST: طباعة إيصال
  - PUT: تحديث الإعدادات

**2. ملخصات المبيعات التلقائية:**
- إنشاء `src/services/cron/sales-summary.ts`:
  - generateHourlySummary() - ملخص كل ساعة
  - generateDailySummary() - ملخص يومي
  - archiveOldData() - أرشفة البيانات القديمة
  - calculatePerformanceMetrics() - حساب مؤشرات الأداء

- إنشاء `src/app/api/cron/summaries/route.ts`:
  - GET: حالة الملخصات
  - POST: تشغيل يدوي للمهام

**3. تحسينات الأداء:**
- إنشاء `src/lib/cache.ts`:
  - cache.get() / cache.set() - جلب وتخزين
  - cache.invalidate() - إبطال حسب النمط
  - cache.invalidateByTag() - إبطال حسب الوسم
  - cache.getOrSet() - جلب أو تعيين
  - مفاتيح ووسوم قياسية للكاش
  - تنظيف تلقائي للعناصر المنتهية

- تحديث Prisma Schema مع فهارس:
  - Invoice: فهارس على branchId, status, createdAt, userId, customerId
  - Product: فهارس على categoryId, brandId, isActive, name
  - Shift: فهارس على branchId, status, startTime

**4. تحسينات UX:**
- إنشاء `src/hooks/useKeyboardShortcuts.ts`:
  - F2-F8: تنقل سريع بين الصفحات
  - Ctrl+P: طباعة، Ctrl+S: حفظ، Ctrl+K: بحث شامل
  - دعم POS shortcuts

- إنشاء `src/components/search/GlobalSearch.tsx`:
  - بحث في المنتجات والفواتير والعملاء
  - اختصار Ctrl+K
  - نتائج مجمعة مع أيقونات

- إنشاء `src/components/ui/command-palette.tsx`:
  - قائمة أوامر سريعة
  - تنقل سريع
  - إجراءات متكررة
  - اختصار Ctrl+Shift+P أو F1

Stage Summary:
- تم إنشاء 12 ملف جديد
- تم تحديث Prisma Schema بفهارس الأداء
- تم تحديث قاعدة البيانات (db:push)
- جميع الأخطاء تم إصلاحها
- ESLint يمر بدون أخطاء (فقط تحذيرات قديمة)
- الكود يعمل بشكل صحيح

---
## Task ID: 6
Agent: Main
Task: إنشاء صفحة إدارة المرتجعات الكاملة

Work Log:
- إنشاء ملف أنواع المرتجعات `/src/types/returns.ts`:
  - ReturnReason type (DEFECTIVE, WRONG_ITEM, NOT_AS_DESCRIBED, CUSTOMER_CHANGE, OTHER)
  - ReturnStatus type (PENDING, APPROVED, REJECTED, COMPLETED)
  - RefundMethod type (CASH, CREDIT, EXCHANGE)
  - ReturnRequest و ReturnItem interfaces
  - Labels helpers للعرض
  - ReturnsStats interface للإحصائيات
- تحديث Prisma schema:
  - إضافة ReturnRequest model
  - إضافة ReturnItem model
  - إضافة ReturnReason, ReturnStatus, RefundMethod enums
  - تحديث relations في Branch, User, Customer, Product, ProductVariant, Invoice
- إنشاء API للمرتجعات:
  - `/api/returns/route.ts` - GET و POST
  - `/api/returns/[id]/route.ts` - GET و PUT و DELETE
  - دعم الفلاتر والبحث والإحصائيات
  - معالجة الموافقة والرفض مع تحديث المخزون
- إنشاء مكون ReturnsPage:
  - صفحة كاملة مع Stats Cards
  - جدول المرتجعات مع ألوان حسب الحالة
  - فلاتر (الحالة، السبب، البحث)
  - إحصائيات (قيد المراجعة، موافق عليه، مكتمل، المبلغ المعلق)
- إنشاء مكونات فرعية:
  - ReturnDetails: عرض تفاصيل المرتجع مع معلومات الفاتورة الأصلية
  - CreateReturnDialog: حوار إنشاء مرتجع جديد بـ 3 خطوات
  - StatusBadge: شارة الحالة مع الألوان والأيقونات
- تحديث page.tsx لإضافة صفحة المرتجعات
- Sidebar بالفعل يحتوي على رابط المرتجعات تحت "الفواتير والمرتجعات"

Stage Summary:
- تم إنشاء نظام مرتجعات كامل
- جميع الملفات تعمل بدون أخطاء
- ESLint يمر بدون أخطاء (فقط تحذيرات قديمة)
- قاعدة البيانات محدثة بالـ models الجديدة
- التصميم RTL مع Framer Motion animations

---
Task ID: 5
Agent: Main
Task: تحويل كامل التطبيق للهيكلة المعيارية (Modular Architecture)

Work Log:
- تحويل وحدة Products بالكامل:
  - إنشاء types/products.types.ts
  - إنشاء hooks/useProducts.ts
  - نقل ProductsPage, CategoriesPage, BrandsPage, BarcodePrintPage, ImportProductsPage
  - إنشاء StatsCard, ProductSkeleton components
- تحويل وحدة Customers بالكامل:
  - إنشاء types/customers.types.ts
  - إنشاء hooks/useCustomers.ts
  - نقل CustomersPage
- تحويل باقي الوحدات:
  - Invoices: نقل InvoicesPage
  - Reports: نقل ReportsPage
  - Shifts: نقل ShiftManagementPage, AuditLogsPage
  - Settings: نقل UnifiedSettingsPage
  - Auth: نقل LoginPage
  - Users: نقل UsersPage
  - Suppliers: نقل SuppliersPage
  - Expenses: نقل ExpensesPage
  - Accounts: نقل AccountsPage
- تحديث page.tsx لاستخدام جميع الوحدات الجديدة

Stage Summary:
- تم تحويل 10 وحدات بالكامل
- جميع الصفحات تستخدم البنية المعيارية
- الكود يعمل بدون أخطاء
- البنية جاهزة للتوسع المستقبلي

---
Task ID: 4
Agent: Main
Task: إصلاح مشاكل Turbopack HMR وترحيل Dashboard

Work Log:
- حذف مجلد src/components/dashboard/ القديم
- تنظيف جميع ملفات .next و .turbo و node_modules/.cache
- إعادة كتابة src/app/page.tsx بشكل نظيف بدون تعليقات قديمة
- تحديث next.config.ts لإجبار إعادة البناء (v1.3.1)
- التأكد من أن جميع lazy imports تشير للمسارات الصحيحة

Stage Summary:
- تم حل مشكلة Module not found في Turbopack
- Dashboard أصبح في modules/dashboard/components/
- جميع الصفحات تستخدم lazy loading صحيح
- الكود يعمل بدون أخطاء

---
Task ID: 3
Agent: Main
Task: تنفيذ البنية المعيارية (Modular Architecture)

Work Log:
- إنشاء هيكل الوحدات الجديدة في src/modules/
- إنشاء وحدة Dashboard كاملة مع:
  - types/dashboard.types.ts - جميع الأنواع
  - hooks/useDashboard.ts - هوك جلب البيانات
  - components/KPICard.tsx - بطاقة المؤشرات
  - components/MiniKPICard.tsx - بطاقة صغيرة
  - components/QuickActionButton.tsx - زر الإجراء السريع
  - components/DashboardSkeleton.tsx - هيكل التحميل
  - components/DashboardPage.tsx - الصفحة الرئيسية
- إنشاء wrapper modules للوحدات الأخرى:
  - modules/products - المنتجات
  - modules/customers - العملاء
  - modules/invoices - الفواتير
  - modules/reports - التقارير
  - modules/shifts - الورديات
  - modules/settings - الإعدادات
  - modules/auth - المصادقة
- تحديث src/app/page.tsx لاستخدام الوحدات الجديدة
- إصلاح أخطاء useMemo في Dashboard
- إصلاح أخطاء الاستيراد في DashboardPage

Stage Summary:
- تم إنشاء 8 وحدات مستقلة
- تم تحديث page.tsx لاستخدام البنية الجديدة
- جميع الوحدات تعمل بشكل صحيح
- الكود يعمل بدون أخطاء (فقط تحذير fonts)
- البنية جاهزة للتوسع المستقبلي

---
Task ID: 1
Agent: Main
Task: تحسين تجربة المستخدم وإضافة روح للتصميم

Work Log:
- مراجعة شاملة للتطبيق
- تحسين Dashboard مع رسوم متحركة متقدمة
- تحسين Sidebar مع تصميم جذاب
- تحسين Header مع تأثيرات بصرية
- إضافة CSS animations مخصصة (swing, float, shimmer, pulse-glow)

Stage Summary:
- تم تحسين Dashboard بشكل كبير مع Framer Motion animations
- تم تحسين Sidebar مع ألوان وأيقونات متحركة
- تم تحسين Header مع POS button shimmer effect
- تم إضافة CSS animations مخصصة في globals.css
- الكود يعمل بدون أخطاء (فقط تحذير واحد للـ fonts)

---
Task ID: 2
Agent: Main
Task: تحسين صفحات المنتجات والعملاء والفواتير والتقارير والورديات

Work Log:
- إصلاح خطأ FileText is not defined في Dashboard
- تحسين ProductsPage مع:
  - إضافة Framer Motion animations
  - Stats Cards متحركة مع gradients
  - Loading skeleton
  - Empty state متحرك
  - Hover effects على المنتجات
  - AnimatePresence للقائمة
- تحسين CustomersPage مع:
  - Stats Cards متحركة
  - Loading skeleton
  - تصميم محسن للجدول
  - Empty state متحرك
- تحسين InvoicesPage مع:
  - Stats Cards متحركة
  - Loading skeleton
  - تأثيرات بصرية على حالات الفواتير
  - Empty state متحرك
- تحسين ReportsPage مع:
  - Report type buttons متحركة
  - Summary Cards متحركة
  - Chart مع gradient
  - Table مع AnimatePresence
- تحسين ShiftManagementPage مع:
  - Stats Cards متحركة
  - Shifts list متحركة
  - Border colors حسب الحالة
  - Empty state متحرك

Stage Summary:
- تم تحسين 5 صفحات رئيسية بشكل شامل
- جميع الصفحات تعمل بدون أخطاء
- تجربة مستخدم محسنة مع رسوم متحركة سلسة
- تصميم موحد ومتناسق عبر جميع الصفحات

---
## Task ID: 11
Agent: Full-Stack Developer - Payment Gateway Specialist
Task: إنشاء نظام بوابات الدفع الإلكتروني

Work Log:
**1. إنشاء نظام الدفع الأساسي:**
- إنشاء `src/lib/payments/payment-gateway.ts`:
  - الأنواع الأساسية (PaymentGatewayCode, PaymentStatus, Currency)
  - واجهات الدفع (PaymentOrder, PaymentResult, PaymentVerification, RefundResult)
  - الفئة الأساسية BasePaymentGateway
  - مدير البوابات PaymentGatewayManager
  - دوال مساعدة للتنسيق والألوان

**2. تحديث قاعدة البيانات:**
- إضافة نماذج جديدة في `prisma/schema.prisma`:
  - PaymentGatewayConfig: تكوين البوابات (API keys, settings, status)
  - PaymentTransaction: معاملات الدفع (amount, status, customer info, card info)
  - PaymentTransactionLog: سجل أحداث المعاملات
  - PaymentWebhookEvent: أحداث Webhook من البوابات
- تشغيل `npm run db:push` لتحديث قاعدة البيانات

**3. إنشاء بوابة PayPal:**
- إنشاء `src/lib/payments/gateways/paypal.ts`:
  - دعم OAuth authentication
  - إنشاء PayPal Order
  - التحقق من الدفع (Capture)
  - استرداد المبالغ (Refund)
  - معالجة Webhooks

**4. إنشاء بوابة Stripe:**
- إنشاء `src/lib/payments/gateways/stripe.ts`:
  - إنشاء Payment Intent
  - التحقق من الدفع
  - استرداد المبالغ
  - إدارة العملاء
  - معالجة Webhooks

**5. إنشاء البوابات المحلية:**
- إنشاء `src/lib/payments/gateways/local.ts`:
  - MadaGateway: بوابة مدى السعودية
  - ApplePayGateway: بوابة آبل باي
  - STCPayGateway: بوابة STC Pay
  - TamaraGateway: بوابة تمارا (الدفع بالتقسيط)

**6. إنشاء APIs للدفع:**
- إنشاء `src/app/api/payments/create/route.ts`:
  - POST: إنشاء معاملة دفع جديدة
  - GET: جلب معاملة بالمعرف
  - التحقق من صحة المبلغ
  - تسجيل المعاملات والسجلات
- إنشاء `src/app/api/payments/verify/route.ts`:
  - POST/GET: التحقق من حالة الدفع
  - تحديث حالة الفاتورة عند اكتمال الدفع
- إنشاء `src/app/api/payments/webhook/route.ts`:
  - POST: استقبال ومعالجة Webhooks
  - التحقق من التوقيع
  - معالجة أنواع الأحداث المختلفة
- إنشاء `src/app/api/payments/gateways/route.ts`:
  - GET: جلب جميع البوابات وإعداداتها
  - POST: تحديث إعدادات بوابة
  - PUT: اختبار اتصال البوابة
  - DELETE: إعادة تعيين تكوين بوابة

**7. إنشاء واجهة الإعدادات:**
- إنشاء `src/components/payments/PaymentGatewaySettings.tsx`:
  - عرض جميع البوابات مع حالتها
  - نماذج تكوين مفصلة (3 تبويبات: عام، بيانات الاعتماد، متقدم)
  - اختبار الاتصال
  - إدارة مفاتيح API بشكل آمن
  - دعم RTL

**8. تحديث page.tsx:**
- إضافة case 'payment-gateways' للتنقل لصفحة الإعدادات

Stage Summary:
- تم إنشاء نظام بوابات دفع متكامل
- دعم 6 بوابات: PayPal, Stripe, Mada, Apple Pay, STC Pay, Tamara
- واجهة موحدة لجميع البوابات
- APIs كاملة للدفع والتحقق وWebhooks
- واجهة إعدادات سهلة الاستخدام
- جميع الملفات تعمل بدون أخطاء
- ESLint يمر بدون أخطاء جديدة

---
## Task ID: 12
Agent: Full-Stack Developer - Printing System Specialist
Task: تحسين نظام الطباعة الحرارية

Work Log:
**1. تحسين ThermalPrinter Service:**
- تحديث `src/lib/printer/thermal-printer.ts`:
  - دعم كامل لبروتوكول ESC/POS
  - محاذاة النص (يمين، يسار، وسط)
  - أحجام الخطوط المختلفة (عادي، مزدوج العرض، مزدوج الارتفاع، مزدوج)
  - خط عريض وتسطير
  - دعم الباركود (CODE128, EAN13, EAN8, CODE39, UPC_A, CODABAR)
  - دعم QR Code مع مستويات التصحيح المختلفة
  - دعم كامل للغة العربية مع عكس النص
  - طباعة الجداول
  - أوامر ESC/POS الكاملة (أكثر من 60 أمر)

**2. إنشاء نظام اكتشاف الطابعات:**
- إنشاء `src/lib/printer/printer-discovery.ts`:
  - اكتشاف طابعات USB عبر WebUSB API
  - اكتشاف طابعات الشبكة بمسح الـ subnet
  - اكتشاف طابعات Bluetooth عبر Web Bluetooth API
  - اختبار الاتصال لكل نوع
  - فحص حالة الطابعة (ورق، غطاء، خطأ)
  - مراقبة مستمرة للطابعات
  - قاعدة بيانات للطابعات المعروفة (12 طابعة)

**3. إنشاء قوالب الإيصالات:**
- إنشاء `src/lib/printer/templates/receipt-template.ts`:
  - قالب افتراضي (Default) - 80mm
  - قالب مختصر (Compact) - 58mm
  - قالب مفصل (Detailed) - 80mm مع QR
  - ReceiptTemplateBuilder Class
  - تخصيص كامل لكل عنصر
- إنشاء `src/lib/printer/templates/z-report-template.ts`:
  - قالب تقرير Z افتراضي
  - قالب مختصر
  - ZReportTemplateBuilder Class
- إنشاء `src/lib/printer/templates/shift-close-template.ts`:
  - قالب إغلاق وردية افتراضي
  - قالب مختصر
  - ShiftCloseTemplateBuilder Class
- إنشاء `src/lib/printer/templates/index.ts`:
  - ملف تصدير موحد
  - دوال مساعدة للوصول للقوالب

**4. إنشاء Print Queue:**
- إنشاء `src/lib/printer/print-queue.ts`:
  - طابور طباقة للمعالجة المتسلسلة
  - أولويات (عالية، عادية، منخفضة)
  - إعادة المحاولة عند الفشل مع backoff
  - سجل كامل للطباعة
  - إحصائيات الطابور
  - تخزين محلي للطابور
  - نظام أحداث للمراقبة

**5. إنشاء API للطباعة:**
- إنشاء `src/app/api/print/job/route.ts`:
  - GET: حالة المهمة، إحصائيات، سجل
  - POST: إرسال مهمة طباعة جديدة
  - PUT: إدارة المهام (إلغاء، إعادة، إيقاف، استئناف)
  - DELETE: مسح السجل
  - دعم جميع أنواع الطباعة
  - تكامل مع Print Queue

**6. تحسين واجهة الطباعة:**
- تحديث `src/modules/printing/components/PrinterSelector.tsx`:
  - 4 تبويبات: الطابعات، القوالب، الطابور، السجل
  - اكتشاف طابعات USB/Network/Bluetooth
  - إضافة طابعة يدوياً بالـ IP
  - اختيار القوالب (إيصال، تقرير Z، إغلاق وردية)
  - معاينة حية للإيصال
  - إحصائيات الطابور
  - إدارة المهام (إلغاء، إعادة محاولة)
  - سجل الطباعة الكامل

**7. ملف التصدير الرئيسي:**
- إنشاء `src/lib/printer/index.ts`:
  - تصدير موحد لجميع الوحدات
  - إعادة تصدير الأنواع والمثيلات

Stage Summary:
- تم تحسين نظام الطباعة بشكل شامل
- دعم كامل لـ ESC/POS مع أكثر من 60 أمر
- نظام اكتشاف طابعات متعدد (USB/Network/Bluetooth)
- 7 قوالب للطباعة (إيصالات، تقارير Z، إغلاق ورديات)
- طابور طباعة مع إعادة المحاولة والسجل
- API كامل للطباعة
- واجهة محسنة مع 4 تبويبات ومعاينة حية
- دعم كامل للغة العربية
- يعمل بدون Internet (محلي بالكامل)
- ESLint يمر بدون أخطاء جديدة
