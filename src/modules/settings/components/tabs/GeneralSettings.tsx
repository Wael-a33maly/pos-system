// ============================================
// General Settings Tab - إعدادات عامة
// ============================================

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SettingsTabProps } from './types';

// استخدام memo لتحسين الأداء
export const GeneralSettings = memo(function GeneralSettings({ settings, setSettings }: SettingsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            الإعدادات العامة
          </CardTitle>
          <CardDescription>إعدادات النظام الأساسية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* اللغة الافتراضية */}
            <div className="space-y-2">
              <Label>اللغة الافتراضية</Label>
              <Select 
                value={settings.language} 
                onValueChange={(v) => setSettings({ ...settings, language: v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* المنطقة الزمنية */}
            <div className="space-y-2">
              <Label>المنطقة الزمنية</Label>
              <Select 
                value={settings.timezone} 
                onValueChange={(v) => setSettings({ ...settings, timezone: v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asia-riyadh">الرياض (GMT+3)</SelectItem>
                  <SelectItem value="asia-dubai">دبي (GMT+4)</SelectItem>
                  <SelectItem value="africa-cairo">القاهرة (GMT+2)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* تاريخ البدء */}
            <div className="space-y-2">
              <Label>تاريخ البدء</Label>
              <Input
                type="date"
                value={settings.startDate}
                onChange={(e) => setSettings({ ...settings, startDate: e.target.value })}
                className="rounded-xl"
              />
            </div>

            {/* سمة الواجهة */}
            <div className="space-y-2">
              <Label>سمة الواجهة</Label>
              <Select 
                value={settings.language} 
                onValueChange={(v) => setSettings({ ...settings, language: v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">فاتح</SelectItem>
                  <SelectItem value="dark">داكن</SelectItem>
                  <SelectItem value="system">تلقائي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
