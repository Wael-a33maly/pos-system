'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  onClick?: () => void;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function NotificationBadge({
  count,
  onClick,
  className,
  showIcon = true,
  size = 'md',
}: NotificationBadgeProps) {
  const sizeClasses = {
    sm: 'h-5 min-w-5 text-[10px]',
    md: 'h-6 min-w-6 text-xs',
    lg: 'h-7 min-w-7 text-sm',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn('relative', className)}
    >
      {showIcon && <Bell className={iconSizes[size]} />}
      
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={cn(
              'absolute -top-1 -right-1 flex items-center justify-center',
              'bg-red-500 text-white rounded-full font-bold',
              'shadow-lg shadow-red-500/30',
              sizeClasses[size]
            )}
          >
            {count > 99 ? '99+' : count}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}

// شارة صغيرة للاستخدام داخل عناصر أخرى
interface MiniBadgeProps {
  count: number;
  className?: string;
}

export function MiniBadge({ count, className }: MiniBadgeProps) {
  if (count === 0) return null;

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        'absolute -top-2 -right-2 flex items-center justify-center',
        'h-5 min-w-5 text-[10px] font-bold',
        'bg-red-500 text-white rounded-full px-1',
        'shadow-lg shadow-red-500/30',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </motion.span>
  );
}

export default NotificationBadge;
