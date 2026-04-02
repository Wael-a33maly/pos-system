'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore, formatCurrency } from '@/store';
import { IncomeStatementItem } from '@/types/accounting';

interface IncomeStatementProps {
  data: {
    revenues: IncomeStatementItem[];
    totalRevenue: number;
    expenses: IncomeStatementItem[];
    totalExpenses: number;
    netIncome: number;
    fromDate: Date;
    toDate: Date;
  } | null;
}

export function IncomeStatement({ data }: IncomeStatementProps) {
  const { currency } = useAppStore();

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          لا توجد بيانات لعرضها
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isProfit = data.netIncome >= 0;

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">قائمة الدخل</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            للفترة من {formatDate(data.fromDate)} إلى {formatDate(data.toDate)}
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الإيرادات */}
        <Card>
          <CardHeader className="bg-green-50 dark:bg-green-900/20">
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <TrendingUp className="h-5 w-5" />
              الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>رمز الحساب</TableHead>
                  <TableHead>اسم الحساب</TableHead>
                  <TableHead className="text-left">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.revenues.length > 0 ? (
                  <>
                    {data.revenues.map((item) => (
                      <TableRow key={item.accountId}>
                        <TableCell className="font-mono text-sm">{item.accountCode}</TableCell>
                        <TableCell>{item.accountName}</TableCell>
                        <TableCell className="text-left font-medium">
                          {formatCurrency(item.amount, currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-green-50 dark:bg-green-900/20 font-bold">
                      <TableCell colSpan={2}>إجمالي الإيرادات</TableCell>
                      <TableCell className="text-left text-green-700 dark:text-green-400">
                        {formatCurrency(data.totalRevenue, currency)}
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      لا توجد إيرادات
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* المصروفات */}
        <Card>
          <CardHeader className="bg-red-50 dark:bg-red-900/20">
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <TrendingDown className="h-5 w-5" />
              المصروفات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>رمز الحساب</TableHead>
                  <TableHead>اسم الحساب</TableHead>
                  <TableHead className="text-left">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.expenses.length > 0 ? (
                  <>
                    {data.expenses.map((item) => (
                      <TableRow key={item.accountId}>
                        <TableCell className="font-mono text-sm">{item.accountCode}</TableCell>
                        <TableCell>{item.accountName}</TableCell>
                        <TableCell className="text-left font-medium">
                          {formatCurrency(item.amount, currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-red-50 dark:bg-red-900/20 font-bold">
                      <TableCell colSpan={2}>إجمالي المصروفات</TableCell>
                      <TableCell className="text-left text-red-700 dark:text-red-400">
                        {formatCurrency(data.totalExpenses, currency)}
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      لا توجد مصروفات
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* صافي الربح/الخسارة */}
      <Card className={`border-2 ${isProfit ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}`}>
        <CardContent className={`py-6 ${isProfit ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {isProfit ? 'صافي الربح' : 'صافي الخسارة'}
              </p>
              <p className={`text-3xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(data.netIncome), currency)}
              </p>
            </div>
            <div className={`p-4 rounded-full ${isProfit ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
              {isProfit ? (
                <TrendingUp className={`h-8 w-8 text-green-600`} />
              ) : (
                <TrendingDown className={`h-8 w-8 text-red-600`} />
              )}
            </div>
          </div>

          {/* المعادلة */}
          <div className="mt-6 pt-4 border-t border-dashed">
            <div className="flex items-center justify-center gap-4 text-sm">
              <span className="text-green-600">{formatCurrency(data.totalRevenue, currency)}</span>
              <span className="text-muted-foreground">-</span>
              <span className="text-red-600">{formatCurrency(data.totalExpenses, currency)}</span>
              <span className="text-muted-foreground">=</span>
              <span className={isProfit ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                {formatCurrency(Math.abs(data.netIncome), currency)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نسبة الربحية */}
      {data.totalRevenue > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">نسبة صافي الربح</p>
                <p className="text-xl font-bold">
                  {((data.netIncome / data.totalRevenue) * 100).toFixed(2)}%
                </p>
              </div>
              <div className="w-48 h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${isProfit ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{
                    width: `${Math.min(Math.abs((data.netIncome / data.totalRevenue) * 100), 100)}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
