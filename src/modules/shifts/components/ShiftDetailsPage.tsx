'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  User,
  DollarSign,
  Receipt,
  TrendingUp,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  AlertTriangle,
  Printer,
  Calendar,
  Timer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAppStore, formatCurrency } from '@/store';
import { cn } from '@/lib/utils';

interface ShiftDetails {
  shift: {
    id: string;
    status: string;
    startTime: string;
    endTime: string | null;
    openingCash: number;
    closingCash: number | null;
    expectedCash: number;
    notes: string | null;
    duration: number;
    branch: { id: string; name: string };
    user: { id: string; name: string; email: string };
    closedByUser: { id: string; name: string } | null;
  };
  stats: {
    totalInvoices: number;
    completedInvoices: number;
    returnInvoices: number;
    cancelledInvoices: number;
    totalSales: number;
    totalReturns: number;
    totalDiscounts: number;
    totalTax: number;
    totalExpenses: number;
    totalItems: number;
    totalQuantity: number;
    highestInvoice: number;
    avgInvoice: number;
  };
  payments: {
    breakdown: Record<string, { amount: number; count: number }>;
    returns: Record<string, number>;
  };
  expenses: Array<{
    id: string;
    amount: number;
    description: string;
    category: { name: string };
  }>;
  expectedCash: number;
  cashVariance: number | null;
}

interface ShiftDetailsPageProps {
  shiftId: string;
  onClose?: () => void;
  onCloseShift?: () => void;
}

export function ShiftDetailsPage({ shiftId, onClose, onCloseShift }: ShiftDetailsPageProps) {
  const { currency } = useAppStore();
  const [details, setDetails] = useState<ShiftDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShiftDetails();
  }, [shiftId]);

  const fetchShiftDetails = async () => {
    try {
      const res = await fetch(`/api/shifts/${shiftId}`);
      if (res.ok) {
        const data = await res.json();
        setDetails(data);
      }
    } catch (error) {
      console.error('Error fetching shift details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ساعة ${mins} دقيقة`;
  };

  const getPaymentIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return Banknote;
      case 'card': return CreditCard;
      case 'knet': return Smartphone;
      default: return Wallet;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p>لم يتم العثور على الوردية</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">تفاصيل الوردية</h1>
          <p className="text-muted-foreground">
            {details.shift.branch.name} - {details.shift.user.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={details.shift.status === 'OPEN' ? 'default' : 'secondary'} className="text-lg px-4 py-2">
            {details.shift.status === 'OPEN' ? 'مفتوحة' : 'مغلقة'}
          </Badge>
          {details.shift.status === 'OPEN' && onCloseShift && (
            <Button onClick={onCloseShift}>
              إغلاق الوردية
            </Button>
          )}
          {onClose && (
            <Button variant="outline" onClick={onClose}>رجوع</Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" /> وقت الفتح
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{new Date(details.shift.startTime).toLocaleString('ar-SA')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> وقت الإغلاق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{details.shift.endTime ? new Date(details.shift.endTime).toLocaleString('ar-SA') : '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Timer className="h-4 w-4" /> المدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{formatDuration(details.shift.duration)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> الرصيد الافتتاحي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{formatCurrency(details.shift.openingCash, currency)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />الفواتير</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">الإجمالي</span><span className="font-bold">{details.stats.totalInvoices}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">المكتملة</span><span className="font-bold text-green-600">{details.stats.completedInvoices}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">المرتجعات</span><span className="font-bold text-orange-600">{details.stats.returnInvoices}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">الملغاة</span><span className="font-bold text-red-600">{details.stats.cancelledInvoices}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />المبيعات</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">الإجمالي</span><span className="font-bold text-green-600">{formatCurrency(details.stats.totalSales, currency)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">المرتجعات</span><span className="font-bold text-red-600">{formatCurrency(details.stats.totalReturns, currency)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">الخصومات</span><span className="font-bold">{formatCurrency(details.stats.totalDiscounts, currency)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">الضرائب</span><span className="font-bold">{formatCurrency(details.stats.totalTax, currency)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />المدفوعات</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(details.payments.breakdown).map(([method, data]) => (
              <div key={method} className="flex justify-between">
                <span className="text-muted-foreground">{method === 'cash' ? 'نقدي' : method === 'card' ? 'بطاقة' : method}</span>
                <span className="font-bold">{formatCurrency(data.amount, currency)}</span>
              </div>
            ))}
            {details.stats.totalExpenses > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">المصروفات</span>
                <span className="font-bold text-red-600">{formatCurrency(details.stats.totalExpenses, currency)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cash Summary */}
      {details.shift.status === 'CLOSED' && (
        <Card>
          <CardHeader><CardTitle>ملخص الصندوق</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">المتوقع</p>
                <p className="text-xl font-bold">{formatCurrency(details.expectedCash, currency)}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">الفعلي</p>
                <p className="text-xl font-bold">{formatCurrency(details.shift.closingCash || 0, currency)}</p>
              </div>
              <div className={cn("text-center p-4 rounded-lg", Math.abs(details.cashVariance || 0) > 0.01 ? "bg-red-100" : "bg-green-100")}>
                <p className="text-sm text-muted-foreground">الفرق</p>
                <p className={cn("text-xl font-bold", Math.abs(details.cashVariance || 0) > 0.01 ? "text-red-600" : "text-green-600")}>{formatCurrency(details.cashVariance || 0, currency)}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">أغلق بواسطة</p>
                <p className="text-lg font-bold">{details.shift.closedByUser?.name || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
