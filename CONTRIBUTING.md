# 🤝 دليل المساهمة (Contributing Guide)

<div align="center">

![Contributing](https://img.shields.io/badge/Contributions-Welcome-brightgreen)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-blue)

**شكراً لاهتمامك بالمساهمة في نظام POS!**

</div>

---

## 📑 فهرس المحتويات

1. [قواعد السلوك](#قواعد-السلوك)
2. [كيف أساهم؟](#كيف-أساهم)
3. [بيئة التطوير](#بيئة-التطوير)
4. [معايير الكود](#معايير-الكود)
5. [عملية Pull Request](#عملية-pull-request)
6. [الإبلاغ عن الأخطاء](#الإبلاغ-عن-الأخطاء)
7. [اقتراح ميزات](#اقتراح-ميزات)

---

## قواعد السلوك 📜

### التزاماتنا

- ✅ نرحب بالجميع بغض النظر عن الخبرة
- ✅ نحترم الآراء المختلفة
- ✅ نقدم ملاحظات بناءة
- ✅ نركز على ما هو أفضل للمجتمع

### توقعاتنا منك

- 🤝 كن محترماً ومهذباً
- 📝 استخدم لغة واضحة ومفيدة
- 🔍 اقبل النقد البناء
- 🎯 ركز على حل المشكلة

---

## كيف أساهم؟ 🚀

### أنواع المساهمات

| النوع | الوصف |
|-------|-------|
| 🐛 **إصلاح أخطاء** | إصلاح bugs في الكود |
| ✨ **ميزات جديدة** | إضافة وظائف جديدة |
| 📚 **توثيق** | تحسين أو إضافة توثيق |
| 🎨 **تصميم** | تحسين واجهة المستخدم |
| 🧪 **اختبارات** | إضافة أو تحسين الاختبارات |
| 🌐 **ترجمة** | ترجمة المحتوى |

### الخطوات العامة

```
1. Fork المشروع
2. إنشاء فرع جديد
3. إجراء التغييرات
4. تشغيل الاختبارات
5. إنشاء Pull Request
```

---

## بيئة التطوير 💻

### المتطلبات

```bash
# التحقق من الإصدارات
node --version  # >= 18.x
bun --version   # أو npm >= 9.x
```

### الإعداد الأولي

```bash
# 1. Fork و Clone
git clone https://github.com/YOUR_USERNAME/pos-system.git
cd pos-system

# 2. تثبيت التبعيات
bun install

# 3. إعداد قاعدة البيانات
cp .env.example .env
bun run db:push
bun run db:seed

# 4. تشغيل المشروع
bun run dev
```

### هيكل الفروع

```
main        → الإصدار المستقر
develop     → التطوير النشط
feature/*   → ميزات جديدة
fix/*       → إصلاح أخطاء
docs/*      → تحديث التوثيق
```

---

## معايير الكود 📏

### TypeScript

```typescript
// ✅ استخدم أنواع واضحة
interface Product {
  id: string;
  name: string;
  price: number;
}

// ✅ تجنب any
function process(data: unknown): Result {
  if (isValidData(data)) {
    return transform(data);
  }
  throw new Error('Invalid data');
}

// ❌ لا تستخدم any
function process(data: any): any {  // سيء!
  return data;
}
```

### React

```tsx
// ✅ استخدم Functional Components
export function ProductCard({ product }: Props) {
  return (
    <Card>
      <h3>{product.name}</h3>
      <p>{product.price}</p>
    </Card>
  );
}

// ✅ استخدم memo للمكونات الثقيلة
export const ProductList = memo(function ProductList({ products }: Props) {
  return (
    <div>
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
});

// ✅ فصل المنطق في Hooks
function useProductActions() {
  const [loading, setLoading] = useState(false);
  // ...
  return { loading, create, update, remove };
}
```

### Prisma

```typescript
// ✅ استخدم include للعلاقات
const products = await db.product.findMany({
  include: { category: true, brand: true },
});

// ✅ استخدم select لتحديد الحقول
const products = await db.product.findMany({
  select: { id: true, name: true, price: true },
});

// ✅ معالجة الأخطاء
try {
  await db.product.create({ data });
} catch (error: any) {
  if (error.code === 'P2002') {
    // معالجة تكرار الباركود
  }
}
```

### التسمية

| النوع | التنسيق | مثال |
|-------|---------|------|
| الملفات (مكونات) | PascalCase | `ProductCard.tsx` |
| الملفات (أخرى) | camelCase | `useProducts.ts` |
| المكونات | PascalCase | `ProductCard` |
| الدوال | camelCase | `getProductById` |
| الثوابت | SCREAMING_SNAKE | `MAX_ITEMS` |
| الأنواع | PascalCase | `ProductResponse` |

### التعليقات

```typescript
/**
 * حساب الخصم على المنتج
 * @param price - السعر الأصلي
 * @param discountPercent - نسبة الخصم (0-100)
 * @returns السعر بعد الخصم
 * @throws Error إذا كان الخصم أكبر من 100
 */
function calculateDiscount(price: number, discountPercent: number): number {
  if (discountPercent > 100) {
    throw new Error('Discount cannot exceed 100%');
  }
  return price * (1 - discountPercent / 100);
}
```

### ESLint و Prettier

```bash
# تشغيل ESLint
bun run lint

# إصلاح المشاكل تلقائياً
bun run lint --fix
```

---

## عملية Pull Request 📤

### قبل البدء

1. تأكد من عدم وجود PR مماثلة
2. افتح Issue للمناقشة (للتغييرات الكبيرة)
3. حدّث فرعك مع latest main

### إنشاء PR

#### 1. إنشاء فرع جديد

```bash
# من main
git checkout main
git pull origin main

# إنشاء فرع
git checkout -b feature/add-product-export
```

#### 2. إجراء التغييرات

```bash
# التغييرات...
git add .
git commit -m "feat: add product export to Excel"
```

#### 3. تشغيل الاختبارات

```bash
# تشغيل الاختبارات
bun run test

# التحقق من lint
bun run lint

# بناء المشروع
bun run build
```

#### 4. رفع الفرع

```bash
git push origin feature/add-product-export
```

#### 5. إنشاء PR على GitHub

### قالب Commit Message

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### الأنواع (types)

| النوع | الوصف |
|-------|-------|
| `feat` | ميزة جديدة |
| `fix` | إصلاح خطأ |
| `docs` | توثيق |
| `style` | تنسيق (لا يؤثر على الكود) |
| `refactor` | إعادة هيكلة |
| `test` | اختبارات |
| `chore` | مهام صيانة |

#### أمثلة

```bash
feat(products): add export to Excel feature
fix(invoices): correct tax calculation
docs(api): update authentication docs
refactor(pos): improve cart performance
test(products): add unit tests for ProductService
```

### قالب Pull Request

```markdown
## 📝 الوصف
وصف واضح للتغييرات...

## 🔗 Issue مرتبط
Closes #123

## 📸 لقطات شاشة (إن وجدت)
...

## ✅ قائمة التحقق
- [ ] الكود يتبع معايير المشروع
- [ ] الاختبارات تمر بنجاح
- [ ] التوثيق محدث (إن لزم)
- [ ] لا توجد تنبيهات ESLint

## 📋 ملاحظات إضافية
...
```

### مراجعة الكود

- 👀 انتظر مراجعة من المشرفين
- 💬 رد على التعليقات بوضوح
- 🔧 أصلح الملاحظات المطلوبة
- ✅ ستُدمج PR بعد الموافقة

---

## الإبلاغ عن الأخطاء 🐛

### قبل الإبلاغ

1. ✅ تأكد أن الخطأ لم يُبلغ عنه
2. ✅ جرب على أحدث إصدار
3. ✅ اجمع معلومات كافية

### قالب الإبلاغ

```markdown
## 🐛 وصف الخطأ
وصف واضح ومختصر للخطأ...

## 📋 خطوات إعادة الإنتاج
1. اذهب إلى '...'
2. اضغط على '...'
3. شاهد الخطأ

## 🎯 السلوك المتوقع
ما كان يجب أن يحدث...

## 📸 لقطات شاشة
إن وجدت...

## 💻 معلومات البيئة
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.3.3]

## 📎 معلومات إضافية
...
```

---

## اقتراح ميزات 💡

### قبل الاقتراح

1. ✅ تأكد أن الميزة غير موجودة
2. ✅ تأكد أنها ضمن نطاق المشروع
3. ✅ فكر في كيفية تنفيذها

### قالب الاقتراح

```markdown
## 💡 وصف الميزة
وصف واضح للميزة المقترحة...

## 🎯 المشكلة
ما المشكلة التي تحلها هذه الميزة؟

## 💭 الحل المقترح
كيف تتصور أن تعمل هذه الميزة؟

## 🔄 البدائل
هل هناك حلول بديلة فكرت بها؟

## 📎 معلومات إضافية
...
```

---

## 🏆 المساهمون

شكراً لجميع المساهمين الذين ساعدوا في تطوير هذا المشروع!

<!-- سيتم إضافة قائمة المساهمين تلقائياً -->

---

## 📞 التواصل

| القناة | الرابط |
|--------|--------|
| 💬 Discord | [مجتمع المطورين](https://discord.gg/pos-dev) |
| 📧 البريد | dev@pos-system.com |
| 🐦 Twitter | [@pos_system](https://twitter.com/pos_system) |

---

<div align="center">

**شكراً لمساهمتك! 🎉**

Made with ❤️ by the POS Community

</div>
