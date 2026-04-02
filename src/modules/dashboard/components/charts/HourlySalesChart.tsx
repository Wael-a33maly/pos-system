// ============================================
// Hourly Sales Chart - رسم المبيعات بالساعة
// ============================================

'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';
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
import type { CurrencySettings, HourlySalesData } from '../../types';

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
interface HourlySalesChartProps {
  data: HourlySalesData[];
  currency: CurrencySettings;
}

// ============================================
// المكون - محسن مع memo
// ============================================
export const HourlySalesChart = memo(function HourlySalesChart({ data, currency }: HourlySalesChartProps) {
  // تحضير البيانات
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      hourLabel: `${item.hour}:00`,
    }));
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="h-full overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                المبيعات بالساعة
              </CardTitle>
              <CardDescription>توزيع المبيعات اليوم</CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              مباشر
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full min-w-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hourLabel" className="text-xs" />
                  <YAxis className="text-xs" />
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
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
