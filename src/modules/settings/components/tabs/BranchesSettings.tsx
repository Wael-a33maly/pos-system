// ============================================
// Branches Settings Tab - إعدادات الفروع
// ============================================

'use client';

import { memo, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Edit, Trash2, MoreHorizontal, Search, MapPin, Phone } from 'lucide-react';
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BranchesTabProps, BranchFormData } from './types';
import type { Branch } from '@/types';

// استخدام memo لتحسين الأداء
export const BranchesSettings = memo(function BranchesSettings({ branches, setBranches }: BranchesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>({
    name: '', nameAr: '', address: '', phone: '', email: '', isActive: true
  });

  // تصفية الفروع
  const filteredBranches = useMemo(() =>
    branches.filter(b =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [branches, searchQuery]
  );

  // حفظ الفرع
  const handleSave = () => {
    if (selectedBranch) {
      setBranches(prev => prev.map(b =>
        b.id === selectedBranch.id ? { ...b, ...formData } : b
      ));
    } else {
      setBranches(prev => [...prev, {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);
    }
    setShowDialog(false);
    resetForm();
  };

  // حذف الفرع
  const handleDelete = () => {
    if (selectedBranch) {
      setBranches(prev => prev.filter(b => b.id !== selectedBranch.id));
      setShowDeleteDialog(false);
      setSelectedBranch(null);
    }
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({ name: '', nameAr: '', address: '', phone: '', email: '', isActive: true });
    setSelectedBranch(null);
  };

  // فتح للتعديل
  const openEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      nameAr: branch.nameAr || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      isActive: branch.isActive,
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
            <p className="text-sm text-muted-foreground">إجمالي الفروع</p>
            <p className="text-3xl font-bold">{branches.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">الفروع النشطة</p>
            <p className="text-3xl font-bold text-emerald-600">{branches.filter(b => b.isActive).length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">الفروع غير النشطة</p>
            <p className="text-3xl font-bold text-red-600">{branches.filter(b => !b.isActive).length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في الفروع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 rounded-xl"
          />
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> إضافة فرع
        </Button>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>الفرع</TableHead>
                <TableHead>العنوان</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBranches.map(branch => (
                <TableRow key={branch.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="font-medium">{branch.name}</p>
                        {branch.nameAr && <p className="text-xs text-muted-foreground">{branch.nameAr}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {branch.address ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {branch.address}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {branch.phone ? (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {branch.phone}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={branch.isActive ? 'default' : 'secondary'} className="rounded-lg">
                      {branch.isActive ? 'نشط' : 'غير نشط'}
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
                        <DropdownMenuItem onClick={() => openEdit(branch)}>
                          <Edit className="ml-2 h-4 w-4" /> تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedBranch(branch); setShowDeleteDialog(true); }}>
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

      {/* نافذة إضافة/تعديل فرع */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selectedBranch ? 'تعديل الفرع' : 'إضافة فرع جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم الفرع *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالعربي</Label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, isActive: v }))}
              />
              <Label>فرع نشط</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="rounded-xl">إلغاء</Button>
            <Button onClick={handleSave} className="rounded-xl">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة تأكيد الحذف */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف "{selectedBranch?.name}"؟</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="rounded-xl">إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-xl">حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
});
