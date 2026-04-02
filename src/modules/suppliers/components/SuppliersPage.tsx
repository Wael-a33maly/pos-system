'use client';

import { useState } from 'react';
import { Plus, Search, Edit, Trash2, MoreHorizontal, Building2, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { Supplier } from '@/types';

const mockSuppliers: Supplier[] = [
  { id: '1', name: 'شركة التوريدات الأولى', nameAr: 'شركة التوريدات الأولى', phone: '0112345678', email: 'info@supplier1.com', isActive: true },
  { id: '2', name: 'شركة الأغذية المتحدة', nameAr: 'شركة الأغذية المتحدة', phone: '0112345679', email: 'info@supplier2.com', isActive: true },
  { id: '3', name: 'مؤسسة التقنية الحديثة', nameAr: 'مؤسسة التقنية الحديثة', phone: '0112345680', isActive: true },
  { id: '4', name: 'شركة الملابس العربية', nameAr: 'شركة الملابس العربية', phone: '0112345681', isActive: false },
];

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '', nameAr: '', phone: '', email: '', address: '', taxNumber: '', notes: '', isActive: true
  });

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone?.includes(searchQuery)
  );

  const handleSave = () => {
    if (selectedSupplier) {
      setSuppliers(prev => prev.map(s => s.id === selectedSupplier.id ? { ...s, ...formData } : s));
    } else {
      setSuppliers(prev => [...prev, { id: Date.now().toString(), ...formData }]);
    }
    setShowAddDialog(false);
    resetForm();
  };

  const handleDelete = () => {
    if (selectedSupplier) {
      setSuppliers(prev => prev.filter(s => s.id !== selectedSupplier.id));
      setShowDeleteDialog(false);
      setSelectedSupplier(null);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', nameAr: '', phone: '', email: '', address: '', taxNumber: '', notes: '', isActive: true });
    setSelectedSupplier(null);
  };

  const openEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name, nameAr: supplier.nameAr || '', phone: supplier.phone || '',
      email: supplier.email || '', address: supplier.address || '', taxNumber: supplier.taxNumber || '',
      notes: supplier.notes || '', isActive: supplier.isActive
    });
    setShowAddDialog(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">الموردين</h1>
          <p className="text-muted-foreground">إدارة الشركات الموردة</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
          <Plus className="h-4 w-4 ml-2" /> إضافة مورد
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المورد</TableHead>
                <TableHead>رقم الهاتف</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map(supplier => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{supplier.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{supplier.phone ? <div className="flex items-center gap-1"><Phone className="h-4 w-4" />{supplier.phone}</div> : '-'}</TableCell>
                  <TableCell>{supplier.email ? <div className="flex items-center gap-1"><Mail className="h-4 w-4" />{supplier.email}</div> : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={supplier.isActive ? 'default' : 'secondary'}>{supplier.isActive ? 'نشط' : 'غير نشط'}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(supplier)}><Edit className="ml-2 h-4 w-4" /> تعديل</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedSupplier(supplier); setShowDeleteDialog(true); }}>
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

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedSupplier ? 'تعديل المورد' : 'إضافة مورد جديد'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2"><Label>اسم الشركة *</Label><Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} /></div>
            <div><Label>رقم الهاتف</Label><Input value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} /></div>
            <div><Label>البريد الإلكتروني</Label><Input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} /></div>
            <div className="col-span-2"><Label>العنوان</Label><Input value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} /></div>
            <div><Label>الرقم الضريبي</Label><Input value={formData.taxNumber} onChange={(e) => setFormData(prev => ({ ...prev, taxNumber: e.target.value }))} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData(prev => ({ ...prev, isActive: v }))} />
              <Label>مورد نشط</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف "{selectedSupplier?.name}"؟</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
