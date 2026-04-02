'use client';

import { useState } from 'react';
import { Plus, Search, Edit, Trash2, MoreHorizontal, Wallet, Calendar, TrendingDown, Folder, FolderOpen, ChevronLeft, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAppStore, formatCurrency } from '@/store';
import { cn } from '@/lib/utils';
import type { Expense, ExpenseCategory } from '@/types';

// واجهة الفئة مع الدعم للفئات الفرعية
interface ExpenseCategoryWithChildren extends ExpenseCategory {
  parentId?: string;
  children?: ExpenseCategoryWithChildren[];
}

const mockCategories: ExpenseCategoryWithChildren[] = [
  { id: '1', name: 'رواتب وأجور', isActive: true, children: [
    { id: '1-1', name: 'رواتب الموظفين', isActive: true, parentId: '1' },
    { id: '1-2', name: 'مكافآت', isActive: true, parentId: '1' },
    { id: '1-3', name: 'بدلات', isActive: true, parentId: '1' },
  ]},
  { id: '2', name: 'إيجارات', isActive: true, children: [
    { id: '2-1', name: 'إيجار المحل', isActive: true, parentId: '2' },
    { id: '2-2', name: 'إيجار المستودع', isActive: true, parentId: '2' },
  ]},
  { id: '3', name: 'مرافق', isActive: true, children: [
    { id: '3-1', name: 'كهرباء', isActive: true, parentId: '3' },
    { id: '3-2', name: 'ماء', isActive: true, parentId: '3' },
    { id: '3-3', name: 'غاز', isActive: true, parentId: '3' },
    { id: '3-4', name: 'إنترنت', isActive: true, parentId: '3' },
  ]},
  { id: '4', name: 'صيانة', isActive: true, children: [
    { id: '4-1', name: 'صيانة المعدات', isActive: true, parentId: '4' },
    { id: '4-2', name: 'صيانة المبنى', isActive: true, parentId: '4' },
  ]},
  { id: '5', name: 'مشتريات', isActive: true, children: [
    { id: '5-1', name: 'قرطاسية', isActive: true, parentId: '5' },
    { id: '5-2', name: 'مستلزمات نظافة', isActive: true, parentId: '5' },
  ]},
  { id: '6', name: 'أخرى', isActive: true },
];

// الحصول على جميع الفئات (مسطحة)
const getAllCategories = (categories: ExpenseCategoryWithChildren[]): ExpenseCategoryWithChildren[] => {
  const result: ExpenseCategoryWithChildren[] = [];
  const flatten = (cats: ExpenseCategoryWithChildren[]) => {
    cats.forEach(cat => {
      result.push(cat);
      if (cat.children) flatten(cat.children);
    });
  };
  flatten(categories);
  return result;
};

const allCategories = getAllCategories(mockCategories);

const mockExpenses: (Expense & { category: ExpenseCategoryWithChildren })[] = [
  { id: '1', branchId: '1', categoryId: '1-1', category: allCategories.find(c => c.id === '1-1')!, amount: 15000, description: 'رواتب الموظفين لشهر يناير', date: new Date(Date.now() - 86400000), createdAt: new Date(), updatedAt: new Date() },
  { id: '2', branchId: '1', categoryId: '2-1', category: allCategories.find(c => c.id === '2-1')!, amount: 5000, description: 'إيجار المحل - الشهر الحالي', date: new Date(Date.now() - 172800000), createdAt: new Date(), updatedAt: new Date() },
  { id: '3', branchId: '1', categoryId: '3-1', category: allCategories.find(c => c.id === '3-1')!, amount: 500, description: 'فاتورة الكهرباء', date: new Date(Date.now() - 259200000), createdAt: new Date(), updatedAt: new Date() },
  { id: '4', branchId: '1', categoryId: '3-4', category: allCategories.find(c => c.id === '3-4')!, amount: 200, description: 'اشتراك الإنترنت', date: new Date(Date.now() - 345600000), createdAt: new Date(), updatedAt: new Date() },
  { id: '5', branchId: '1', categoryId: '4-1', category: allCategories.find(c => c.id === '4-1')!, amount: 350, description: 'إصلاح طابعة الفواتير', date: new Date(Date.now() - 432000000), createdAt: new Date(), updatedAt: new Date() },
];

