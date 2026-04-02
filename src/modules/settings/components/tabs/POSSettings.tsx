// ============================================
// POS Settings Tab - إعدادات نقطة البيع
// ============================================

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SettingsTabProps } from './types';

// استخدام memo لتحسين الأداء
export const POSSettings = memo(function POSSettings({ settings, setSettings }: SettingsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-amber-500" />
            إعدادات نقطة البيع
          </CardTitle>
          <CardDescription>تخصيص تجربة نقطة البيع</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium">طلب العميل</p>
                <p className="text-sm text-muted-foreground">طلب اختيار العميل قبل كل عملية</p>
              </div>
              <Switch
                checked={settings.askForCustomer}
                onCheckedChange={(v) => setSettings({ ...settings, askForCustomer: v })}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium">إظهار الخصم</p>
                <p className="text-sm text-muted-foreground">إظهار حقل الخصم في شاشة نقطة البيع</p>
              </div>
              <Switch
                checked={settings.showDiscount}
                onCheckedChange={(v) => setSettings({ ...settings, showDiscount: v })}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium">الدفع المتعدد</p>
                <p className="text-sm text-muted-foreground">السماح بالدفع بأكثر من طريقة</p>
              </div>
              <Switch
                checked={settings.allowMultiPayment}
                onCheckedChange={(v) => setSettings({ ...settings, allowMultiPayment: v })}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium">طباعة تلقائية</p>
                <p className="text-sm text-muted-foreground">طباعة الفاتورة تلقائياً بعد البيع</p>
              </div>
              <Switch
                checked={settings.printAfterSale}
                onCheckedChange={(v) => setSettings({ ...settings, printAfterSale: v })}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium">تفعيل الصوت</p>
                <p className="text-sm text-muted-foreground">تشغيل أصوات التنبيه</p>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(v) => setSettings({ ...settings, soundEnabled: v })}
              />
            </div>
          </div>

          <Separator />

          <div className="max-w-sm space-y-2">
            <Label>طريقة الدفع الافتراضية</Label>
            <Select
              value={settings.defaultPaymentMethod}
              onValueChange={(v) => setSettings({ ...settings, defaultPaymentMethod: v })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">نقداً</SelectItem>
                <SelectItem value="card">بطاقة</SelectItem>
                <SelectItem value="mobile">كي نت</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
