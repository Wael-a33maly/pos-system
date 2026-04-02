'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, Plus, Search, Play, Pause, Trash2, RefreshCw,
  Calendar, FileText, Mail, Download, Settings
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

const frequencyLabels = {
  DAILY: 'يومياً',
  WEEKLY: 'أسبوعياً',
  MONTHLY: 'شهرياً',
};

interface ScheduledReport {
  id: string;
  name: string;
  type: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  time: string;
  email: string;
  isActive: boolean;
  lastRun: Date | null;
}

const mockReports: ScheduledReport[] = [
  {
    id: '1',
    name: 'تقرير المبيعات اليومي',
    type: 'sales',
    frequency: 'DAILY',
    time: '23:00',
    email: 'admin@example.com',
    isActive: true,
    lastRun: new Date(),
  },
  {
    id: '2',
    name: 'تقرير المخزون الأسبوعي',
    type: 'inventory',
    frequency: 'WEEKLY',
    time: '09:00',
    email: 'manager@example.com',
    isActive: true,
    lastRun: new Date(Date.now() - 604800000),
  },
];

export function ScheduledReportsPage() {
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
            <h1 className="text-3xl font-bold">التقارير المجدولة</h1>
            <p className="text-muted-foreground">إدارة التقارير التلقائية</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                جدولة تقرير
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>جدولة تقرير جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">اسم التقرير</label>
                  <Input placeholder="أدخل اسم التقرير" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">نوع التقرير</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">المبيعات</SelectItem>
                      <SelectItem value="inventory">المخزون</SelectItem>
                      <SelectItem value="customers">العملاء</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">التكرار</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">يومياً</SelectItem>
                        <SelectItem value="WEEKLY">أسبوعياً</SelectItem>
                        <SelectItem value="MONTHLY">شهرياً</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الوقت</label>
                    <Input type="time" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">البريد الإلكتروني</label>
                  <Input type="email" placeholder="example@email.com" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={() => setIsCreateOpen(false)}>
                    حفظ
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
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">التقارير المجدولة</p>
                  <p className="text-2xl font-bold">{mockReports.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Play className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">نشطة</p>
                  <p className="text-2xl font-bold">
                    {mockReports.filter(r => r.isActive).length}
                  </p>
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
                  <p className="text-sm text-muted-foreground">مؤجلة</p>
                  <p className="text-2xl font-bold">
                    {mockReports.filter(r => !r.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تم الإرسال</p>
                  <p className="text-2xl font-bold">156</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>قائمة التقارير</CardTitle>
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
                  <TableHead>اسم التقرير</TableHead>
                  <TableHead>التكرار</TableHead>
                  <TableHead>الوقت</TableHead>
                  <TableHead>البريد</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>آخر تشغيل</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell>{frequencyLabels[report.frequency]}</TableCell>
                    <TableCell>{report.time}</TableCell>
                    <TableCell>{report.email}</TableCell>
                    <TableCell>
                      <Badge variant={report.isActive ? 'default' : 'secondary'}>
                        {report.isActive ? 'نشط' : 'مؤجل'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {report.lastRun 
                        ? format(report.lastRun, 'yyyy/MM/dd HH:mm', { locale: ar })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon">
                          {report.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
