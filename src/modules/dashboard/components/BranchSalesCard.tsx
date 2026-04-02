// ============================================
// Branch Sales Card - كارت مبيعات الفرع
// ============================================

'use client';

import { motion } from 'framer-motion';
import {
  Store,
  User,
  Clock,
  TrendingUp,
  ShoppingCart,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatCurrencyWithSettings } from '@/lib/currency';
import type { BranchSalesCardProps, CurrencySettings } from '../types';

const formatCurrency = (value: number, currency: CurrencySettings) => {
  return formatCurrencyWithSettings(value, currency);
};

const formatTime = (dateStr: string) => {
  try {
    return format(new Date(dateStr), 'HH:mm', { locale: ar });
  } catch {
    return '--:--';
  }
};

export function BranchSalesCard({ branch, currency, index }: BranchSalesCardProps) {
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.5, 
        delay: index * 0.15,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    hover: { 
      y: -4,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="show"
      whileHover="hover"
      className="h-full"
    >
      <Card className={cn(
        "h-full overflow-hidden border-0 shadow-lg",
        "bg-gradient-to-br from-card via-card to-muted/30",
        "dark:from-card dark:via-card dark:to-muted/10"
      )}>
        {/* Branch Header */}
        <CardHeader className="pb-3 bg-gradient-to-l from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="p-2.5 rounded-xl bg-primary/10"
                whileHover={{ rotate: 5, scale: 1.1 }}
              >
                <Store className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <CardTitle className="text-lg font-bold">{branch.name}</CardTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-xs gap-1 px-2">
                    <Clock className="h-3 w-3" />
                    {branch.activeShifts} وردية نشطة
                  </Badge>
                </div>
              </div>
            </div>
            <motion.div
              whileHover={{ x: -3 }}
              className="p-2 rounded-full hover:bg-muted/50 cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Total Sales - Prominent Display */}
          <motion.div 
            className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.15 + 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">إجمالي المبيعات</p>
                <motion.p 
                  className="text-2xl font-black mt-1 tracking-tight"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15 + 0.3 }}
                >
                  {formatCurrency(branch.totalSales, currency)}
                </motion.p>
              </div>
              <motion.div 
                className="p-3 rounded-xl bg-primary/20"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <TrendingUp className="h-6 w-6 text-primary" />
              </motion.div>
            </div>
            
            {/* Sub-stats */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-primary/10">
              <div className="flex items-center gap-1.5">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{branch.totalInvoices}</span>
                <span className="text-xs text-muted-foreground">فاتورة</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(branch.totalProfit, currency)}
                </span>
                <span className="text-xs text-muted-foreground">ربح</span>
              </div>
            </div>
          </motion.div>

          {/* Users List */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              الورديات النشطة
            </p>
            <ScrollArea className="h-[180px] pr-2">
              <div className="space-y-2">
                {branch.users.map((user, userIndex) => (
                  <motion.div
                    key={user.shiftId}
                    className={cn(
                      "p-3 rounded-xl transition-all duration-200 cursor-pointer",
                      "bg-gradient-to-l from-muted/50 to-transparent",
                      "hover:from-primary/10 hover:to-transparent",
                      "border border-transparent hover:border-primary/10"
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 + 0.4 + userIndex * 0.1 }}
                    whileHover={{ x: -3 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                          <AvatarImage src={user.userAvatar || undefined} />
                          <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                            {user.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{user.userName}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>من {formatTime(user.openedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm">{formatCurrency(user.sales, currency)}</p>
                        <p className="text-xs text-muted-foreground">{user.invoices} فاتورة</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
