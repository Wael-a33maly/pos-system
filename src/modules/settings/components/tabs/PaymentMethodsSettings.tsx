// ============================================
// Payment Methods Settings Tab - إعدادات طرق الدفع
// ============================================

'use client';

import { memo, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Plus, Edit, Trash2, MoreHorizontal, Search } from 'lucide-react';
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
import type { PaymentMethodsTabProps, PaymentFormData } from './types';
import type { PaymentMethod } from '@/types';

// استخدام memo لتحسين الأداء
export const PaymentMethodsSettings = memo(function PaymentMethodsSettings({ 
  paymentMethods, 
  setPaymentMethods 
}: PaymentMethodsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<PaymentFormData>({
    name: '', nameAr: '', code: '', isActive: true
  });

  // تصفية طرق الدفع
  const filteredMethods = useMemo(() => 
    paymentMethods.filter(m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nameAr?.includes(searchQuery)
    ),
    [paymentMethods, searchQuery]
  );

  // حفظ طريقة الدفع
  const handleSave = () => {
    if (selectedMethod) {
      setPaymentMethods(prev => prev.map(m =>
        m.id === selectedMethod.id ? { ...m, ...formData } : m
      ));
    } else {
      setPaymentMethods(prev => [...prev, {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);
    }
    setShowDialog(false);
    resetForm();
  };

  // حذف طريقة الدفع
  const handleDelete = (id: string) => {
    setPaymentMethods(prev => prev.filter(m => m.id !== id));
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({ name: '', nameAr: '', code: '', isActive: true });
    setSelectedMethod(null);
  };

  // فتح للتعديل
  const openEdit = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setFormData({
      name: method.name,
      nameAr: method.nameAr || '',
      code: method.code,
      isActive: method.isActive,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في طرق الدفع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 rounded-xl"
          />
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> إضافة طريقة دفع
        </Button>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>الكود</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMethods.map(method => (
                <TableRow key={method.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium">{method.name}</p>
                        <p className="text-xs text-muted-foreground">{method.nameAr}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded-lg text-sm">{method.code}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={method.isActive ? 'default' : 'secondary'} className="rounded-lg">
                      {method.isActive ? 'نشط' : 'غير نشط'}
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
                        <DropdownMenuItem onClick={() => openEdit(method)}>
                          <Edit className="ml-2 h-4 w-4" /> تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(method.id)}>
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

      {/* نافذة إضافة/تعديل طريقة الدفع */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMethod ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (إنجليزي)</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الكود *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="CASH"
                className="rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, isActive: v }))}
              />
              <Label>طريقة دفع نشطة</Label>
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
