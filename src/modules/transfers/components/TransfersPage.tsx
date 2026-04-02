'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRightLeft, Plus, Search, Filter, Download, RefreshCw,
  Package, Store, Clock, CheckCircle, XCircle, AlertCircle
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
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  IN_TRANSIT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels = {
  PENDING: 'معلق',
  IN_TRANSIT: 'قيد النقل',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
};

interface Transfer {
  id: string;
  transferNumber: string;
  fromBranch: string;
  toBranch: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  items: number;
  totalQuantity: number;
  createdAt: Date;
}

const mockTransfers: Transfer[] = [
  {
    id: '1',
    transferNumber: 'TR-001',
    fromBranch: 'الفرع الرئيسي',
    toBranch: 'فرع جدة',
    status: 'COMPLETED',
    items: 5,
    totalQuantity: 50,
    createdAt: new Date(),
  },
  {
    id: '2',
    transferNumber: 'TR-002',
    fromBranch: 'فرع الرياض',
    toBranch: 'الفرع الرئيسي',
    status: 'IN_TRANSIT',
    items: 3,
    totalQuantity: 30,
    createdAt: new Date(Date.now() - 86400000),
  },
];

export function TransfersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredTransfers = mockTransfers.filter(transfer => {
    if (statusFilter !== 'all' && transfer.status !== statusFilter) return false;
    if (search && !transfer.transferNumber.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
            <h1 className="text-3xl font-bold">تحويلات المخزون</h1>
            <p className="text-muted-foreground">إدارة التحويلات بين الفروع</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                تحويل جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إنشاء تحويل جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الفرع المصدر</label>
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
                    <label className="text-sm font-medium">الفرع المستهدف</label>
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
                    إنشاء التحويل
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
                  <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي التحويلات</p>
                  <p className="text-2xl font-bold">{mockTransfers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">قيد الانتظار</p>
                  <p className="text-2xl font-bold">
                    {mockTransfers.filter(t => t.status === 'PENDING').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مكتملة</p>
                  <p className="text-2xl font-bold">
                    {mockTransfers.filter(t => t.status === 'COMPLETED').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي القطع</p>
                  <p className="text-2xl font-bold">
                    {mockTransfers.reduce((acc, t) => acc + t.totalQuantity, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث برقم التحويل..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="PENDING">معلق</SelectItem>
                  <SelectItem value="IN_TRANSIT">قيد النقل</SelectItem>
                  <SelectItem value="COMPLETED">مكتمل</SelectItem>
                  <SelectItem value="CANCELLED">ملغي</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة التحويلات</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التحويل</TableHead>
                  <TableHead>الفرع المصدر</TableHead>
                  <TableHead>الفرع المستهدف</TableHead>
                  <TableHead>عدد المنتجات</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-medium">{transfer.transferNumber}</TableCell>
                    <TableCell>{transfer.fromBranch}</TableCell>
                    <TableCell>{transfer.toBranch}</TableCell>
                    <TableCell>{transfer.items}</TableCell>
                    <TableCell>{transfer.totalQuantity}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[transfer.status]}>
                        {statusLabels[transfer.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(transfer.createdAt, 'yyyy/MM/dd', { locale: ar })}
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
