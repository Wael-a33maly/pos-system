import { db } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

async function main() {
  console.log('🌱 Starting seed...');

  // Create default admin user
  const existingAdmin = await db.user.findUnique({
    where: { email: 'admin@pos.com' },
  });

  if (!existingAdmin) {
    await db.user.create({
      data: {
        email: 'admin@pos.com',
        password: hashPassword('admin123'),
        name: 'مدير النظام',
        nameAr: 'مدير النظام',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    console.log('✅ Created default admin user');
  }

  // Create default branch
  const branchCount = await db.branch.count();
  let mainBranch;

  if (branchCount === 0) {
    mainBranch = await db.branch.create({
      data: {
        name: 'الفرع الرئيسي',
        nameAr: 'الفرع الرئيسي',
        address: 'الرياض، المملكة العربية السعودية',
        phone: '920000000',
        email: 'main@pos.com',
        isActive: true,
      },
    });
    console.log('✅ Created default branch');
  } else {
    mainBranch = await db.branch.findFirst();
  }

  // Create payment methods
  const paymentMethodsCount = await db.paymentMethod.count();
  if (paymentMethodsCount === 0) {
    await db.paymentMethod.createMany({
      data: [
        { name: 'Cash', nameAr: 'نقداً', code: 'CASH', isActive: true },
        { name: 'Card', nameAr: 'بطاقة ائتمان', code: 'CARD', isActive: true },
        { name: 'KNET', nameAr: 'كي نت', code: 'KNET', isActive: true },
        { name: 'Multi', nameAr: 'دفع متعدد', code: 'MULTI', isActive: true },
        { name: 'Credit', nameAr: 'آجل', code: 'CREDIT', isActive: true },
      ],
    });
    console.log('✅ Created payment methods');
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
    console.log('✅ Created default currency');
  }

  // Create expense categories
  const expenseCategoriesCount = await db.expenseCategory.count();
  if (expenseCategoriesCount === 0) {
    await db.expenseCategory.createMany({
      data: [
        { name: 'رواتب', nameAr: 'رواتب', isActive: true },
        { name: 'إيجار', nameAr: 'إيجار', isActive: true },
        { name: 'كهرباء', nameAr: 'كهرباء', isActive: true },
        { name: 'ماء', nameAr: 'ماء', isActive: true },
        { name: 'غاز', nameAr: 'غاز', isActive: true },
        { name: 'إنترنت', nameAr: 'إنترنت', isActive: true },
        { name: 'صيانة', nameAr: 'صيانة', isActive: true },
        { name: 'نقل', nameAr: 'نقل', isActive: true },
        { name: 'تسويق', nameAr: 'تسويق', isActive: true },
        { name: 'مستلزمات', nameAr: 'مستلزمات', isActive: true },
        { name: 'أخرى', nameAr: 'أخرى', isActive: true },
      ],
    });
    console.log('✅ Created expense categories');
  }

  // Create categories
  const categoriesCount = await db.category.count();
  let electronicsCategory: any;

  if (categoriesCount === 0) {
    electronicsCategory = await db.category.create({
      data: {
        name: 'إلكترونيات',
        nameAr: 'إلكترونيات',
        color: '#3b82f6',
        isActive: true,
        sortOrder: 0,
      },
    });

    await db.category.createMany({
      data: [
        { name: 'ملابس', nameAr: 'ملابس', color: '#10b981', isActive: true, sortOrder: 1 },
        { name: 'أغذية', nameAr: 'أغذية', color: '#f59e0b', isActive: true, sortOrder: 2 },
        { name: 'مشروبات', nameAr: 'مشروبات', color: '#ef4444', isActive: true, sortOrder: 3 },
        { name: 'أجهزة كهربائية', nameAr: 'أجهزة كهربائية', color: '#8b5cf6', parentId: electronicsCategory.id, isActive: true, sortOrder: 0 },
        { name: 'اكسسوارات', nameAr: 'اكسسوارات', color: '#ec4899', parentId: electronicsCategory.id, isActive: true, sortOrder: 1 },
      ],
    });
    console.log('✅ Created categories');
  } else {
    electronicsCategory = await db.category.findFirst();
  }

  // Create brands
  const brandsCount = await db.brand.count();
  if (brandsCount === 0) {
    await db.brand.createMany({
      data: [
        { name: 'Apple', nameAr: 'آبل', isActive: true },
        { name: 'Samsung', nameAr: 'سامسونج', isActive: true },
        { name: 'Sony', nameAr: 'سوني', isActive: true },
        { name: 'LG', nameAr: 'إل جي', isActive: true },
        { name: 'Huawei', nameAr: 'هواوي', isActive: true },
        { name: 'Xiaomi', nameAr: 'شاومي', isActive: true },
      ],
    });
    console.log('✅ Created brands');
  }

  // Create sample products
  const productsCount = await db.product.count();
  if (productsCount === 0) {
    const appleBrand = await db.brand.findFirst({ where: { name: 'Apple' } });
    const samsungBrand = await db.brand.findFirst({ where: { name: 'Samsung' } });

    await db.product.createMany({
      data: [
        {
          barcode: '001',
          name: 'iPhone 15 Pro Max',
          nameAr: 'آيفون 15 برو ماكس',
          categoryId: electronicsCategory?.id,
          brandId: appleBrand?.id,
          branchId: mainBranch?.id,
          costPrice: 4000,
          sellingPrice: 4999,
          wholesalePrice: 4500,
          minStock: 5,
          unit: 'piece',
          hasVariants: false,
          isActive: true,
        },
        {
          barcode: '002',
          name: 'Samsung Galaxy S24 Ultra',
          nameAr: 'سامسونج جالكسي S24 ألترا',
          categoryId: electronicsCategory?.id,
          brandId: samsungBrand?.id,
          branchId: mainBranch?.id,
          costPrice: 3500,
          sellingPrice: 4299,
          wholesalePrice: 3800,
          minStock: 5,
          unit: 'piece',
          hasVariants: false,
          isActive: true,
        },
        {
          barcode: '003',
          name: 'AirPods Pro 2',
          nameAr: 'سماعات آبل برو 2',
          categoryId: electronicsCategory?.id,
          brandId: appleBrand?.id,
          branchId: mainBranch?.id,
          costPrice: 800,
          sellingPrice: 999,
          wholesalePrice: 900,
          minStock: 10,
          unit: 'piece',
          hasVariants: false,
          isActive: true,
        },
        {
          barcode: '004',
          name: 'Fast Charger 65W',
          nameAr: 'شاحن سريع 65 وات',
          categoryId: electronicsCategory?.id,
          branchId: mainBranch?.id,
          costPrice: 50,
          sellingPrice: 89,
          wholesalePrice: 70,
          minStock: 20,
          unit: 'piece',
          hasVariants: false,
          isActive: true,
        },
        {
          barcode: '005',
          name: 'iPhone Case',
          nameAr: 'غطاء حماية آيفون',
          categoryId: electronicsCategory?.id,
          brandId: appleBrand?.id,
          branchId: mainBranch?.id,
          costPrice: 20,
          sellingPrice: 49,
          wholesalePrice: 35,
          minStock: 30,
          unit: 'piece',
          hasVariants: true,
          isActive: true,
        },
      ],
    });
    console.log('✅ Created sample products');
  }

  // Create product variants
  const variantsCount = await db.productVariant.count();
  if (variantsCount === 0) {
    const iphoneCase = await db.product.findFirst({
      where: { barcode: '005' },
    });

    if (iphoneCase) {
      await db.productVariant.createMany({
        data: [
          {
            productId: iphoneCase.id,
            name: 'iPhone Case - Black',
            nameAr: 'غطاء آيفون - أسود',
            sku: 'CASE-BLK',
            barcode: '005-BLK',
            costPrice: 20,
            sellingPrice: 49,
            stock: 50,
            attributes: JSON.stringify({ color: 'أسود' }),
            isActive: true,
          },
          {
            productId: iphoneCase.id,
            name: 'iPhone Case - White',
            nameAr: 'غطاء آيفون - أبيض',
            sku: 'CASE-WHT',
            barcode: '005-WHT',
            costPrice: 20,
            sellingPrice: 49,
            stock: 45,
            attributes: JSON.stringify({ color: 'أبيض' }),
            isActive: true,
          },
          {
            productId: iphoneCase.id,
            name: 'iPhone Case - Blue',
            nameAr: 'غطاء آيفون - أزرق',
            sku: 'CASE-BLU',
            barcode: '005-BLU',
            costPrice: 20,
            sellingPrice: 49,
            stock: 30,
            attributes: JSON.stringify({ color: 'أزرق' }),
            isActive: true,
          },
        ],
      });
      console.log('✅ Created product variants');
    }
  }

  // Create sample customers
  const customersCount = await db.customer.count();
  if (customersCount === 0) {
    await db.customer.createMany({
      data: [
        { name: 'عميل نقدي', nameAr: 'عميل نقدي', isActive: true, branchId: mainBranch?.id },
        { name: 'أحمد محمد', nameAr: 'أحمد محمد', phone: '0501234567', email: 'ahmed@email.com', isActive: true, branchId: mainBranch?.id },
        { name: 'سارة علي', nameAr: 'سارة علي', phone: '0509876543', email: 'sara@email.com', isActive: true, branchId: mainBranch?.id },
        { name: 'محمد خالد', nameAr: 'محمد خالد', phone: '0551234567', isActive: true, branchId: mainBranch?.id },
      ],
    });
    console.log('✅ Created sample customers');
  }

  // Create sample suppliers
  const suppliersCount = await db.supplier.count();
  if (suppliersCount === 0) {
    await db.supplier.createMany({
      data: [
        { name: 'شركة التوريدات الأولى', nameAr: 'شركة التوريدات الأولى', phone: '0112345678', email: 'info@supplier1.com', isActive: true, branchId: mainBranch?.id },
        { name: 'شركة الأغذية المتحدة', nameAr: 'شركة الأغذية المتحدة', phone: '0112345679', email: 'info@supplier2.com', isActive: true, branchId: mainBranch?.id },
        { name: 'مؤسسة التقنية الحديثة', nameAr: 'مؤسسة التقنية الحديثة', phone: '0112345680', isActive: true, branchId: mainBranch?.id },
      ],
    });
    console.log('✅ Created sample suppliers');
  }

  // Create default settings
  const settingsCount = await db.setting.count();
  if (settingsCount === 0) {
    await db.setting.createMany({
      data: [
        { key: 'company_name', value: 'شركة نقاط البيع', description: 'اسم الشركة' },
        { key: 'company_name_ar', value: 'شركة نقاط البيع', description: 'اسم الشركة بالعربي' },
        { key: 'company_phone', value: '920000000', description: 'رقم هاتف الشركة' },
        { key: 'company_email', value: 'info@pos.com', description: 'البريد الإلكتروني' },
        { key: 'company_address', value: 'الرياض، المملكة العربية السعودية', description: 'عنوان الشركة' },
        { key: 'tax_number', value: '300000000000003', description: 'الرقم الضريبي' },
        { key: 'invoice_prefix', value: 'INV', description: 'بادئة رقم الفاتورة' },
        { key: 'invoice_notes', value: 'شكراً لتعاملكم معنا', description: 'ملاحظات الفاتورة' },
        { key: 'decimal_places', value: '2', description: 'عدد الخانات العشرية' },
        { key: 'low_stock_threshold', value: '5', description: 'حد التنبيه للمخزون المنخفض' },
      ],
    });
    console.log('✅ Created default settings');
  }

  // Create print templates
  const printTemplatesCount = await db.printTemplate.count();
  if (printTemplatesCount === 0) {
    await db.printTemplate.createMany({
      data: [
        {
          name: 'فاتورة عادية',
          nameAr: 'فاتورة عادية',
          type: 'invoice',
          paperSize: 'A4',
          width: 210,
          height: 297,
          template: '<div>Invoice Template</div>',
          isActive: true,
          isDefault: true,
        },
        {
          name: 'فاتورة حرارية',
          nameAr: 'فاتورة حرارية',
          type: 'invoice',
          paperSize: '80mm',
          width: 80,
          height: 200,
          template: '<div>Thermal Invoice</div>',
          isActive: true,
          isDefault: false,
        },
      ],
    });
    console.log('✅ Created print templates');
  }

  // Create barcode settings
  const barcodeSettingsCount = await db.barcodeSetting.count();
  if (barcodeSettingsCount === 0) {
    await db.barcodeSetting.create({
      data: {
        name: 'إعداد افتراضي',
        paperWidth: 80,
        paperHeight: 50,
        labelWidth: 70,
        labelHeight: 40,
        columns: 3,
        rows: 8,
        showProductName: true,
        showPrice: true,
        showBarcode: true,
        showSku: false,
        fontSize: 10,
        barcodeHeight: 20,
        isActive: true,
        isDefault: true,
      },
    });
    console.log('✅ Created barcode settings');
  }

  // Create chart of accounts
  const accountsCount = await db.account.count();
  if (accountsCount === 0) {
    await db.account.createMany({
      data: [
        { code: '1000', name: 'النقدية', nameAr: 'النقدية', type: 'ASSET', balance: 50000, isActive: true },
        { code: '1100', name: 'البنك', nameAr: 'البنك', type: 'ASSET', balance: 125000, isActive: true },
        { code: '1200', name: 'المخزون', nameAr: 'المخزون', type: 'ASSET', balance: 85000, isActive: true },
        { code: '2000', name: 'الموردين', nameAr: 'الموردين', type: 'LIABILITY', balance: 35000, isActive: true },
        { code: '3000', name: 'رأس المال', nameAr: 'رأس المال', type: 'EQUITY', balance: 200000, isActive: true },
        { code: '4000', name: 'المبيعات', nameAr: 'المبيعات', type: 'REVENUE', balance: 0, isActive: true },
        { code: '5000', name: 'المصروفات', nameAr: 'المصروفات', type: 'EXPENSE', balance: 0, isActive: true },
      ],
    });
    console.log('✅ Created chart of accounts');
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
