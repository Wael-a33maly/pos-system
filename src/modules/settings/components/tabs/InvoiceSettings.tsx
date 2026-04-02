// ============================================
// Invoice Settings Tab - إعدادات الفواتير
// ============================================

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { SettingsTabProps } from './types';

// استخدام memo لتحسين الأداء
export const InvoiceSettings = memo(function InvoiceSettings({ settings, setSettings }: SettingsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-rose-500" />
            إعدادات الفواتير
          </CardTitle>
          <CardDescription>تخصيص شكل ومحتوى الفواتير</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>بادئة رقم الفاتورة</Label>
              <Input
                value={settings.invoicePrefix}
                onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>رقم البداية</Label>
              <Input
                type="number"
                value={settings.invoiceStartNumber}
                onChange={(e) => setSettings({ ...settings, invoiceStartNumber: parseInt(e.target.value) })}
                className="rounded-xl"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium">إظهار الضريبة</p>
                <p className="text-sm text-muted-foreground">عرض قيمة الضريبة على الفاتورة</p>
              </div>
              <Switch
                checked={settings.showTaxOnInvoice}
                onCheckedChange={(v) => setSettings({ ...settings, showTaxOnInvoice: v })}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium">إظهار الشعار</p>
                <p className="text-sm text-muted-foreground">عرض شعار الشركة على الفاتورة</p>
              </div>
              <Switch
                checked={settings.showLogoOnInvoice}
                onCheckedChange={(v) => setSettings({ ...settings, showLogoOnInvoice: v })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>ملاحظات الفاتورة</Label>
            <Textarea
              value={settings.invoiceNotes}
              onChange={(e) => setSettings({ ...settings, invoiceNotes: e.target.value })}
              placeholder="ملاحظات تظهر في نهاية الفاتورة"
              className="rounded-xl min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
