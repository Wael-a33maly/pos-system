// ============================================
// Quick Action Button Component - زر الإجراء السريع
// ============================================

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { QuickActionButtonProps } from '../types';

export function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  color,
}: QuickActionButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-2xl",
        "bg-gradient-to-br from-muted/50 to-muted/30",
        "hover:from-muted hover:to-muted/50",
        "transition-all duration-300 group"
      )}
    >
      <div className={cn(
        "p-3 rounded-xl transition-all duration-300",
        "group-hover:scale-110",
        color
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
    </motion.button>
  );
}
