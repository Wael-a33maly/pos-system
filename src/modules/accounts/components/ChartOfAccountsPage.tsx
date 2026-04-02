'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit, Trash2, ChevronLeft, ChevronDown, Folder, FolderOpen,
  Building2, CreditCard, Wallet, TrendingUp, TrendingDown, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore, formatCurrency } from '@/store';
import { accountTypeLabels, AccountType, ChartOfAccount } from '@/types/accounting';
import { toast } from 'sonner';

interface AccountWithChildren extends ChartOfAccount {
  calculatedBalance: number;
  children: AccountWithChildren[];
}

export function ChartOfAccountsPage() {
  const { currency } = useAppStore();
  const [accounts, setAccounts] = useState<AccountWithChildren[]>([]);
  const [flatAccounts, setFlatAccounts] = useState<AccountWithChildren[]>([]);
  const [totals, setTotals] = useState<Record<AccountType, number>>({
    ASSET: 0, LIABILITY: 0, EQUITY: 0, REVENUE: 0, EXPENSE: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountWithChildren | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameAr: '',
    type: 'ASSET' as AccountType,
    parentId: '',
    balance: 0,
  });
  const [saving, setSaving] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      setAccounts(data.accounts || []);
      setFlatAccounts(data.flatAccounts || []);
      setTotals(data.totals || {});
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('حدث خطأ في جلب الحسابات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const toggleExpand = (accountId: string) => {
    setExpandedAccounts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const handleAdd = async () => {
    if (!formData.code || !formData.name) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'حدث خطأ في إنشاء الحساب');
      }

      toast.success('تم إنشاء الحساب بنجاح');
      setShowAddDialog(false);
      setFormData({ code: '', name: '', nameAr: '', type: 'ASSET', parentId: '', balance: 0 });
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedAccount) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/accounts/${selectedAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'حدث خطأ في تحديث الحساب');
      }

      toast.success('تم تحديث الحساب بنجاح');
      setShowEditDialog(false);
      setSelectedAccount(null);
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/accounts/${selectedAccount.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'حدث خطأ في حذف الحساب');
      }

      toast.success('تم حذف الحساب بنجاح');
      setShowDeleteDialog(false);
      setSelectedAccount(null);
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (account: AccountWithChildren) => {
    setSelectedAccount(account);
    setFormData({
      code: account.code,
      name: account.name,
      nameAr: account.nameAr || '',
      type: account.type,
      parentId: account.parentId || '',
      balance: account.balance,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (account: AccountWithChildren) => {
    setSelectedAccount(account);
    setShowDeleteDialog(true);
  };

  // فلترة الحسابات
  const filterAccounts = (accounts: AccountWithChildren[], query: string): AccountWithChildren[] => {
    if (!query) return accounts;

    return accounts.reduce((acc: AccountWithChildren[], account) => {
      const matchesSearch =
        account.code.includes(query) ||
        account.name.toLowerCase().includes(query.toLowerCase()) ||
        (account.nameAr && account.nameAr.includes(query));

      const filteredChildren = filterAccounts(account.children || [], query);

      if (matchesSearch || filteredChildren.length > 0) {
        acc.push({
          ...account,
          children: filteredChildren,
        });
      }

      return acc;
    }, []);
  };

  const filteredAccounts = filterAccounts(accounts, searchQuery);

  // عرض شجرة الحسابات
  const renderAccountTree = (accountList: AccountWithChildren[], depth = 0) => {
    return accountList.map((account) => {
      const hasChildren = account.children && account.children.length > 0;
      const isExpanded = expandedAccounts.has(account.id);
      const typeInfo = accountTypeLabels[account.type];

      return (
        <div key={account.id}>
          <div
            className={`flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors ${depth > 0 ? 'mr-6' : ''}`}
            style={{ marginRight: `${depth * 24}px` }}
          >
            <button
              onClick={() => hasChildren && toggleExpand(account.id)}
              className={`p-1 hover:bg-muted rounded ${hasChildren ? 'cursor-pointer' : 'invisible'}`}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )
              ) : (
                <div className="w-4" />
              )}
            </button>

            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-5 w-5 text-primary" />
              ) : (
                <Folder className="h-5 w-5 text-primary" />
              )
            ) : (
              <div className="w-5 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">{account.code}</span>
                <span className="font-medium truncate">{account.nameAr || account.name}</span>
                <Badge variant="outline" className={typeInfo.color}>
                  {typeInfo.label}
                </Badge>
                {!account.isActive && (
                  <Badge variant="secondary">غير نشط</Badge>
                )}
              </div>
            </div>

            <div className="text-left font-medium">
              {formatCurrency(account.calculatedBalance, currency)}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditDialog(account)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openDeleteDialog(account)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>

          {hasChildren && isExpanded && renderAccountTree(account.children, depth + 1)}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">شجرة الحسابات</h1>
          <p className="text-muted-foreground">الدليل المحاسبي وشجرة الحسابات الهرمية</p>
        </div>
        <Button onClick={() => {
          setFormData({ code: '', name: '', nameAr: '', type: 'ASSET', parentId: '', balance: 0 });
          setShowAddDialog(true);
        }}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة حساب
        </Button>
      </div>

      {/* ملخص الأرصدة */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">الأصول</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(totals.ASSET, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">الخصوم</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(totals.LIABILITY, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">حقوق الملكية</p>
                <p className="text-lg font-bold text-purple-600">{formatCurrency(totals.EQUITY, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">الإيرادات</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totals.REVENUE, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">المصروفات</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(totals.EXPENSE, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* البحث */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث في الحسابات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* شجرة الحسابات */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">الدليل المحاسبي</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {filteredAccounts.length > 0 ? (
              renderAccountTree(filteredAccounts)
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                لا توجد حسابات
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* نموذج إضافة حساب */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة حساب جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>كود الحساب *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="1000"
                />
              </div>
              <div>
                <Label>نوع الحساب</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, type: v as AccountType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASSET">أصول</SelectItem>
                    <SelectItem value="LIABILITY">خصوم</SelectItem>
                    <SelectItem value="EQUITY">حقوق الملكية</SelectItem>
                    <SelectItem value="REVENUE">إيرادات</SelectItem>
                    <SelectItem value="EXPENSE">مصروفات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>اسم الحساب (إنجليزي) *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Cash"
              />
            </div>
            <div>
              <Label>اسم الحساب (عربي)</Label>
              <Input
                value={formData.nameAr}
                onChange={(e) => setFormData((prev) => ({ ...prev, nameAr: e.target.value }))}
                placeholder="النقدية"
              />
            </div>
            <div>
              <Label>الحساب الأب</Label>
              <Select
                value={formData.parentId}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, parentId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="بدون (حساب رئيسي)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">بدون (حساب رئيسي)</SelectItem>
                  {flatAccounts
                    .filter((a) => a.type === formData.type)
                    .map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.code} - {account.nameAr || account.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الرصيد الافتتاحي</Label>
              <Input
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData((prev) => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نموذج تعديل حساب */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الحساب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>كود الحساب *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                />
              </div>
              <div>
                <Label>نوع الحساب</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, type: v as AccountType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASSET">أصول</SelectItem>
                    <SelectItem value="LIABILITY">خصوم</SelectItem>
                    <SelectItem value="EQUITY">حقوق الملكية</SelectItem>
                    <SelectItem value="REVENUE">إيرادات</SelectItem>
                    <SelectItem value="EXPENSE">مصروفات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>اسم الحساب (إنجليزي) *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>اسم الحساب (عربي)</Label>
              <Input
                value={formData.nameAr}
                onChange={(e) => setFormData((prev) => ({ ...prev, nameAr: e.target.value }))}
              />
            </div>
            <div>
              <Label>الرصيد الافتتاحي</Label>
              <Input
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData((prev) => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تأكيد الحذف */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الحساب "{selectedAccount?.nameAr || selectedAccount?.name}"؟
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {saving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
