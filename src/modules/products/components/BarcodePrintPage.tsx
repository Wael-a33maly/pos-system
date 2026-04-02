'use client';

import { useState, useRef } from 'react';
import { Search, Printer, QrCode, Package, Settings, Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { useAppStore, formatCurrency } from '@/store';
import type { Product } from '@/types';

const mockProducts: Product[] = [
  { id: '1', barcode: '001', name: 'آيفون 15 برو ماكس', sellingPrice: 4999, costPrice: 4000, categoryId: '1', unit: 'piece', hasVariants: false, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', barcode: '002', name: 'سامسونج جالكسي S24', sellingPrice: 3999, costPrice: 3200, categoryId: '1', unit: 'piece', hasVariants: false, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', barcode: '003', name: 'سماعات آبل برو', sellingPrice: 999, costPrice: 800, categoryId: '1', unit: 'piece', hasVariants: false, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '4', barcode: '004', name: 'شاحن سريع 65W', sellingPrice: 149, costPrice: 100, categoryId: '1', unit: 'piece', hasVariants: false, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '5', barcode: '005', name: 'غطاء حماية آيفون', sellingPrice: 79, costPrice: 30, categoryId: '1', unit: 'piece', hasVariants: false, isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

interface PrintItem {
  product: Product;
  quantity: number;
}

const paperSizes = [
  { id: 'small', name: 'صغير (50x25mm)', width: 50, height: 25 },
  { id: 'medium', name: 'متوسط (70x40mm)', width: 70, height: 40 },
  { id: 'large', name: 'كبير (100x50mm)', width: 100, height: 50 },
];

export function BarcodePrintPage() {
  const { currency } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [products] = useState<Product[]>(mockProducts);
  const [printItems, setPrintItems] = useState<PrintItem[]>([]);
  const [selectedPaperSize, setSelectedPaperSize] = useState('medium');
  const [showPrice, setShowPrice] = useState(true);
  const [showName, setShowName] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode.includes(searchQuery)
  );

  const addToPrint = (product: Product) => {
    const existing = printItems.find(item => item.product.id === product.id);
    if (existing) {
      setPrintItems(prev => prev.map(item =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setPrintItems(prev => [...prev, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setPrintItems(prev => prev.filter(item => item.product.id !== productId));
    } else {
      setPrintItems(prev => prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromPrint = (productId: string) => {
    setPrintItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handlePrint = () => {
    window.print();
  };

  const paperSize = paperSizes.find(p => p.id === selectedPaperSize) || paperSizes[1];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">طباعة الباركود</h1>
          <p className="text-muted-foreground">طباعة ملصقات الباركود للمنتجات</p>
        </div>
        <Button onClick={handlePrint} disabled={printItems.length === 0}>
          <Printer className="h-4 w-4 ml-2" /> طباعة ({printItems.reduce((sum, i) => sum + i.quantity, 0)} ملصق)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Search */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الباركود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-4">
                {filteredProducts.map(product => (
                  <Button
                    key={product.id}
                    variant="outline"
                    className="h-auto flex-col gap-1 p-3"
                    onClick={() => addToPrint(product)}
                  >
                    <Package className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs truncate w-full text-center">{product.name}</span>
                    <span className="text-xs text-muted-foreground">{product.barcode}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Print Settings & Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">إعدادات الطباعة</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>حجم الورق</Label>
                <Select value={selectedPaperSize} onValueChange={setSelectedPaperSize}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {paperSizes.map(size => (
                      <SelectItem key={size.id} value={size.id}>{size.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="showName" checked={showName} onChange={(e) => setShowName(e.target.checked)} />
                <Label htmlFor="showName">إظهار اسم المنتج</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="showPrice" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} />
                <Label htmlFor="showPrice">إظهار السعر</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">قائمة الطباعة ({printItems.length} منتج)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-auto">
              {printItems.map(item => (
                <div key={item.product.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.product.sellingPrice, currency)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromPrint(item.product.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {printItems.length === 0 && (
                <p className="text-center text-muted-foreground py-4">لا توجد منتجات للطباعة</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print Preview - Hidden on screen, visible on print */}
      <div ref={printRef} className="hidden print:block">
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${paperSize.width}mm)`, gap: '2mm' }}>
          {printItems.map(item => 
            Array.from({ length: item.quantity }).map((_, i) => (
              <div
                key={`${item.product.id}-${i}`}
                style={{
                  width: `${paperSize.width}mm`,
                  height: `${paperSize.height}mm`,
                  border: '1px solid #ccc',
                  padding: '2mm',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showName && (
                  <p style={{ fontSize: '8pt', textAlign: 'center', marginBottom: '1mm', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.product.name}
                  </p>
                )}
                <div style={{ height: '15mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Barcode placeholder */}
                  <div style={{ fontFamily: 'monospace', fontSize: '6pt' }}>
                    ||||||||||||||||||||
                  </div>
                </div>
                <p style={{ fontSize: '6pt', fontFamily: 'monospace' }}>{item.product.barcode}</p>
                {showPrice && (
                  <p style={{ fontSize: '10pt', fontWeight: 'bold', marginTop: '1mm' }}>
                    {formatCurrency(item.product.sellingPrice, currency)}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
