'use client';

import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, Check, X, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAppStore, formatCurrency } from '@/store';

interface ImportRow {
  row: number;
  data: Record<string, string>;
  status: 'pending' | 'valid' | 'invalid';
  errors: string[];
}

const templateColumns = [
  { key: 'barcode', label: 'الباركود', required: true },
  { key: 'name', label: 'اسم المنتج', required: true },
  { key: 'nameAr', label: 'الاسم بالعربي', required: false },
  { key: 'costPrice', label: 'سعر التكلفة', required: true },
  { key: 'sellingPrice', label: 'سعر البيع', required: true },
  { key: 'category', label: 'الفئة', required: false },
  { key: 'brand', label: 'البراند', required: false },
  { key: 'quantity', label: 'الكمية', required: false },
];

export function ImportProductsPage() {
  const { currency } = useAppStore();
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'done'>('upload');
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = templateColumns.map(c => c.label).join(',');
    const sampleRow = templateColumns.map(c => {
      if (c.key === 'barcode') return '001';
      if (c.key === 'name') return 'منتج تجريبي';
      if (c.key === 'costPrice') return '100';
      if (c.key === 'sellingPrice') return '150';
      return '';
    }).join(',');
    
    const csv = `${headers}\n${sampleRow}`;
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('الملف فارغ أو لا يحتوي على بيانات');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const rows: ImportRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });
        rows.push({
          row: i,
          data: rowData,
          status: 'pending',
          errors: [],
        });
      }

      // Auto-map fields
      const mapping: Record<string, string> = {};
      templateColumns.forEach(col => {
        const matchedHeader = headers.find(h => 
          h.toLowerCase().includes(col.key.toLowerCase()) ||
          h.includes(col.label)
        );
        if (matchedHeader) {
          mapping[col.key] = matchedHeader;
        }
      });

      setFieldMapping(mapping);
      setImportData(rows);
      setStep('mapping');
    };
    reader.readAsText(file);
  };

  const validateData = () => {
    const updatedData = importData.map(row => {
      const errors: string[] = [];
      
      templateColumns.forEach(col => {
        if (col.required) {
          const mappedField = fieldMapping[col.key];
          const value = mappedField ? row.data[mappedField] : '';
          if (!value) {
            errors.push(`${col.label} مطلوب`);
          }
        }
      });

      return {
        ...row,
        status: errors.length > 0 ? 'invalid' : 'valid',
        errors,
      };
    });

    setImportData(updatedData);
    setStep('preview');
  };

  const runImport = async () => {
    setStep('importing');
    const validRows = importData.filter(r => r.status === 'valid');
    
    for (let i = 0; i < validRows.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call
      setImportProgress(((i + 1) / validRows.length) * 100);
    }

    setStep('done');
  };

  const resetImport = () => {
    setImportData([]);
    setFieldMapping({});
    setStep('upload');
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validCount = importData.filter(r => r.status === 'valid').length;
  const invalidCount = importData.filter(r => r.status === 'invalid').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">استيراد المنتجات</h1>
          <p className="text-muted-foreground">استيراد المنتجات من ملفات Excel أو CSV</p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4 ml-2" /> تحميل نموذج
        </Button>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {['upload', 'mapping', 'preview', 'importing', 'done'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === s ? 'bg-primary text-primary-foreground' :
              ['mapping', 'preview', 'importing', 'done'].indexOf(step) > i ? 'bg-green-500 text-white' :
              'bg-muted text-muted-foreground'
            }`}>
              {['mapping', 'preview', 'importing', 'done'].indexOf(step) > i ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < 4 && <div className="w-12 h-1 bg-muted mx-1" />}
          </div>
        ))}
      </div>

      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>رفع الملف</CardTitle>
            <CardDescription>اختر ملف CSV أو Excel يحتوي على بيانات المنتجات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">اسحب الملف هنا أو اضغط للاختيار</p>
                <p className="text-sm text-muted-foreground mt-2">CSV, XLS, XLSX</p>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'mapping' && (
        <Card>
          <CardHeader>
            <CardTitle>تخطيط الحقول</CardTitle>
            <CardDescription>ربط أعمدة الملف بحقول النظام</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {templateColumns.map(col => (
              <div key={col.key} className="flex items-center gap-4">
                <div className="w-40">
                  <Label>{col.label} {col.required && <span className="text-red-500">*</span>}</Label>
                </div>
                <Select
                  value={fieldMapping[col.key] || ''}
                  onValueChange={(v) => setFieldMapping(prev => ({ ...prev, [col.key]: v }))}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="اختر العمود" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(importData[0]?.data || {}).map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetImport}>إلغاء</Button>
              <Button onClick={validateData}>التالي</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>ملخص الاستيراد</AlertTitle>
            <AlertDescription>
              <div className="flex gap-4 mt-2">
                <Badge variant="default">{validCount} صالح للاستيراد</Badge>
                {invalidCount > 0 && <Badge variant="destructive">{invalidCount} يحتوي على أخطاء</Badge>}
              </div>
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الصف</TableHead>
                    {Object.values(fieldMapping).map(header => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importData.slice(0, 10).map(row => (
                    <TableRow key={row.row}>
                      <TableCell>{row.row}</TableCell>
                      {Object.values(fieldMapping).map(header => (
                        <TableCell key={header}>{row.data[header]}</TableCell>
                      ))}
                      <TableCell>
                        <Badge variant={row.status === 'valid' ? 'default' : 'destructive'}>
                          {row.status === 'valid' ? 'صالح' : 'خطأ'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {importData.length > 10 && (
                <p className="text-center text-muted-foreground py-2">
                  و {importData.length - 10} صف آخر...
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStep('mapping')}>رجوع</Button>
            <Button onClick={runImport} disabled={validCount === 0}>
              استيراد {validCount} منتج
            </Button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <p className="text-lg font-medium">جاري الاستيراد...</p>
              <Progress value={importProgress} className="max-w-md mx-auto" />
              <p className="text-sm text-muted-foreground">{Math.round(importProgress)}%</p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'done' && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-medium">تم الاستيراد بنجاح!</p>
              <p className="text-muted-foreground">تم استيراد {validCount} منتج</p>
              <Button onClick={resetImport}>استيراد ملف آخر</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
