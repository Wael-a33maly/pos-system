// ============================================
// POSHeader Component - رأس صفحة نقطة البيع
// ============================================

import { memo } from 'react';
import {
  Clock,
  Receipt,
  RotateCcw,
  Settings,
  Wallet,
  Maximize2,
  Minimize2,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface POSHeaderProps {
  instantMode: boolean;
  fullscreen: boolean;
  pendingInvoicesCount: number;
  onToggleInstantMode: () => void;
  onShowPendingDialog: () => void;
  onShowShiftDialog: () => void;
  onShowReturnDialog: () => void;
  onShowSettingsDialog: () => void;
  onShowExpenseDialog: () => void;
  onToggleFullscreen: () => void;
  onCloseShift: () => void;
}

/**
 * مكون رأس صفحة نقطة البيع
 * يحتوي على أزرار الإجراءات السريعة والتحكم
 */
const POSHeader = memo(function POSHeader({
  instantMode,
  fullscreen,
  pendingInvoicesCount,
  onToggleInstantMode,
  onShowPendingDialog,
  onShowShiftDialog,
  onShowReturnDialog,
  onShowSettingsDialog,
  onShowExpenseDialog,
  onToggleFullscreen,
  onCloseShift,
}: POSHeaderProps) {
  return (
    <div className="h-14 border-b bg-card flex items-center justify-between px-4">
      {/* الإجراءات السريعة */}
      <div className="flex items-center gap-2">
        {/* زر الوضع الفوري */}
        <Button
          variant={instantMode ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleInstantMode}
          className="gap-1"
        >
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">Instant</span>
        </Button>

        {/* العمليات السابقة */}
        <Button variant="outline" size="sm" className="gap-1">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">العمليات السابقة</span>
        </Button>

        {/* الفواتير المعلقة */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1 relative"
          onClick={onShowPendingDialog}
        >
          <Receipt className="h-4 w-4" />
          <span className="hidden sm:inline">المعلقة</span>
          {pendingInvoicesCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {pendingInvoicesCount}
            </Badge>
          )}
        </Button>

        {/* تفاصيل الوردية */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={onShowShiftDialog}
        >
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">تفاصيل الوردية</span>
        </Button>

        {/* مرتجع */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={onShowReturnDialog}
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">مرتجع</span>
        </Button>
      </div>

      {/* التحكم */}
      <div className="flex items-center gap-2">
        {/* الإعدادات */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={onShowSettingsDialog}
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">إعدادات</span>
        </Button>

        {/* مصروف */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={onShowExpenseDialog}
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">مصروف</span>
        </Button>

        {/* ملء الشاشة */}
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleFullscreen}
        >
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>

        {/* إغلاق الوردية */}
        <Button variant="destructive" size="sm" className="gap-1" onClick={onCloseShift}>
          <X className="h-4 w-4" />
          <span className="hidden sm:inline">إغلاق الوردية</span>
        </Button>

        {/* خروج */}
        <Button variant="outline" size="sm" asChild>
          <a href="/">خروج</a>
        </Button>
      </div>
    </div>
  );
});

export { POSHeader };
