// ============================================
// Print Settings Tab - إعدادات الطباعة
// ============================================

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Printer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PrintSettingsTabProps } from './types';

// استخدام memo لتحسين الأداء
export const PrintSettings = memo(function PrintSettings({ printSettings, setPrintSettings }: PrintSettingsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-orange-500" />
            إعدادات الطباعة
          </CardTitle>
          <CardDescription>تخصيص إعدادات الطابعة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>حجم الورق</Label>
              <Select
                value={printSettings.paperSize}
                onValueChange={(v) => setPrintSettings({ ...printSettings, paperSize: v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="80mm">80mm</SelectItem>
                  <SelectItem value="58mm">58mm</SelectItem>
                  <SelectItem value="A4">A4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>عدد النسخ</Label>
              <Input
                type="number"
                value={printSettings.copies}
                onChange={(e) => setPrintSettings({ ...printSettings, copies: parseInt(e.target.value) })}
                min={1}
                max={5}
                className="rounded-xl"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium">طباعة تلقائية</p>
                <p className="text-sm text-muted-foreground">طباعة تلقائية بعد كل عملية</p>
              </div>
              <Switch
                checked={printSettings.autoPrint}
                onCheckedChange={(v) => setPrintSettings({ ...printSettings, autoPrint: v })}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium">إظهار الشعار</p>
                <p className="text-sm text-muted-foreground">عرض شعار الشركة على الطباعة</p>
              </div>
              <Switch
                checked={printSettings.showLogo}
                onCheckedChange={(v) => setPrintSettings({ ...printSettings, showLogo: v })}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium">إظهار الضريبة</p>
                <p className="text-sm text-muted-foreground">عرض تفاصيل الضريبة</p>
              </div>
              <Switch
                checked={printSettings.showTax}
                onCheckedChange={(v) => setPrintSettings({ ...printSettings, showTax: v })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>نص التذييل</Label>
            <Textarea
              value={printSettings.footerText}
              onChange={(e) => setPrintSettings({ ...printSettings, footerText: e.target.value })}
              placeholder="نص يظهر في نهاية الطباعة"
              className="rounded-xl min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
