'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardList, Plus, Search, Edit, Trash2, RefreshCw,
  Package, AlertTriangle, CheckCircle, XCircle, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const statusColors = {
  PENDING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const statusLabels = {
  PENDING: 'معلق',
  IN_PROGRESS: 'جاري',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
};

interface InventoryCount {
  id: string;
  countNumber: string;
  branch: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  products: number;
  differences: number;
  createdAt: Date;
}

const mockInventoryCounts: InventoryCount[] = [
  {
    id: '1',
    countNumber: 'IC-001',
    branch: 'الفرع الرئيسي',
    status: 'COMPLETED',
    products: 150,
    differences: 5,
    createdAt: new Date(),
  },
  {
    id: '2',
    countNumber: 'IC-002',
    branch: 'فرع جدة',
    status: 'IN_PROGRESS',
    products: 200,
    differences: 0,
    createdAt: new Date(Date.now() - 86400000),
  },
];

export function InventoryPage() {
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-3xl font-bold">الجرد الدوري</h1>
            <p className="text-muted-foreground">إدارة عمليات جرد المخزون</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                جرد جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>بدء عملية جرد جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">الفرع</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفرع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">الفرع الرئيسي</SelectItem>
                      <SelectItem value="2">فرع جدة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">ملاحظات</label>
                  <Input placeholder="أدخل ملاحظات (اختياري)" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={() => setIsCreateOpen(false)}>
                    بدء الجرد
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي العمليات</p>
                  <p className="text-2xl font-bold">{mockInventoryCounts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <RefreshCw className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">جارية</p>
                  <p className="text-2xl font-bold">
                    {mockInventoryCounts.filter(i => i.status === 'IN_PROGRESS').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مكتملة</p>
                  <p className="text-2xl font-bold">
                    {mockInventoryCounts.filter(i => i.status === 'COMPLETED').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">فروقات</p>
                  <p className="text-2xl font-bold">
                    {mockInventoryCounts.reduce((acc, i) => acc + i.differences, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>سجل الجرد</CardTitle>
              <div className="relative w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الجرد</TableHead>
                  <TableHead>الفرع</TableHead>
                  <TableHead>المنتجات</TableHead>
                  <TableHead>الفروقات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInventoryCounts.map((count) => (
                  <TableRow key={count.id}>
                    <TableCell className="font-medium">{count.countNumber}</TableCell>
                    <TableCell>{count.branch}</TableCell>
                    <TableCell>{count.products}</TableCell>
                    <TableCell>
                      <Badge variant={count.differences > 0 ? 'destructive' : 'default'}>
                        {count.differences}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[count.status]}>
                        {statusLabels[count.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(count.createdAt, 'yyyy/MM/dd', { locale: ar })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">عرض</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
