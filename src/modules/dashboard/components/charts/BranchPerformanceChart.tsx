// ============================================
// Branch Performance Chart - رسم أداء الفروع
// ============================================

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Store } from 'lucide-react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CurrencySettings, BranchPerformanceData } from '../../types';

// ============================================
// دالة تنسيق العملة
// ============================================
const formatCurrency = (value: number, currency: CurrencySettings = { code: 'SAR', symbol: 'ر.س', decimalPlaces: 2 }) => {
  try {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.decimalPlaces,
      maximumFractionDigits: currency.decimalPlaces,
    }).format(value);
  } catch {
    return `${value.toFixed(currency.decimalPlaces)} ${currency.symbol}`;
  }
};

// ============================================
// Props
// ============================================
interface BranchPerformanceChartProps {
  data: BranchPerformanceData[];
  currency: CurrencySettings;
}

// ============================================
// المكون - محسن مع memo
// ============================================
export const BranchPerformanceChart = memo(function BranchPerformanceChart({ data, currency }: BranchPerformanceChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            أداء الفروع
          </CardTitle>
          <CardDescription>مقارنة المبيعات هذا الأسبوع</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] w-full min-w-0">
            {data && data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={data} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={70} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value, currency)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar 
                    dataKey="sales" 
                    name="المبيعات" 
                    fill="#10b981" 
                    radius={[0, 6, 6, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </div>
          <Separator className="my-4" />
          <ScrollArea className="h-[130px]">
            <div className="space-y-3">
              {data && data.map((branch, index) => (
                <motion.div 
                  key={branch.id} 
                  className="flex items-center justify-between text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>{branch.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(branch.sales, currency)}</span>
                    <Badge variant="outline" className="text-xs">{branch.invoices} فاتورة</Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
});
