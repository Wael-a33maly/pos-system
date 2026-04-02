'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet, TrendingUp, TrendingDown, Scale, DollarSign,
  Calendar, Loader2, Download, Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store';
import { TrialBalance } from './TrialBalance';
import { IncomeStatement } from './IncomeStatement';
import { BalanceSheet } from './BalanceSheet';
import { toast } from 'sonner';

export function FinancialReportsPage() {
  const { currency } = useAppStore();
  const [activeTab, setActiveTab] = useState('trial-balance');
  const [loading, setLoading] = useState(false);
  
  // التواريخ
  const today = new Date();
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
  
  const [dates, setDates] = useState({
    asOfDate: today.toISOString().split('T')[0],
    fromDate: firstDayOfYear.toISOString().split('T')[0],
    toDate: today.toISOString().split('T')[0],
  });

  // البيانات
  const [trialBalanceData, setTrialBalanceData] = useState<any>(null);
  const [incomeStatementData, setIncomeStatementData] = useState<any>(null);
  const [balanceSheetData, setBalanceSheetData] = useState<any>(null);

  const fetchTrialBalance = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/financial?type=trial-balance&asOfDate=${dates.asOfDate}`);
      const data = await response.json();
      setTrialBalanceData(data);
    } catch (error) {
      console.error('Error fetching trial balance:', error);
      toast.error('حدث خطأ في جلب ميزان المراجعة');
    } finally {
      setLoading(false);
    }
  }, [dates.asOfDate]);

  const fetchIncomeStatement = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/reports/financial?type=income-statement&fromDate=${dates.fromDate}&toDate=${dates.toDate}`
      );
      const data = await response.json();
      setIncomeStatementData(data);
    } catch (error) {
      console.error('Error fetching income statement:', error);
      toast.error('حدث خطأ في جلب قائمة الدخل');
    } finally {
      setLoading(false);
    }
  }, [dates.fromDate, dates.toDate]);

  const fetchBalanceSheet = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/financial?type=balance-sheet&asOfDate=${dates.asOfDate}`);
      const data = await response.json();
      setBalanceSheetData(data);
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
      toast.error('حدث خطأ في جلب الميزانية العمومية');
    } finally {
      setLoading(false);
    }
  }, [dates.asOfDate]);

  useEffect(() => {
    if (activeTab === 'trial-balance') {
      fetchTrialBalance();
    } else if (activeTab === 'income-statement') {
      fetchIncomeStatement();
    } else if (activeTab === 'balance-sheet') {
      fetchBalanceSheet();
    }
  }, [activeTab, fetchTrialBalance, fetchIncomeStatement, fetchBalanceSheet]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // سيتم تنفيذ التصدير لاحقاً
    toast.success('سيتم إضافة خاصية التصدير قريباً');
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">التقارير المالية</h1>
          <p className="text-muted-foreground">ميزان المراجعة، قائمة الدخل، والميزانية العمومية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 ml-2" />
            طباعة
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* ملخصات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">ميزان المراجعة</p>
                <p className="text-lg font-bold text-blue-600">
                  {trialBalanceData?.isBalanced ? 'متوازن' : 'غير متوازن'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">صافي الربح</p>
                <p className="text-lg font-bold text-green-600">
                  {incomeStatementData ? 
                    new Intl.NumberFormat('ar-SA').format(incomeStatementData.netIncome) + ' ' + currency?.symbol : 
                    '-'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">إجمالي الأصول</p>
                <p className="text-lg font-bold text-purple-600">
                  {balanceSheetData ?
                    new Intl.NumberFormat('ar-SA').format(balanceSheetData.totalAssets) + ' ' + currency?.symbol :
                    '-'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">إجمالي الخصوم</p>
                <p className="text-lg font-bold text-orange-600">
                  {balanceSheetData ?
                    new Intl.NumberFormat('ar-SA').format(balanceSheetData.totalLiabilities) + ' ' + currency?.symbol :
                    '-'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trial-balance">
            <Scale className="h-4 w-4 ml-2" />
            ميزان المراجعة
          </TabsTrigger>
          <TabsTrigger value="income-statement">
            <TrendingUp className="h-4 w-4 ml-2" />
            قائمة الدخل
          </TabsTrigger>
          <TabsTrigger value="balance-sheet">
            <FileSpreadsheet className="h-4 w-4 ml-2" />
            الميزانية العمومية
          </TabsTrigger>
        </TabsList>

        {/* فلاتر التاريخ */}
        <Card className="mt-4">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-end gap-4">
              {(activeTab === 'trial-balance' || activeTab === 'balance-sheet') && (
                <div className="space-y-2">
                  <Label>بتاريخ</Label>
                  <Input
                    type="date"
                    value={dates.asOfDate}
                    onChange={(e) => setDates((prev) => ({ ...prev, asOfDate: e.target.value }))}
                    className="w-48"
                  />
                </div>
              )}
              {activeTab === 'income-statement' && (
                <>
                  <div className="space-y-2">
                    <Label>من تاريخ</Label>
                    <Input
                      type="date"
                      value={dates.fromDate}
                      onChange={(e) => setDates((prev) => ({ ...prev, fromDate: e.target.value }))}
                      className="w-48"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>إلى تاريخ</Label>
                    <Input
                      type="date"
                      value={dates.toDate}
                      onChange={(e) => setDates((prev) => ({ ...prev, toDate: e.target.value }))}
                      className="w-48"
                    />
                  </div>
                </>
              )}
              <Button onClick={() => {
                if (activeTab === 'trial-balance') fetchTrialBalance();
                else if (activeTab === 'income-statement') fetchIncomeStatement();
                else if (activeTab === 'balance-sheet') fetchBalanceSheet();
              }}>
                <Calendar className="h-4 w-4 ml-2" />
                تحديث
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* محتوى التبويبات */}
        <TabsContent value="trial-balance">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <TrialBalance data={trialBalanceData} />
          )}
        </TabsContent>

        <TabsContent value="income-statement">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <IncomeStatement data={incomeStatementData} />
          )}
        </TabsContent>

        <TabsContent value="balance-sheet">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <BalanceSheet data={balanceSheetData} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
