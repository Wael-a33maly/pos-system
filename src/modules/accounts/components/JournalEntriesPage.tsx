'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, Eye, Trash2, FileText, Calendar, CheckCircle,
  XCircle, Clock, Loader2, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore, formatCurrency } from '@/store';
import { journalStatusLabels, JournalEntry } from '@/types/accounting';
import { JournalEntryForm } from './JournalEntryForm';
import { toast } from 'sonner';

interface JournalEntryWithTotals extends JournalEntry {
  totalDebit: number;
  totalCredit: number;
}

export function JournalEntriesPage() {
  const { currency } = useAppStore();
  const [entries, setEntries] = useState<JournalEntryWithTotals[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntryWithTotals | null>(null);
  
  // الفلاتر
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    accountId: '',
    fromDate: '',
    toDate: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (appliedFilters.search) params.append('search', appliedFilters.search);
      if (appliedFilters.status) params.append('status', appliedFilters.status);
      if (appliedFilters.accountId) params.append('accountId', appliedFilters.accountId);
      if (appliedFilters.fromDate) params.append('fromDate', appliedFilters.fromDate);
      if (appliedFilters.toDate) params.append('toDate', appliedFilters.toDate);

      const [entriesRes, accountsRes] = await Promise.all([
        fetch(`/api/journal-entries?${params.toString()}`),
        fetch('/api/accounts'),
      ]);

      const entriesData = await entriesRes.json();
      const accountsData = await accountsRes.json();

      setEntries(entriesData.entries || []);
      setAccounts(accountsData.flatAccounts || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const applyFilters = () => {
    setAppliedFilters(filters);
  };

  const clearFilters = () => {
    setFilters({ search: '', status: '', accountId: '', fromDate: '', toDate: '' });
    setAppliedFilters({ search: '', status: '', accountId: '', fromDate: '', toDate: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القيد؟')) return;

    try {
      const response = await fetch(`/api/journal-entries/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'حدث خطأ في حذف القيد');
      }

      toast.success('تم حذف القيد بنجاح');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handlePost = async (id: string) => {
    try {
      const response = await fetch(`/api/journal-entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'POSTED' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'حدث خطأ في ترحيل القيد');
      }

      toast.success('تم ترحيل القيد بنجاح');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReverse = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا القيد؟ سيتم إنشاء قيد عكس')) return;

    try {
      const response = await fetch(`/api/journal-entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REVERSED' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'حدث خطأ في إلغاء القيد');
      }

      toast.success('تم إلغاء القيد بنجاح');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const viewDetails = (entry: JournalEntryWithTotals) => {
    setSelectedEntry(entry);
    setShowDetails(true);
  };

  const getStatusBadge = (status: string) => {
    const info = journalStatusLabels[status as keyof typeof journalStatusLabels];
    return <Badge className={info.color}>{info.label}</Badge>;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // ملخصات
  const summary = {
    total: entries.length,
    drafts: entries.filter((e) => e.status === 'DRAFT').length,
    posted: entries.filter((e) => e.status === 'POSTED').length,
    totalAmount: entries.reduce((sum, e) => sum + e.totalDebit, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">القيود المحاسبية</h1>
          <p className="text-muted-foreground">إدارة وعرض القيود المحاسبية</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 ml-2" />
          قيد جديد
        </Button>
      </div>

      {/* ملخصات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">إجمالي القيود</p>
                <p className="text-lg font-bold">{summary.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">مسودات</p>
                <p className="text-lg font-bold text-yellow-600">{summary.drafts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">مرحلة</p>
                <p className="text-lg font-bold text-green-600">{summary.posted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-xs text-muted-foreground">إجمالي المبالغ</p>
                <p className="text-lg font-bold">{formatCurrency(summary.totalAmount, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* البحث والفلاتر */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث برقم القيد أو الوصف..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="pr-10"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 ml-2" />
              فلاتر
              {(appliedFilters.status || appliedFilters.accountId || appliedFilters.fromDate || appliedFilters.toDate) && (
                <Badge variant="secondary" className="mr-2">نشط</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div>
                <Label>الحالة</Label>
                <Select
                  value={filters.status}
                  onValueChange={(v) => setFilters((prev) => ({ ...prev, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">الكل</SelectItem>
                    <SelectItem value="DRAFT">مسودة</SelectItem>
                    <SelectItem value="POSTED">مرحل</SelectItem>
                    <SelectItem value="REVERSED">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الحساب</Label>
                <Select
                  value={filters.accountId}
                  onValueChange={(v) => setFilters((prev) => ({ ...prev, accountId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">الكل</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.code} - {account.nameAr || account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>من تاريخ</Label>
                  <Input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={clearFilters} className="flex-1">
                  مسح
                </Button>
                <Button onClick={applyFilters} className="flex-1">
                  تطبيق
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* جدول القيود */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم القيد</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>المرجع</TableHead>
                  <TableHead>المدين</TableHead>
                  <TableHead>الدائن</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="w-24">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length > 0 ? (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono">{entry.entryNumber}</TableCell>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{entry.description}</TableCell>
                      <TableCell>{entry.reference || '-'}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(entry.totalDebit, currency)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(entry.totalCredit, currency)}</TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => viewDetails(entry)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {entry.status === 'DRAFT' && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handlePost(entry.id)}>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          {entry.status === 'POSTED' && (
                            <Button variant="ghost" size="icon" onClick={() => handleReverse(entry.id)}>
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      لا توجد قيود محاسبية
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* نموذج إنشاء قيد */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إنشاء قيد محاسبي جديد</DialogTitle>
          </DialogHeader>
          <JournalEntryForm
            accounts={accounts}
            onSuccess={() => {
              setShowForm(false);
              fetchData();
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* تفاصيل القيد */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>تفاصيل القيد</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">رقم القيد</p>
                  <p className="font-mono font-medium">{selectedEntry.entryNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">التاريخ</p>
                  <p className="font-medium">{formatDate(selectedEntry.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  {getStatusBadge(selectedEntry.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المرجع</p>
                  <p className="font-medium">{selectedEntry.reference || '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">الوصف</p>
                <p className="font-medium">{selectedEntry.description || '-'}</p>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>الحساب</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead className="text-left">مدين</TableHead>
                      <TableHead className="text-left">دائن</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedEntry.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-muted-foreground">
                              {line.account?.code}
                            </span>
                            <span>{line.account?.nameAr || line.account?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{line.description || '-'}</TableCell>
                        <TableCell className="text-left font-medium">
                          {line.debit > 0 ? formatCurrency(line.debit, currency) : '-'}
                        </TableCell>
                        <TableCell className="text-left font-medium">
                          {line.credit > 0 ? formatCurrency(line.credit, currency) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-bold">
                      <TableCell colSpan={2}>الإجمالي</TableCell>
                      <TableCell className="text-left">{formatCurrency(selectedEntry.totalDebit, currency)}</TableCell>
                      <TableCell className="text-left">{formatCurrency(selectedEntry.totalCredit, currency)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="font-medium">القيد متوازن</span>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
