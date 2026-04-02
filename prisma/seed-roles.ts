import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

async function main() {
  console.log('🌱 Initializing roles and permissions...');

  // إنشاء الصلاحيات الافتراضية
  const defaultPermissions = [
    // لوحة التحكم
    { module: 'dashboard', action: 'view', name: 'View Dashboard', nameAr: 'عرض لوحة التحكم', group: 'dashboard', groupAr: 'لوحة التحكم' },
    
    // المنتجات
    { module: 'products', action: 'view', name: 'View Products', nameAr: 'عرض المنتجات', group: 'products', groupAr: 'المنتجات' },
    { module: 'products', action: 'create', name: 'Create Products', nameAr: 'إنشاء منتجات', group: 'products', groupAr: 'المنتجات' },
    { module: 'products', action: 'edit', name: 'Edit Products', nameAr: 'تعديل المنتجات', group: 'products', groupAr: 'المنتجات' },
    { module: 'products', action: 'delete', name: 'Delete Products', nameAr: 'حذف المنتجات', group: 'products', groupAr: 'المنتجات' },
    { module: 'products', action: 'import', name: 'Import Products', nameAr: 'استيراد منتجات', group: 'products', groupAr: 'المنتجات' },
    { module: 'products', action: 'export', name: 'Export Products', nameAr: 'تصدير منتجات', group: 'products', groupAr: 'المنتجات' },
    
    // الفئات
    { module: 'categories', action: 'view', name: 'View Categories', nameAr: 'عرض الفئات', group: 'products', groupAr: 'المنتجات' },
    { module: 'categories', action: 'manage', name: 'Manage Categories', nameAr: 'إدارة الفئات', group: 'products', groupAr: 'المنتجات' },
    
    // الماركات
    { module: 'brands', action: 'view', name: 'View Brands', nameAr: 'عرض الماركات', group: 'products', groupAr: 'المنتجات' },
    { module: 'brands', action: 'manage', name: 'Manage Brands', nameAr: 'إدارة الماركات', group: 'products', groupAr: 'المنتجات' },
    
    // نقطة البيع
    { module: 'pos', action: 'view', name: 'Access POS', nameAr: 'الوصول لنقطة البيع', group: 'pos', groupAr: 'نقطة البيع' },
    { module: 'pos', action: 'discount', name: 'Apply Discounts', nameAr: 'تطبيق الخصومات', group: 'pos', groupAr: 'نقطة البيع' },
    { module: 'pos', action: 'return', name: 'Process Returns', nameAr: 'معالجة المرتجعات', group: 'pos', groupAr: 'نقطة البيع' },
    
    // الفواتير
    { module: 'invoices', action: 'view', name: 'View Invoices', nameAr: 'عرض الفواتير', group: 'invoices', groupAr: 'الفواتير' },
    { module: 'invoices', action: 'create', name: 'Create Invoices', nameAr: 'إنشاء فواتير', group: 'invoices', groupAr: 'الفواتير' },
    { module: 'invoices', action: 'edit', name: 'Edit Invoices', nameAr: 'تعديل الفواتير', group: 'invoices', groupAr: 'الفواتير' },
    { module: 'invoices', action: 'delete', name: 'Delete Invoices', nameAr: 'حذف الفواتير', group: 'invoices', groupAr: 'الفواتير' },
    { module: 'invoices', action: 'export', name: 'Export Invoices', nameAr: 'تصدير الفواتير', group: 'invoices', groupAr: 'الفواتير' },
    
    // العملاء
    { module: 'customers', action: 'view', name: 'View Customers', nameAr: 'عرض العملاء', group: 'customers', groupAr: 'العملاء' },
    { module: 'customers', action: 'create', name: 'Create Customers', nameAr: 'إنشاء عملاء', group: 'customers', groupAr: 'العملاء' },
    { module: 'customers', action: 'edit', name: 'Edit Customers', nameAr: 'تعديل العملاء', group: 'customers', groupAr: 'العملاء' },
    { module: 'customers', action: 'delete', name: 'Delete Customers', nameAr: 'حذف العملاء', group: 'customers', groupAr: 'العملاء' },
    
    // الموردين
    { module: 'suppliers', action: 'view', name: 'View Suppliers', nameAr: 'عرض الموردين', group: 'suppliers', groupAr: 'الموردين' },
    { module: 'suppliers', action: 'manage', name: 'Manage Suppliers', nameAr: 'إدارة الموردين', group: 'suppliers', groupAr: 'الموردين' },
    
    // الورديات
    { module: 'shifts', action: 'view', name: 'View Shifts', nameAr: 'عرض الورديات', group: 'shifts', groupAr: 'الورديات' },
    { module: 'shifts', action: 'open', name: 'Open Shift', nameAr: 'فتح وردية', group: 'shifts', groupAr: 'الورديات' },
    { module: 'shifts', action: 'close', name: 'Close Shift', nameAr: 'إغلاق وردية', group: 'shifts', groupAr: 'الورديات' },
    { module: 'shifts', action: 'force_close', name: 'Force Close Shifts', nameAr: 'إغلاق وردية إجباري', group: 'shifts', groupAr: 'الورديات' },
    { module: 'shifts', action: 'view_all', name: 'View All Shifts', nameAr: 'عرض كل الورديات', group: 'shifts', groupAr: 'الورديات' },
    
    // المصروفات
    { module: 'expenses', action: 'view', name: 'View Expenses', nameAr: 'عرض المصروفات', group: 'expenses', groupAr: 'المصروفات' },
    { module: 'expenses', action: 'create', name: 'Create Expenses', nameAr: 'إنشاء مصروفات', group: 'expenses', groupAr: 'المصروفات' },
    { module: 'expenses', action: 'approve', name: 'Approve Expenses', nameAr: 'اعتماد المصروفات', group: 'expenses', groupAr: 'المصروفات' },
    
    // التقارير
    { module: 'reports', action: 'view', name: 'View Reports', nameAr: 'عرض التقارير', group: 'reports', groupAr: 'التقارير' },
    { module: 'reports', action: 'export', name: 'Export Reports', nameAr: 'تصدير التقارير', group: 'reports', groupAr: 'التقارير' },
    { module: 'reports', action: 'sales', name: 'Sales Reports', nameAr: 'تقارير المبيعات', group: 'reports', groupAr: 'التقارير' },
    { module: 'reports', action: 'products', name: 'Products Reports', nameAr: 'تقارير المنتجات', group: 'reports', groupAr: 'التقارير' },
    { module: 'reports', action: 'profits', name: 'Profits Reports', nameAr: 'تقارير الأرباح', group: 'reports', groupAr: 'التقارير' },
    
    // المستخدمين
    { module: 'users', action: 'view', name: 'View Users', nameAr: 'عرض المستخدمين', group: 'users', groupAr: 'المستخدمين' },
    { module: 'users', action: 'create', name: 'Create Users', nameAr: 'إنشاء مستخدمين', group: 'users', groupAr: 'المستخدمين' },
    { module: 'users', action: 'edit', name: 'Edit Users', nameAr: 'تعديل المستخدمين', group: 'users', groupAr: 'المستخدمين' },
    { module: 'users', action: 'delete', name: 'Delete Users', nameAr: 'حذف المستخدمين', group: 'users', groupAr: 'المستخدمين' },
    { module: 'users', action: 'manage_permissions', name: 'Manage Permissions', nameAr: 'إدارة الصلاحيات', group: 'users', groupAr: 'المستخدمين' },
    
    // الأدوار
    { module: 'roles', action: 'view', name: 'View Roles', nameAr: 'عرض الأدوار', group: 'users', groupAr: 'المستخدمين' },
    { module: 'roles', action: 'manage', name: 'Manage Roles', nameAr: 'إدارة الأدوار', group: 'users', groupAr: 'المستخدمين' },
    
    // الإعدادات
    { module: 'settings', action: 'view', name: 'View Settings', nameAr: 'عرض الإعدادات', group: 'settings', groupAr: 'الإعدادات' },
    { module: 'settings', action: 'edit', name: 'Edit Settings', nameAr: 'تعديل الإعدادات', group: 'settings', groupAr: 'الإعدادات' },
    { module: 'settings', action: 'branches', name: 'Manage Branches', nameAr: 'إدارة الفروع', group: 'settings', groupAr: 'الإعدادات' },
    { module: 'settings', action: 'payment_methods', name: 'Manage Payment Methods', nameAr: 'إدارة طرق الدفع', group: 'settings', groupAr: 'الإعدادات' },
    { module: 'settings', action: 'currencies', name: 'Manage Currencies', nameAr: 'إدارة العملات', group: 'settings', groupAr: 'الإعدادات' },
    { module: 'settings', action: 'print', name: 'Manage Print Settings', nameAr: 'إعدادات الطباعة', group: 'settings', groupAr: 'الإعدادات' },
    
    // الحسابات
    { module: 'accounts', action: 'view', name: 'View Accounts', nameAr: 'عرض الحسابات', group: 'accounts', groupAr: 'الحسابات' },
    { module: 'accounts', action: 'manage', name: 'Manage Accounts', nameAr: 'إدارة الحسابات', group: 'accounts', groupAr: 'الحسابات' },
    
    // سجل التدقيق
    { module: 'audit', action: 'view', name: 'View Audit Logs', nameAr: 'عرض سجل التدقيق', group: 'settings', groupAr: 'الإعدادات' },
  ];

  console.log('Creating permissions...');
  for (const perm of defaultPermissions) {
    await db.systemPermission.upsert({
      where: { module_action: { module: perm.module, action: perm.action } },
      update: perm,
      create: perm
    });
  }

  // إنشاء الأدوار الافتراضية
  console.log('Creating default roles...');

  // دور المدير العام (كل الصلاحيات)
  const superAdminRole = await db.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      nameAr: 'مدير النظام',
      description: 'صلاحيات كاملة على جميع أجزاء النظام',
      color: '#ef4444',
      isSystem: true,
      isActive: true,
      priority: 100
    }
  });

  // دور مدير الفرع
  const branchAdminRole = await db.role.upsert({
    where: { name: 'BRANCH_ADMIN' },
    update: {},
    create: {
      name: 'BRANCH_ADMIN',
      nameAr: 'مدير الفرع',
      description: 'إدارة فرع محدد مع صلاحيات متوسطة',
      color: '#f59e0b',
      isSystem: true,
      isActive: true,
      priority: 50
    }
  });

  // دور الكاشير
  const cashierRole = await db.role.upsert({
    where: { name: 'CASHIER' },
    update: {},
    create: {
      name: 'CASHIER',
      nameAr: 'كاشير',
      description: 'صلاحيات نقطة البيع الأساسية',
      color: '#3b82f6',
      isSystem: true,
      isActive: true,
      priority: 10
    }
  });

  // إضافة جميع الصلاحيات للمدير العام
  console.log('Assigning permissions to Super Admin...');
  const allPermissions = await db.systemPermission.findMany();
  
  for (const perm of allPermissions) {
    await db.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id }
      },
      update: { allowed: true },
      create: { roleId: superAdminRole.id, permissionId: perm.id, allowed: true }
    });
  }

  // صلاحيات مدير الفرع
  const branchAdminPermissions = [
    'dashboard:view', 'products:view', 'products:create', 'products:edit',
    'categories:view', 'brands:view', 'pos:view', 'pos:discount', 'pos:return',
    'invoices:view', 'invoices:create', 'customers:view', 'customers:create', 'customers:edit',
    'suppliers:view', 'shifts:view', 'shifts:open', 'shifts:close',
    'expenses:view', 'expenses:create', 'reports:view', 'reports:sales', 'reports:products',
    'settings:view'
  ];

  console.log('Assigning permissions to Branch Admin...');
  for (const permKey of branchAdminPermissions) {
    const [module, action] = permKey.split(':');
    const perm = await db.systemPermission.findFirst({
      where: { module, action }
    });
    if (perm) {
      await db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: branchAdminRole.id, permissionId: perm.id } },
        update: { allowed: true },
        create: { roleId: branchAdminRole.id, permissionId: perm.id, allowed: true }
      });
    }
  }

  // صلاحيات الكاشير
  const cashierPermissions = [
    'dashboard:view', 'pos:view', 'invoices:view', 'customers:view',
    'shifts:view', 'shifts:open', 'shifts:close'
  ];

  console.log('Assigning permissions to Cashier...');
  for (const permKey of cashierPermissions) {
    const [module, action] = permKey.split(':');
    const perm = await db.systemPermission.findFirst({
      where: { module, action }
    });
    if (perm) {
      await db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: cashierRole.id, permissionId: perm.id } },
        update: { allowed: true },
        create: { roleId: cashierRole.id, permissionId: perm.id, allowed: true }
      });
    }
  }

  // إنشاء مستخدم مدير عام افتراضي إذا لم يكن موجوداً
  const existingAdmin = await db.user.findFirst({
    where: { email: 'admin@pos.com' }
  });

  if (!existingAdmin) {
    console.log('Creating default admin user...');
    const hashedPassword = await hash('admin123', 10);
    
    await db.user.create({
      data: {
        email: 'admin@pos.com',
        password: hashedPassword,
        name: 'مدير النظام',
        nameAr: 'مدير النظام',
        roleId: superAdminRole.id,
        isActive: true
      }
    });
  } else {
    // تحديث المستخدم ليستخدم الدور الجديد
    await db.user.update({
      where: { id: existingAdmin.id },
      data: { roleId: superAdminRole.id }
    });
    console.log('Updated existing admin with new role');
  }

  console.log('✅ Roles and permissions initialized successfully!');
}

main()
  .catch((e) => {
    console.error('Error initializing roles:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
