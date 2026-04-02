// ============================================
// Currency Settings Tab - إعدادات العملات
// ============================================

'use client';

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Plus, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CurrencyTabProps, CurrencyData, CurrencyFormData } from './types';

// استخدام memo لتحسين الأداء
export const CurrencySettings = memo(function CurrencySettings({ currencies, setCurrencies }: CurrencyTabProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyData | null>(null);
  const [formData, setFormData] = useState<CurrencyFormData>({
    name: '', nameAr: '', code: '', symbol: '', decimalPlaces: 2, isActive: true
  });

  // حفظ العملة
  const handleSave = () => {
    if (selectedCurrency) {
      setCurrencies(prev => prev.map(c =>
        c.id === selectedCurrency.id ? { ...c, ...formData } : c
      ));
    } else {
      setCurrencies(prev => [...prev, {
        id: Date.now().toString(),
        ...formData,
        isDefault: false,
      }]);
    }
    setShowDialog(false);
    resetForm();
  };

  // حذف العملة
  const handleDelete = (id: string) => {
    const currency = currencies.find(c => c.id === id);
    if (currency?.isDefault) return; // لا يمكن حذف العملة الافتراضية
    setCurrencies(prev => prev.filter(c => c.id !== id));
  };

  // تعيين كافتراضية
  const handleSetDefault = (id: string) => {
    setCurrencies(prev => prev.map(c => ({
      ...c,
      isDefault: c.id === id,
    })));
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({ name: '', nameAr: '', code: '', symbol: '', decimalPlaces: 2, isActive: true });
    setSelectedCurrency(null);
  };

  // فتح للتعديل
  const openEdit = (currency: CurrencyData) => {
    setSelectedCurrency(currency);
    setFormData({
      name: currency.name,
      nameAr: currency.nameAr,
      code: currency.code,
      symbol: currency.symbol,
      decimalPlaces: currency.decimalPlaces,
      isActive: currency.isActive,
    });
    setShowDialog(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* إحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">إجمالي العملات</p>
            <p className="text-3xl font-bold">{currencies.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">العملات النشطة</p>
            <p className="text-3xl font-bold text-emerald-600">{currencies.filter(c => c.isActive).length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">العملة الافتراضية</p>
            <p className="text-xl font-bold text-primary">
              {currencies.find(c => c.isDefault)?.nameAr || '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => { resetForm(); setShowDialog(true); }} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> إضافة عملة
        </Button>
      </div>

      {/* جدول العملات */}
      <Card className="border-border/50 shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>العملة</TableHead>
                <TableHead>الكود</TableHead>
                <TableHead>الرمز</TableHead>
                <TableHead>الخانات العشرية</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencies.map(currency => (
                <TableRow key={currency.id} className={currency.isDefault ? "bg-primary/5" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">{currency.nameAr}</p>
                        <p className="text-xs text-muted-foreground">{currency.name}</p>
                      </div>
                      {currency.isDefault && (
                        <Badge className="mr-2 rounded-lg" variant="default">افتراضية</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded-lg text-sm">{currency.code}</code>
                  </TableCell>
                  <TableCell className="text-lg font-medium">{currency.symbol}</TableCell>
                  <TableCell>{currency.decimalPlaces}</TableCell>
                  <TableCell>
                    <Badge variant={currency.isActive ? 'default' : 'secondary'} className="rounded-lg">
                      {currency.isActive ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-lg">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!currency.isDefault && (
                          <DropdownMenuItem onClick={() => handleSetDefault(currency.id)}>
                            <DollarSign className="ml-2 h-4 w-4" /> تعيين كافتراضية
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => openEdit(currency)}>
                          <Edit className="ml-2 h-4 w-4" /> تعديل
                        </DropdownMenuItem>
                        {!currency.isDefault && (
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(currency.id)}>
                            <Trash2 className="ml-2 h-4 w-4" /> حذف
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* نافذة إضافة/تعديل العملة */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCurrency ? 'تعديل العملة' : 'إضافة عملة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (إنجليزي)</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Saudi Riyal"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                  placeholder="ريال سعودي"
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>كود العملة *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="SAR"
                  maxLength={3}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>الرمز *</Label>
                <Input
                  value={formData.symbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                  placeholder="ر.س"
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>عدد الخانات العشرية</Label>
              <Select
                value={formData.decimalPlaces.toString()}
                onValueChange={(v) => setFormData(prev => ({ ...prev, decimalPlaces: parseInt(v) }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, isActive: v }))}
              />
              <Label>عملة نشطة</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="rounded-xl">إلغاء</Button>
            <Button onClick={handleSave} className="rounded-xl">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
});
