// ============================================
// KPI Card Component - بطاقة المؤشرات
// ============================================

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { KPICardProps, CurrencySettings } from '../types';

// Format currency with dynamic currency
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

// Format number
const formatNumber = (value: number) => {
  return new Intl.NumberFormat('ar-SA').format(value);
};

// Animation variants
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const cardHoverVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
};

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  format: formatType = 'currency',
  index = 0,
  gradient,
  currency,
}: KPICardProps) {
  const formattedValue = formatType === 'currency' 
    ? formatCurrency(value, currency)
    : formatType === 'percent'
    ? `${value.toFixed(1)}%`
    : formatNumber(value);

  const isPositive = change !== undefined && change >= 0;

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="show"
      transition={{ delay: index * 0.1 }}
    >
      <motion.div
        variants={cardHoverVariants}
        initial="rest"
        whileHover="hover"
        className="h-full"
      >
        <Card className={cn(
          "relative overflow-hidden h-full transition-all duration-300",
          "hover:shadow-lg hover:shadow-primary/5",
          "border-transparent hover:border-primary/20"
        )}>
          <div className={cn(
            "absolute inset-0 opacity-5",
            gradient || "bg-gradient-to-br from-primary to-transparent"
          )} />
          
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium">{title}</p>
                <motion.p 
                  className="text-3xl font-bold mt-2 bg-gradient-to-l bg-clip-text"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  {formattedValue}
                </motion.p>
                {change !== undefined && (
                  <motion.div 
                    className={cn(
                      "flex items-center gap-1.5 mt-3 text-sm",
                      isPositive ? "text-emerald-600" : "text-rose-600"
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <span className={cn(
                      "p-1 rounded-full",
                      isPositive ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-rose-100 dark:bg-rose-900/30"
                    )}>
                      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    </span>
                    <span className="font-semibold">{Math.abs(change).toFixed(1)}%</span>
                    {changeLabel && <span className="text-muted-foreground text-xs">{changeLabel}</span>}
                  </motion.div>
                )}
              </div>
              
              <motion.div 
                className={cn(
                  "p-4 rounded-2xl shadow-inner",
                  "bg-gradient-to-br from-primary/20 to-primary/5",
                  "dark:from-primary/30 dark:to-primary/10"
                )}
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Icon className="h-7 w-7 text-primary" />
              </motion.div>
            </div>
            
            <div className="absolute -bottom-2 -right-2 w-20 h-20 rounded-full bg-primary/5 blur-xl" />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
