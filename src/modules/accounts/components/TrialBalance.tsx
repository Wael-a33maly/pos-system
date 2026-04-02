'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore, formatCurrency } from '@/store';
import { accountTypeLabels, TrialBalanceItem } from '@/types/accounting';

interface TrialBalanceProps {
  data: {
    items: TrialBalanceItem[];
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
    asOfDate: Date;
  } | null;
}

export function TrialBalance({ data }: TrialBalanceProps) {
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

  // تجميع الحسابات حسب النوع
  const groupedItems = data.items.reduce((acc, item) => {
    const type = item.accountType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, TrialBalanceItem[]>);

  const typeOrder = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>ميزان المراجعة</CardTitle>
            <p className="text-sm text-muted-foreground">بتاريخ: {formatDate(data.asOfDate)}</p>
          </div>
          <div className="flex items-center gap-2">
            {data.isBalanced ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="h-4 w-4 ml-1" />
                متوازن
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                <XCircle className="h-4 w-4 ml-1" />
                غير متوازن
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>رمز الحساب</TableHead>
                  <TableHead>اسم الحساب</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead className="text-left">مدين</TableHead>
                  <TableHead className="text-left">دائن</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typeOrder.map((type) => {
                  const items = groupedItems[type];
                  if (!items || items.length === 0) return null;

                  const typeInfo = accountTypeLabels[type as keyof typeof accountTypeLabels];
                  const typeTotalDebit = items.reduce((sum, item) => sum + item.debit, 0);
                  const typeTotalCredit = items.reduce((sum, item) => sum + item.credit, 0);

                  return (
                    <>
                      {/* عنوان النوع */}
                      <TableRow key={type} className="bg-muted/30">
                        <TableCell colSpan={3} className="font-bold">
                          <span className={typeInfo.color}>{typeInfo.label}</span>
                        </TableCell>
                        <TableCell className="text-left font-bold">
                          {typeTotalDebit > 0 ? formatCurrency(typeTotalDebit, currency) : '-'}
                        </TableCell>
                        <TableCell className="text-left font-bold">
                          {typeTotalCredit > 0 ? formatCurrency(typeTotalCredit, currency) : '-'}
                        </TableCell>
                      </TableRow>
                      
                      {/* الحسابات */}
                      {items.map((item) => (
                        <TableRow key={item.accountId}>
                          <TableCell className="font-mono text-sm">{item.accountCode}</TableCell>
                          <TableCell>{item.accountName}</TableCell>
                          <TableCell>
                            <span className={`text-sm ${typeInfo.color.split(' ')[0]}`}>
                              {typeInfo.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-left">
                            {item.debit > 0 ? formatCurrency(item.debit, currency) : '-'}
                          </TableCell>
                          <TableCell className="text-left">
                            {item.credit > 0 ? formatCurrency(item.credit, currency) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  );
                })}

                {/* الإجمالي */}
                <TableRow className="bg-primary/10 font-bold text-lg">
                  <TableCell colSpan={3}>الإجمالي</TableCell>
                  <TableCell className="text-left">{formatCurrency(data.totalDebit, currency)}</TableCell>
                  <TableCell className="text-left">{formatCurrency(data.totalCredit, currency)}</TableCell>
                </TableRow>

                {/* الفرق */}
                {!data.isBalanced && (
                  <TableRow className="bg-red-50 dark:bg-red-900/20">
                    <TableCell colSpan={3} className="font-bold text-red-600">
                      الفرق
                    </TableCell>
                    <TableCell className="text-left font-bold text-red-600">
                      {formatCurrency(Math.abs(data.totalDebit - data.totalCredit), currency)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ملخص */}
      <div className="grid grid-cols-2 gap-4">
        <Card className={data.isBalanced ? 'border-green-200 dark:border-green-800' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المدين</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.totalDebit, currency)}</p>
              </div>
              {data.isBalanced && <CheckCircle className="h-8 w-8 text-green-500" />}
            </div>
          </CardContent>
        </Card>
        <Card className={data.isBalanced ? 'border-green-200 dark:border-green-800' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalCredit, currency)}</p>
              </div>
              {data.isBalanced && <CheckCircle className="h-8 w-8 text-green-500" />}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
