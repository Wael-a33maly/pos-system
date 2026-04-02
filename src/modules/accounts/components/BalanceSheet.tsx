'use client';

import { CheckCircle, XCircle, Building2, CreditCard, Wallet, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore, formatCurrency } from '@/store';
import { BalanceSheetItem } from '@/types/accounting';

interface BalanceSheetProps {
  data: {
    assets: BalanceSheetItem[];
    totalAssets: number;
    liabilities: BalanceSheetItem[];
    totalLiabilities: number;
    equity: BalanceSheetItem[];
    totalEquity: number;
    totalLiabilitiesAndEquity: number;
    isBalanced: boolean;
    asOfDate: Date;
  } | null;
}

export function BalanceSheet({ data }: BalanceSheetProps) {
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

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-center">الميزانية العمومية</CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              بتاريخ: {formatDate(data.asOfDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {data.isBalanced ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="h-4 w-4 ml-1" />
                متوازنة
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                <XCircle className="h-4 w-4 ml-1" />
                غير متوازنة
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الأصول */}
        <Card>
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Building2 className="h-5 w-5" />
              الأصول
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
                {data.assets.length > 0 ? (
                  <>
                    {data.assets.map((item) => (
                      <TableRow key={item.accountId}>
                        <TableCell className="font-mono text-sm">{item.accountCode}</TableCell>
                        <TableCell>{item.accountName}</TableCell>
                        <TableCell className="text-left font-medium">
                          {formatCurrency(item.amount, currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-blue-50 dark:bg-blue-900/20 font-bold">
                      <TableCell colSpan={2}>إجمالي الأصول</TableCell>
                      <TableCell className="text-left text-blue-700 dark:text-blue-400">
                        {formatCurrency(data.totalAssets, currency)}
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      لا توجد أصول
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* الخصوم وحقوق الملكية */}
        <div className="space-y-6">
          {/* الخصوم */}
          <Card>
            <CardHeader className="bg-red-50 dark:bg-red-900/20">
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <CreditCard className="h-5 w-5" />
                الخصوم
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
                  {data.liabilities.length > 0 ? (
                    <>
                      {data.liabilities.map((item) => (
                        <TableRow key={item.accountId}>
                          <TableCell className="font-mono text-sm">{item.accountCode}</TableCell>
                          <TableCell>{item.accountName}</TableCell>
                          <TableCell className="text-left font-medium">
                            {formatCurrency(item.amount, currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-red-50 dark:bg-red-900/20 font-bold">
                        <TableCell colSpan={2}>إجمالي الخصوم</TableCell>
                        <TableCell className="text-left text-red-700 dark:text-red-400">
                          {formatCurrency(data.totalLiabilities, currency)}
                        </TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        لا توجد خصوم
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* حقوق الملكية */}
          <Card>
            <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
              <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                <Wallet className="h-5 w-5" />
                حقوق الملكية
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
                  {data.equity.length > 0 ? (
                    <>
                      {data.equity.map((item) => (
                        <TableRow key={item.accountId}>
                          <TableCell className="font-mono text-sm">{item.accountCode}</TableCell>
                          <TableCell>{item.accountName}</TableCell>
                          <TableCell className="text-left font-medium">
                            {formatCurrency(item.amount, currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-purple-50 dark:bg-purple-900/20 font-bold">
                        <TableCell colSpan={2}>إجمالي حقوق الملكية</TableCell>
                        <TableCell className="text-left text-purple-700 dark:text-purple-400">
                          {formatCurrency(data.totalEquity, currency)}
                        </TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        لا توجد حقوق ملكية
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* إجمالي الخصوم وحقوق الملكية */}
          <Card className="border-2 border-muted">
            <CardContent className="py-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="font-bold">إجمالي الخصوم وحقوق الملكية</span>
                <span className="text-xl font-bold">{formatCurrency(data.totalLiabilitiesAndEquity, currency)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* التحقق من التوازن */}
      <Card className={`border-2 ${data.isBalanced ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}`}>
        <CardContent className={`py-6 ${data.isBalanced ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">المعادلة المحاسبية</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-blue-600 font-medium">{formatCurrency(data.totalAssets, currency)}</span>
                <span className="text-muted-foreground">=</span>
                <span className="text-red-600 font-medium">{formatCurrency(data.totalLiabilities, currency)}</span>
                <span className="text-muted-foreground">+</span>
                <span className="text-purple-600 font-medium">{formatCurrency(data.totalEquity, currency)}</span>
              </div>
            </div>
            <div className={`p-4 rounded-full ${data.isBalanced ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
              {data.isBalanced ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
            </div>
          </div>

          {!data.isBalanced && (
            <div className="mt-4 pt-4 border-t border-dashed">
              <p className="text-sm text-red-600">
                الفرق: {formatCurrency(Math.abs(data.totalAssets - data.totalLiabilitiesAndEquity), currency)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ملخص */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">إجمالي الأصول</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(data.totalAssets, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">إجمالي الخصوم</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(data.totalLiabilities, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">حقوق الملكية</p>
                <p className="text-xl font-bold text-purple-600">{formatCurrency(data.totalEquity, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
