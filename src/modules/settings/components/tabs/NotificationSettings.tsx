// ============================================
// Notification Settings Tab - إعدادات التنبيهات
// ============================================

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { SettingsTabProps } from './types';

// استخدام memo لتحسين الأداء
export const NotificationSettings = memo(function NotificationSettings({ settings, setSettings }: SettingsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-cyan-500" />
            إعدادات التنبيهات
          </CardTitle>
          <CardDescription>إدارة التنبيهات والإشعارات</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium">تنبيه المخزون المنخفض</p>
                <p className="text-sm text-muted-foreground">إرسال تنبيه عند انخفاض المخزون</p>
              </div>
              <Switch
                checked={settings.lowStockAlert}
                onCheckedChange={(v) => setSettings({ ...settings, lowStockAlert: v })}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium">التقرير اليومي</p>
                <p className="text-sm text-muted-foreground">إرسال تقرير يومي عبر البريد</p>
              </div>
              <Switch
                checked={settings.dailyReportEmail}
                onCheckedChange={(v) => setSettings({ ...settings, dailyReportEmail: v })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>حد التنبيه للمخزون المنخفض</Label>
              <Input
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>بريد استلام التقارير</Label>
              <Input
                type="email"
                value={settings.reportEmail}
                onChange={(e) => setSettings({ ...settings, reportEmail: e.target.value })}
                placeholder="reports@company.com"
                className="rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
