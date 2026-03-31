// ============================================
// Customers Page - صفحة العملاء
// ============================================

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, MoreHorizontal, Phone, Mail, User, Users, UserCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAppStore, formatCurrency } from '@/store';
import { cn } from '@/lib/utils';

import { useCustomers } from '../hooks';
import type { Customer, CustomerFormData } from '../types';

// Stats Card Component
function StatsCard({ title, value, subtitle, icon: Icon, gradient, delay = 0 }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <div className={cn("absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity", gradient)} />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <motion.p className="text-3xl font-bold mt-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: delay + 0.1 }}>{value}</motion.p>
              {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            <motion.div className={cn("p-3 rounded-xl", gradient)} whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300 }}>
              <Icon className="h-6 w-6 text-white" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Skeleton Loader
function CustomersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}><CardContent className="p-6"><div className="animate-pulse space-y-3"><div className="h-4 bg-muted rounded w-1/2" /><div className="h-8 bg-muted rounded w-3/4" /></div></CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="p-0">{[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b">
          <div className="animate-pulse w-10 h-10 bg-muted rounded-full" />
          <div className="flex-1 space-y-2"><div className="animate-pulse h-4 bg-muted rounded w-1/3" /><div className="animate-pulse h-3 bg-muted rounded w-1/4" /></div>
        </div>
      ))}</CardContent></Card>
    </div>
  );
}

const defaultFormData: CustomerFormData = {
  name: '', nameAr: '', phone: '', email: '', address: '', taxNumber: '', notes: '', isActive: true
};

export function CustomersPage() {
  const { currency } = useAppStore();
  const { loading, searchQuery, setSearchQuery, saveCustomer, deleteCustomer, filteredCustomers, stats } = useCustomers();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(defaultFormData);

  const handleSave = async () => {
    const success = await saveCustomer(formData, selectedCustomer);
    if (success) {
      setShowAddDialog(false);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    const success = await deleteCustomer(selectedCustomer.id);
    if (success) {
      setShowDeleteDialog(false);
      setSelectedCustomer(null);
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setSelectedCustomer(null);
  };

  const openEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name, nameAr: customer.nameAr || '', phone: customer.phone || '',
      email: customer.email || '', address: customer.address || '', taxNumber: customer.taxNumber || '',
      notes: customer.notes || '', isActive: customer.isActive
    });
    setShowAddDialog(true);
  };

  if (loading) return <div className="p-6"><CustomersSkeleton /></div>;

  return (
    <div className="p-6 space-y-6 pb-10">
      {/* Header */}
      <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="text-3xl font-bold">العملاء</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1"><Users className="h-4 w-4" />إدارة بيانات العملاء</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="gap-2"><Plus className="h-4 w-4" /> إضافة عميل</Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="إجمالي العملاء" value={stats.totalCustomers} icon={Users} gradient="bg-gradient-to-br from-blue-500 to-blue-600" delay={0} />
        <StatsCard title="العملاء النشطين" value={stats.activeCustomers} icon={UserCheck} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" delay={0.1} />
        <StatsCard title="إجمالي المشتريات" value={formatCurrency(125000, currency)} subtitle="هذا الشهر" icon={ShoppingBag} gradient="bg-gradient-to-br from-purple-500 to-purple-600" delay={0.2} />
      </div>

      {/* Search */}
      <motion.div className="relative max-w-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="بحث بالاسم أو الجوال..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 bg-background/50" />
      </motion.div>

      {/* Customers Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {filteredCustomers.length === 0 ? (
              <motion.div className="flex flex-col items-center justify-center py-16 text-muted-foreground" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}><Users className="h-16 w-16 mb-4 opacity-50" /></motion.div>
                <p className="text-lg font-medium">لا يوجد عملاء</p>
                <p className="text-sm">أضف عميلاً جديداً للبدء</p>
              </motion.div>
            ) : (
              <Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead>العميل</TableHead><TableHead>رقم الجوال</TableHead><TableHead>البريد الإلكتروني</TableHead><TableHead>الحالة</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div><p className="font-medium">{customer.name}</p>{customer.nameAr && <p className="text-xs text-muted-foreground">{customer.nameAr}</p>}</div>
                          </div>
                        </TableCell>
                        <TableCell>{customer.phone ? <div className="flex items-center gap-1 text-muted-foreground"><Phone className="h-4 w-4" /><span className="font-mono">{customer.phone}</span></div> : '-'}</TableCell>
                        <TableCell>{customer.email ? <div className="flex items-center gap-1 text-muted-foreground"><Mail className="h-4 w-4" />{customer.email}</div> : '-'}</TableCell>
                        <TableCell><Badge variant={customer.isActive ? 'default' : 'secondary'} className={cn(customer.isActive && "bg-emerald-500 hover:bg-emerald-600")}>{customer.isActive ? 'نشط' : 'غير نشط'}</Badge></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(customer)}><Edit className="ml-2 h-4 w-4" /> تعديل</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedCustomer(customer); setShowDeleteDialog(true); }}><Trash2 className="ml-2 h-4 w-4" /> حذف</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" />{selectedCustomer ? 'تعديل العميل' : 'إضافة عميل جديد'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div><Label>الاسم *</Label><Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} /></div>
            <div><Label>الاسم بالعربي</Label><Input value={formData.nameAr} onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))} /></div>
            <div><Label>رقم الجوال</Label><Input value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} /></div>
            <div><Label>البريد الإلكتروني</Label><Input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} /></div>
            <div className="col-span-2"><Label>العنوان</Label><Input value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} /></div>
            <div><Label>الرقم الضريبي</Label><Input value={formData.taxNumber} onChange={(e) => setFormData(prev => ({ ...prev, taxNumber: e.target.value }))} /></div>
            <div className="flex items-center gap-2 pt-6"><Switch checked={formData.isActive} onCheckedChange={(v) => setFormData(prev => ({ ...prev, isActive: v }))} /><Label>عميل نشط</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave} className="gap-2"><Sparkles className="h-4 w-4" />حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-destructive">تأكيد الحذف</DialogTitle><DialogDescription>هل أنت متأكد من حذف "{selectedCustomer?.name}"؟</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