export function ExpensesPage() {
  const { currency } = useAppStore();
  const [expenses, setExpenses] = useState<(Expense & { category: ExpenseCategoryWithChildren })[]>(mockExpenses);
  const [categories, setCategories] = useState<ExpenseCategoryWithChildren[]>(mockCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<typeof mockExpenses[0] | null>(null);
  const [formData, setFormData] = useState({ categoryId: '', amount: 0, description: '' });
  const [categoryName, setCategoryName] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState<string>('none');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['1', '2', '3']);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleAddExpense = () => {
    const allCats = getAllCategories(categories);
    const category = allCats.find(c => c.id === formData.categoryId);
    if (!category) return;
    
    const newExpense = {
      id: Date.now().toString(),
      branchId: '1',
      categoryId: formData.categoryId,
      category,
      amount: formData.amount,
      description: formData.description,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setExpenses(prev => [newExpense, ...prev]);
    setShowAddDialog(false);
    setFormData({ categoryId: '', amount: 0, description: '' });
  };

  const handleDelete = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleAddCategory = () => {
    if (!categoryName.trim()) return;
    
    const newCategory: ExpenseCategoryWithChildren = {
      id: Date.now().toString(),
      name: categoryName,
      isActive: true,
      parentId: parentCategoryId !== 'none' ? parentCategoryId : undefined,
    };

    if (parentCategoryId !== 'none') {
      // إضافة فئة فرعية
      const addToParent = (cats: ExpenseCategoryWithChildren[]): ExpenseCategoryWithChildren[] => {
        return cats.map(cat => {
          if (cat.id === parentCategoryId) {
            return { ...cat, children: [...(cat.children || []), newCategory] };
          }
          if (cat.children) {
            return { ...cat, children: addToParent(cat.children) };
          }
          return cat;
        });
      };
      setCategories(prev => addToParent(prev));
    } else {
      // إضافة فئة رئيسية
      setCategories(prev => [...prev, newCategory]);
    }
    
    setShowCategoryDialog(false);
    setCategoryName('');
    setParentCategoryId('none');
  };

  // مكون عرض شجرة الفئات
  const CategoryTree = ({ categories, level = 0 }: { categories: ExpenseCategoryWithChildren[], level?: number }) => (
    <div className="space-y-1">
      {categories.map(category => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedCategories.includes(category.id);
        
        return (
          <div key={category.id}>
            <div 
              className={cn(
                "flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer",
                level > 0 && "mr-6"
              )}
            >
              <div className="flex items-center gap-2">
                {hasChildren ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => toggleCategory(category.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  <div className="w-6" />
                )}
                {hasChildren ? (
                  isExpanded ? (
                    <FolderOpen className="h-4 w-4 text-primary" />
                  ) : (
                    <Folder className="h-4 w-4 text-primary" />
                  )
                ) : (
                  <div className="w-4" />
                )}
                <span className={cn("font-medium", hasChildren && "text-primary")}>
                  {category.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasChildren && (
                  <Badge variant="secondary" className="text-xs">
                    {category.children?.length} فئات
                  </Badge>
                )}
                <Badge variant={category.isActive ? 'default' : 'secondary'}>
                  {category.isActive ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>
            </div>
            {hasChildren && isExpanded && (
              <CategoryTree categories={category.children!} level={level + 1} />
            )}
          </div>
        );
      })}
    </div>
  );

  // الحصول على جميع الفئات للقائمة المنسدلة
  const flatCategories = getAllCategories(categories);
  const mainCategories = categories.filter(c => !c.parentId);

  // تصفية المصروفات
  const filteredExpenses = expenses.filter(e => 
    e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">المصروفات</h1>
          <p className="text-muted-foreground">إدارة المصروفات وفئاتها الهرمية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCategoryDialog(true)}>
            <Plus className="h-4 w-4 ml-2" /> إضافة فئة
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 ml-2" /> إضافة مصروف
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">إجمالي المصروفات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(totalExpenses, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">عدد العمليات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{expenses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">عدد الفئات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{flatCategories.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="بحث في المصروفات..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="pr-10" 
        />
      </div>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">المصروفات</TabsTrigger>
          <TabsTrigger value="categories">شجرة الفئات</TabsTrigger>
        </TabsList>
        
        <TabsContent value="expenses">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map(expense => (
                    <TableRow key={expense.id}>
                      <TableCell>{new Date(expense.date).toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{expense.category.name}</Badge>
                          {expense.category.parentId && (
                            <span className="text-xs text-muted-foreground">
                              ({flatCategories.find(c => c.id === expense.category.parentId)?.name})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{expense.description || '-'}</TableCell>
                      <TableCell className="font-medium text-red-600">
                        {formatCurrency(expense.amount, currency)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(expense.id)}>
                              <Trash2 className="ml-2 h-4 w-4" /> حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">شجرة فئات المصروفات</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <CategoryTree categories={categories} />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* إضافة مصروف */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مصروف جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>الفئة *</Label>
              <Select value={formData.categoryId} onValueChange={(v) => setFormData(prev => ({ ...prev, categoryId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {mainCategories.map(mainCat => (
                    <div key={mainCat.id}>
                      <SelectItem value={mainCat.id} className="font-bold">
                        📁 {mainCat.name}
                      </SelectItem>
                      {mainCat.children?.map(subCat => (
                        <SelectItem key={subCat.id} value={subCat.id} className="mr-4">
                          └ {subCat.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المبلغ *</Label>
              <Input 
                type="number" 
                value={formData.amount} 
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} 
              />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
            <Button onClick={handleAddExpense}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* إضافة فئة */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة فئة مصروفات</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>الفئة الأم (اختياري)</Label>
              <Select value={parentCategoryId} onValueChange={setParentCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="فئة رئيسية (بدون أم)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">فئة رئيسية (بدون أم)</SelectItem>
                  {mainCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      📁 {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>اسم الفئة *</Label>
              <Input 
                value={categoryName} 
                onChange={(e) => setCategoryName(e.target.value)} 
                placeholder={parentCategoryId !== 'none' ? "مثال: كهرباء، ماء، غاز" : "مثال: رواتب، إيجارات، مرافق"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>إلغاء</Button>
            <Button onClick={handleAddCategory}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
