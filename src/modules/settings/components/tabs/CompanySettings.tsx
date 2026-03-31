// ============================================
// Company Settings Tab - إعدادات الشركة
// ============================================

'use client';

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Upload, X, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { CompanyTabProps } from './types';

// استخدام memo لتحسين الأداء
export const CompanySettings = memo(function CompanySettings({ 
  settings, 
  setSettings, 
  companyLogo, 
  setCompanyLogo 
}: CompanyTabProps) {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // معالج رفع الشعار
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logo');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setCompanyLogo(data.url);
      } else {
        console.error('Upload failed:', data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // إزالة الشعار
  const handleRemoveLogo = () => {
    setCompanyLogo(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* بطاقة شعار الشركة */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-blue-500" />
            شعار الشركة
          </CardTitle>
          <CardDescription>قم برفع شعار الشركة لاستخدامه في الفواتير والتقارير</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* معاينة الشعار */}
            <div className="relative group">
              {companyLogo ? (
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl border-2 border-border overflow-hidden bg-muted flex items-center justify-center">
                    <img
                      src={companyLogo}
                      alt="شعار الشركة"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -left-2 w-7 h-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 flex flex-col items-center justify-center gap-2">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground">لا يوجد شعار</span>
                </div>
              )}
            </div>

            {/* منطقة الرفع */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-col gap-3">
                <label
                  htmlFor="logo-upload"
                  className={cn(
                    "flex items-center justify-center gap-2 px-6 py-4 rounded-xl cursor-pointer transition-all",
                    "border-2 border-dashed border-muted-foreground/30 hover:border-primary/50",
                    "bg-muted/20 hover:bg-muted/40",
                    isUploadingLogo && "pointer-events-none opacity-50"
                  )}
                >
                  {isUploadingLogo ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="h-5 w-5 text-primary" />
                    </motion.div>
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="font-medium">
                    {isUploadingLogo ? 'جاري الرفع...' : 'اضغط لرفع الشعار'}
                  </span>
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={isUploadingLogo}
                />
                <p className="text-xs text-muted-foreground text-center">
                  الأحجام الموصى بها: 200x200 بكسل • الحد الأقصى: 5MB • الصيغ: PNG, JPG, SVG
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* بطاقة معلومات الشركة */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-500" />
            معلومات الشركة
          </CardTitle>
          <CardDescription>البيانات الأساسية للشركة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>اسم الشركة (عربي)</Label>
              <Input
                value={settings.companyNameAr}
                onChange={(e) => setSettings({ ...settings, companyNameAr: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>اسم الشركة (إنجليزي)</Label>
              <Input
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                value={settings.companyPhone}
                onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={settings.companyEmail}
                onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>الرقم الضريبي</Label>
              <Input
                value={settings.taxNumber}
                onChange={(e) => setSettings({ ...settings, taxNumber: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>العنوان</Label>
              <Textarea
                value={settings.companyAddress}
                onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                className="rounded-xl min-h-[80px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
