// ============================================
// POSSettingsDialog Component - نافذة إعدادات نقطة البيع
// ============================================

import { memo } from 'react';
import { Settings, Eye, Type, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { POSSettings, ColorPreset } from '../types/pos.types';
import { colorPresets } from '../constants/defaults';

interface POSSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: POSSettings;
  onUpdateSettings: (settings: Partial<POSSettings>) => void;
  onResetSettings: () => void;
}

/**
 * مكون نافذة إعدادات نقطة البيع
 * يتيح تخصيص عرض بطاقات المنتجات والخطوط والألوان
 */
const POSSettingsDialog = memo(function POSSettingsDialog({
  open,
  onOpenChange,
  settings,
  onUpdateSettings,
  onResetSettings,
}: POSSettingsDialogProps) {
  const handleColorPresetClick = (preset: ColorPreset) => {
    onUpdateSettings({
      cardBorderColor: preset.border,
      productPriceColor: preset.price,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إعدادات نقطة البيع
          </DialogTitle>
          <DialogDescription>
            تخصيص عرض بطاقات المنتجات والخطوط
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="display" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="display" className="gap-2">
              <Eye className="h-4 w-4" />
              العرض
            </TabsTrigger>
            <TabsTrigger value="fonts" className="gap-2">
              <Type className="h-4 w-4" />
              الخطوط
            </TabsTrigger>
            <TabsTrigger value="style" className="gap-2">
              <Palette className="h-4 w-4" />
              التصميم
            </TabsTrigger>
          </TabsList>

          {/* تبويب العرض */}
          <TabsContent value="display" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">عناصر بطاقة المنتج</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-name" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    عرض اسم المنتج
                  </Label>
                  <Switch
                    id="show-name"
                    checked={settings.showProductName}
                    onCheckedChange={(checked) => onUpdateSettings({ showProductName: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-barcode" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    عرض الباركود
                  </Label>
                  <Switch
                    id="show-barcode"
                    checked={settings.showProductBarcode}
                    onCheckedChange={(checked) => onUpdateSettings({ showProductBarcode: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-price" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    عرض السعر
                  </Label>
                  <Switch
                    id="show-price"
                    checked={settings.showProductPrice}
                    onCheckedChange={(checked) => onUpdateSettings({ showProductPrice: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-image" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    عرض الصورة
                  </Label>
                  <Switch
                    id="show-image"
                    checked={settings.showProductImage}
                    onCheckedChange={(checked) => onUpdateSettings({ showProductImage: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-stock" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    عرض المخزون
                  </Label>
                  <Switch
                    id="show-stock"
                    checked={settings.showProductStock}
                    onCheckedChange={(checked) => onUpdateSettings({ showProductStock: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">عرض الشبكة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>عدد الأعمدة: {settings.gridViewColumns}</Label>
                  </div>
                  <Slider
                    value={[settings.gridViewColumns]}
                    onValueChange={([value]) => onUpdateSettings({ gridViewColumns: value })}
                    min={2}
                    max={8}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب الخطوط */}
          <TabsContent value="fonts" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">حجم الخطوط</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>حجم خط الاسم: {settings.productNameFontSize}px</Label>
                  </div>
                  <Slider
                    value={[settings.productNameFontSize]}
                    onValueChange={([value]) => onUpdateSettings({ productNameFontSize: value })}
                    min={10}
                    max={24}
                    step={1}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>حجم خط السعر: {settings.productPriceFontSize}px</Label>
                  </div>
                  <Slider
                    value={[settings.productPriceFontSize]}
                    onValueChange={([value]) => onUpdateSettings({ productPriceFontSize: value })}
                    min={12}
                    max={28}
                    step={1}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>حجم خط الباركود: {settings.productBarcodeFontSize}px</Label>
                  </div>
                  <Slider
                    value={[settings.productBarcodeFontSize]}
                    onValueChange={([value]) => onUpdateSettings({ productBarcodeFontSize: value })}
                    min={8}
                    max={16}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">ألوان الخطوط</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name-color">لون اسم المنتج</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      id="name-color"
                      value={settings.productNameColor}
                      onChange={(e) => onUpdateSettings({ productNameColor: e.target.value })}
                      className="w-12 h-8 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.productNameColor}
                      onChange={(e) => onUpdateSettings({ productNameColor: e.target.value })}
                      className="w-24 h-8"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="price-color">لون السعر</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      id="price-color"
                      value={settings.productPriceColor}
                      onChange={(e) => onUpdateSettings({ productPriceColor: e.target.value })}
                      className="w-12 h-8 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.productPriceColor}
                      onChange={(e) => onUpdateSettings({ productPriceColor: e.target.value })}
                      className="w-24 h-8"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="barcode-color">لون الباركود</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      id="barcode-color"
                      value={settings.productBarcodeColor}
                      onChange={(e) => onUpdateSettings({ productBarcodeColor: e.target.value })}
                      className="w-12 h-8 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.productBarcodeColor}
                      onChange={(e) => onUpdateSettings({ productBarcodeColor: e.target.value })}
                      className="w-24 h-8"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب التصميم */}
          <TabsContent value="style" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">حدود البطاقة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>سمك الحدود: {settings.cardBorderWidth}px</Label>
                  </div>
                  <Slider
                    value={[settings.cardBorderWidth]}
                    onValueChange={([value]) => onUpdateSettings({ cardBorderWidth: value })}
                    min={0}
                    max={4}
                    step={1}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="border-color">لون الحدود</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      id="border-color"
                      value={settings.cardBorderColor}
                      onChange={(e) => onUpdateSettings({ cardBorderColor: e.target.value })}
                      className="w-12 h-8 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.cardBorderColor}
                      onChange={(e) => onUpdateSettings({ cardBorderColor: e.target.value })}
                      className="w-24 h-8"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>استدارة الزوايا: {settings.cardBorderRadius}px</Label>
                  </div>
                  <Slider
                    value={[settings.cardBorderRadius]}
                    onValueChange={([value]) => onUpdateSettings({ cardBorderRadius: value })}
                    min={0}
                    max={24}
                    step={2}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>المسافة الداخلية: {settings.cardPadding}px</Label>
                  </div>
                  <Slider
                    value={[settings.cardPadding]}
                    onValueChange={([value]) => onUpdateSettings({ cardPadding: value })}
                    min={4}
                    max={20}
                    step={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">ألوان جاهزة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {colorPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      className="h-auto py-2 flex-col gap-1"
                      onClick={() => handleColorPresetClick(preset)}
                    >
                      <div className="flex gap-1">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: preset.border }}
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.price }}
                        />
                      </div>
                      <span className="text-xs">{preset.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onResetSettings}>
            استعادة الافتراضي
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            حفظ الإعدادات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export { POSSettingsDialog };
