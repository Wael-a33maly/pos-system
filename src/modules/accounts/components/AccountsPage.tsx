'use client';

import { useState } from 'react';
import { Plus, Search, Edit, Trash2, MoreHorizontal, Calculator, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore, formatCurrency } from '@/store';

type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  balance: number;
  isActive: boolean;
}

const mockAccounts: Account[] = [
  { id: '1', code: '1000', name: 'النقدية', type: 'ASSET', balance: 50000, isActive: true },
  { id: '2', code: '1100', name: 'البنك', type: 'ASSET', balance: 125000, isActive: true },
  { id: '3', code: '1200', name: 'المخزون', type: 'ASSET', balance: 85000, isActive: true },
  { id: '4', code: '2000', name: 'الموردين', type: 'LIABILITY', balance: 35000, isActive: true },
  { id: '5', code: '3000', name: 'رأس المال', type: 'EQUITY', balance: 200000, isActive: true },
  { id: '6', code: '4000', name: 'المبيعات', type: 'REVENUE', balance: 180000, isActive: true },
  { id: '7', code: '5000', name: 'المصروفات', type: 'EXPENSE', balance: 45000, isActive: true },
];

const accountTypeLabels: Record<AccountType, { label: string; color: string }> = {
  ASSET: { label: 'أصول', color: 'text-blue-600' },
  LIABILITY: { label: 'خصوم', color: 'text-red-600' },
  EQUITY: { label: 'حقوق الملكية', color: 'text-purple-600' },
  REVENUE: { label: 'إيرادات', color: 'text-green-600' },
  EXPENSE: { label: 'مصروفات', color: 'text-orange-600' },
};

export function AccountsPage() {
  const { currency } = useAppStore();
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', type: 'ASSET' as AccountType, balance: 0 });

  const filteredAccounts = accounts.filter(a =>
    a.name.includes(searchQuery) || a.code.includes(searchQuery)
  );

  const groupedAccounts = {
    ASSET: filteredAccounts.filter(a => a.type === 'ASSET'),
    LIABILITY: filteredAccounts.filter(a => a.type === 'LIABILITY'),
    EQUITY: filteredAccounts.filter(a => a.type === 'EQUITY'),
    REVENUE: filteredAccounts.filter(a => a.type === 'REVENUE'),
    EXPENSE: filteredAccounts.filter(a => a.type === 'EXPENSE'),
  };

  const totalAssets = groupedAccounts.ASSET.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = groupedAccounts.LIABILITY.reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = groupedAccounts.EQUITY.reduce((sum, a) => sum + a.balance, 0);
  const totalRevenue = groupedAccounts.REVENUE.reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = groupedAccounts.EXPENSE.reduce((sum, a) => sum + a.balance, 0);

  const handleAdd = () => {
    setAccounts(prev => [...prev, { id: Date.now().toString(), ...formData, isActive: true }]);
    setShowAddDialog(false);
    setFormData({ code: '', name: '', type: 'ASSET', balance: 0 });
  };

  const handleDelete = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">الحسابات</h1>
          <p className="text-muted-foreground">نظام الحسابات والأرباح والخسائر</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 ml-2" /> إضافة حساب
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">إجمالي الأصول</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAssets, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">إجمالي الخصوم</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalLiabilities, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">حقوق الملكية</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalEquity, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">الإيرادات</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">المصروفات</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalExpenses, currency)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Profit/Loss Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">صافي الربح</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(totalRevenue - totalExpenses, currency)}</p>
            </div>
            {totalRevenue - totalExpenses >= 0 ? (
              <TrendingUp className="h-12 w-12 text-green-600 opacity-50" />
            ) : (
              <TrendingDown className="h-12 w-12 text-red-600 opacity-50" />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرمز</TableHead>
                <TableHead>اسم الحساب</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الرصيد</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedAccounts).map(([type, accs]) => (
                accs.map((account, index) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono">{account.code}</TableCell>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>
                      <span className={accountTypeLabels[account.type as AccountType].color}>
                        {accountTypeLabels[account.type as AccountType].label}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(account.balance, currency)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Edit className="ml-2 h-4 w-4" /> تعديل</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(account.id)}>
                            <Trash2 className="ml-2 h-4 w-4" /> حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة حساب جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>رمز الحساب</Label><Input value={formData.code} onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))} /></div>
              <div>
                <Label>نوع الحساب</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as AccountType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
            <div><Label>اسم الحساب</Label><Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} /></div>
            <div><Label>الرصيد الافتتاحي</Label><Input type="number" value={formData.balance} onChange={(e) => setFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
            <Button onClick={handleAdd}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
