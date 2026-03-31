// ============================================
// Barcode Settings Tab - إعدادات الباركود
// ============================================

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { QrCode } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BarcodeSettingsTabProps } from './types';

// استخدام memo لتحسين الأداء
export const BarcodeSettings = memo(function BarcodeSettings({ barcodeSettings, setBarcodeSettings }: BarcodeSettingsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-teal-500" />
            إعدادات الباركود
          </CardTitle>
          <CardDescription>تخصيص إعدادات طباعة الباركود</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>صيغة الباركود</Label>
              <Select
                value={barcodeSettings.format}
                onValueChange={(v) => setBarcodeSettings({ ...barcodeSettings, format: v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CODE128">CODE128</SelectItem>
                  <SelectItem value="EAN13">EAN13</SelectItem>
                  <SelectItem value="CODE39">CODE39</SelectItem>
                  <SelectItem value="UPC">UPC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>العرض</Label>
              <Input
                type="number"
                value={barcodeSettings.width}
                onChange={(e) => setBarcodeSettings({ ...barcodeSettings, width: parseInt(e.target.value) })}
                min={1}
                max={5}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>الارتفاع</Label>
              <Input
                type="number"
                value={barcodeSettings.height}
                onChange={(e) => setBarcodeSettings({ ...barcodeSettings, height: parseInt(e.target.value) })}
                min={50}
                max={200}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>حجم الخط</Label>
              <Input
                type="number"
                value={barcodeSettings.fontSize}
                onChange={(e) => setBarcodeSettings({ ...barcodeSettings, fontSize: parseInt(e.target.value) })}
                min={10}
                max={24}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>الهامش العلوي</Label>
              <Input
                type="number"
                value={barcodeSettings.marginTop}
                onChange={(e) => setBarcodeSettings({ ...barcodeSettings, marginTop: parseInt(e.target.value) })}
                min={0}
                max={30}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>الهامش السفلي</Label>
              <Input
                type="number"
                value={barcodeSettings.marginBottom}
                onChange={(e) => setBarcodeSettings({ ...barcodeSettings, marginBottom: parseInt(e.target.value) })}
                min={0}
                max={30}
                className="rounded-xl"
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl max-w-sm">
            <div>
              <p className="font-medium">إظهار القيمة</p>
              <p className="text-sm text-muted-foreground">عرض القيمة أسفل الباركود</p>
            </div>
            <Switch
              checked={barcodeSettings.displayValue}
              onCheckedChange={(v) => setBarcodeSettings({ ...barcodeSettings, displayValue: v })}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
