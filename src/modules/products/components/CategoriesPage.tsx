'use client';

import { useState } from 'react';
import {
  Plus, Search, Edit, Trash2, MoreHorizontal, Folder, FolderOpen, ChevronLeft, ChevronDown
} from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import type { Category } from '@/types';

// Mock data
const mockCategories: Category[] = [
  { id: '1', name: 'إلكترونيات', color: '#3b82f6', isActive: true, sortOrder: 0 },
  { id: '2', name: 'ملابس', color: '#10b981', isActive: true, sortOrder: 1 },
  { id: '3', name: 'أغذية', color: '#f59e0b', isActive: true, sortOrder: 2 },
  { id: '4', name: 'أجهزة كهربائية', color: '#8b5cf6', parentId: '1', isActive: true, sortOrder: 0 },
  { id: '5', name: 'اكسسوارات', color: '#ec4899', parentId: '1', isActive: true, sortOrder: 1 },
  { id: '6', name: 'رجالي', color: '#06b6d4', parentId: '2', isActive: true, sortOrder: 0 },
  { id: '7', name: 'نسائي', color: '#f43f5e', parentId: '2', isActive: true, sortOrder: 1 },
];

const colorOptions = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    parentId: '',
    color: '#3b82f6',
    isActive: true,
  });

  const mainCategories = categories.filter(c => !c.parentId);
  const filteredCategories = searchQuery
    ? categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : mainCategories;

  const getChildCategories = (parentId: string) => 
    categories.filter(c => c.parentId === parentId);

  const toggleExpanded = (id: string) => {
    setExpandedCategories(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (selectedCategory) {
      setCategories(prev => prev.map(c => 
        c.id === selectedCategory.id ? { ...c, ...formData } : c
      ));
    } else {
      const newCategory: Category = {
        id: Date.now().toString(),
        ...formData,
        sortOrder: categories.length,
      };
      setCategories(prev => [...prev, newCategory]);
    }
    setShowAddDialog(false);
    resetForm();
  };

  const handleDelete = () => {
    if (selectedCategory) {
      setCategories(prev => prev.filter(c => c.id !== selectedCategory.id && c.parentId !== selectedCategory.id));
      setShowDeleteDialog(false);
      setSelectedCategory(null);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', nameAr: '', parentId: '', color: '#3b82f6', isActive: true });
    setSelectedCategory(null);
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      nameAr: category.nameAr || '',
      parentId: category.parentId || '',
      color: category.color || '#3b82f6',
      isActive: category.isActive,
    });
    setShowAddDialog(true);
  };

  // Flatten categories for rendering (instead of using Collapsible inside table)
  const flattenCategories = (cats: Category[], depth = 0): Array<Category & { depth: number; hasChildren: boolean; isExpanded: boolean }> => {
    const result: Array<Category & { depth: number; hasChildren: boolean; isExpanded: boolean }> = [];
    
    cats.forEach(cat => {
      const children = getChildCategories(cat.id);
      const hasChildren = children.length > 0;
      const isExpanded = expandedCategories.includes(cat.id);
      
      result.push({ ...cat, depth, hasChildren, isExpanded });
      
      if (hasChildren && isExpanded) {
        result.push(...flattenCategories(children, depth + 1));
      }
    });
    
    return result;
  };

  const flattenedCategories = flattenCategories(filteredCategories);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">الفئات</h1>
          <p className="text-muted-foreground">إدارة فئات المنتجات الرئيسية والفرعية</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
          <Plus className="h-4 w-4 ml-2" /> إضافة فئة
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم الفئة</TableHead>
              <TableHead>الفئات الفرعية</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {flattenedCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  لا توجد فئات
                </TableCell>
              </TableRow>
            ) : (
              flattenedCategories.map(cat => (
                <TableRow 
                  key={cat.id} 
                  className={cat.depth > 0 ? 'bg-muted/30' : ''}
                >
                  <TableCell>
                    <div className="flex items-center gap-2" style={{ paddingRight: cat.depth * 24 }}>
                      {cat.hasChildren ? (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => toggleExpanded(cat.id)}
                        >
                          {cat.isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronLeft className="h-4 w-4" />
                          )}
                        </Button>
                      ) : (
                        <span className="w-6" />
                      )}
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.hasChildren ? (
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Folder className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{cat.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {cat.hasChildren ? `${getChildCategories(cat.id).length} فئة فرعية` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={cat.isActive ? 'default' : 'secondary'}>
                      {cat.isActive ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(cat)}>
                          <Edit className="ml-2 h-4 w-4" /> تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { 
                          setSelectedCategory(cat); 
                          setFormData(prev => ({ ...prev, parentId: cat.id })); 
                          setShowAddDialog(true); 
                        }}>
                          <Plus className="ml-2 h-4 w-4" /> إضافة فرعي
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive" 
                          onClick={() => { 
                            setSelectedCategory(cat); 
                            setShowDeleteDialog(true); 
                          }}
                        >
                          <Trash2 className="ml-2 h-4 w-4" /> حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>اسم الفئة *</Label>
              <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <Label>الفئة الأم</Label>
              <select 
                className="w-full border rounded-md p-2 bg-background"
                value={formData.parentId}
                onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
              >
                <option value="">بدون (فئة رئيسية)</option>
                {mainCategories.filter(c => c.id !== selectedCategory?.id).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>اللون</Label>
              <div className="flex gap-2 flex-wrap mt-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData(prev => ({ ...prev, isActive: v }))} />
              <Label>فئة نشطة</Label>
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
            <DialogDescription>هل أنت متأكد من حذف "{selectedCategory?.name}"؟</DialogDescription>
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
