// ============================================
// Payment Distribution Chart - رسم طرق الدفع
// ============================================

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CurrencySettings, PaymentDistributionData } from '../../types';

// ============================================
// الألوان
// ============================================
const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
interface PaymentDistributionChartProps {
  data: PaymentDistributionData[];
  currency: CurrencySettings;
}

// ============================================
// المكون - محسن مع memo
// ============================================
export const PaymentDistributionChart = memo(function PaymentDistributionChart({ data, currency }: PaymentDistributionChartProps) {
  // تحضير البيانات
  const chartData = data.map(item => ({
    name: item.methodAr,
    value: item.amount,
    percentage: item.percentage,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            طرق الدفع
          </CardTitle>
          <CardDescription>توزيع طرق الدفع اليوم</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full min-w-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value, currency)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </div>
          <Separator className="my-4" />
          <div className="space-y-2">
            {data.map((item, index) => (
              <motion.div 
                key={item.method} 
                className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full ring-2 ring-offset-2 ring-offset-background" 
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span>{item.methodAr}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(item.amount, currency)}</span>
                  <Badge variant="outline" className="text-xs">{item.percentage.toFixed(0)}%</Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
