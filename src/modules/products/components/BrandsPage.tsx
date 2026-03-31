'use client';

import { useState } from 'react';
import { Plus, Search, Edit, Trash2, MoreHorizontal, Image as ImageIcon } from 'lucide-react';
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
import type { Brand } from '@/types';

const mockBrands: Brand[] = [
  { id: '1', name: 'Apple', nameAr: 'آبل', isActive: true },
  { id: '2', name: 'Samsung', nameAr: 'سامسونج', isActive: true },
  { id: '3', name: 'Sony', nameAr: 'سوني', isActive: true },
  { id: '4', name: 'LG', nameAr: 'إل جي', isActive: true },
  { id: '5', name: 'Huawei', nameAr: 'هواوي', isActive: false },
];

export function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>(mockBrands);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({ name: '', nameAr: '', description: '', isActive: true });

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.nameAr?.includes(searchQuery)
  );

  const handleSave = () => {
    if (selectedBrand) {
      setBrands(prev => prev.map(b => b.id === selectedBrand.id ? { ...b, ...formData } : b));
    } else {
      setBrands(prev => [...prev, { id: Date.now().toString(), ...formData }]);
    }
    setShowAddDialog(false);
    resetForm();
  };

  const handleDelete = () => {
    if (selectedBrand) {
      setBrands(prev => prev.filter(b => b.id !== selectedBrand.id));
      setShowDeleteDialog(false);
      setSelectedBrand(null);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', nameAr: '', description: '', isActive: true });
    setSelectedBrand(null);
  };

  const openEdit = (brand: Brand) => {
    setSelectedBrand(brand);
    setFormData({ name: brand.name, nameAr: brand.nameAr || '', description: brand.description || '', isActive: brand.isActive });
    setShowAddDialog(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">البراندات</h1>
          <p className="text-muted-foreground">إدارة العلامات التجارية</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
          <Plus className="h-4 w-4 ml-2" /> إضافة براند
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
                <TableHead>البراند</TableHead>
                <TableHead>الاسم بالعربي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrands.map(brand => (
                <TableRow key={brand.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{brand.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{brand.nameAr || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={brand.isActive ? 'default' : 'secondary'}>
                      {brand.isActive ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(brand)}><Edit className="ml-2 h-4 w-4" /> تعديل</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedBrand(brand); setShowDeleteDialog(true); }}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedBrand ? 'تعديل البراند' : 'إضافة براند جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الاسم (إنجليزي) *</Label>
                <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <Label>الاسم (عربي)</Label>
                <Input value={formData.nameAr} onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData(prev => ({ ...prev, isActive: v }))} />
              <Label>براند نشط</Label>
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
            <DialogDescription>هل أنت متأكد من حذف "{selectedBrand?.name}"؟</DialogDescription>
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
