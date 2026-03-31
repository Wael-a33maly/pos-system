// ============================================
// Mini KPI Card Component - بطاقة مؤشر صغيرة
// ============================================

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { MiniKPICardProps } from '../types';

export function MiniKPICard({
  title,
  value,
  icon: Icon,
  color = 'text-primary',
  index = 0,
}: MiniKPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 + index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 hover:from-muted/70 hover:to-muted/40 transition-all duration-300"
    >
      <div className={cn("p-2.5 rounded-xl bg-background/50", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="font-bold text-lg">{value}</p>
      </div>
    </motion.div>
  );
}
