'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppStore, formatCurrency } from '@/store';
import { toast } from 'sonner';

interface Account {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  type: string;
}

interface JournalLine {
  id: string;
  accountId: string;
  account?: Account;
  debit: number;
  credit: number;
  description: string;
}

interface JournalEntryFormProps {
  accounts: Account[];
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: {
    id?: string;
    date?: string;
    description?: string;
    reference?: string;
    lines?: JournalLine[];
  };
}

export function JournalEntryForm({ accounts, onSuccess, onCancel, initialData }: JournalEntryFormProps) {
  const { currency } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    description: initialData?.description || '',
    reference: initialData?.reference || '',
  });

  const [lines, setLines] = useState<JournalLine[]>(
    initialData?.lines || [
      { id: generateLineId(), accountId: '', debit: 0, credit: 0, description: '' },
      { id: generateLineId(), accountId: '', debit: 0, credit: 0, description: '' },
    ]
  );

  function generateLineId() {
    return Math.random().toString(36).substring(2, 9);
  }

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: generateLineId(), accountId: '', debit: 0, credit: 0, description: '' },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 2) {
      toast.error('يجب أن يحتوي القيد على بندين على الأقل');
      return;
    }
    setLines((prev) => prev.filter((line) => line.id !== id));
  };

  const updateLine = (id: string, field: keyof JournalLine, value: any) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.id !== id) return line;

        const updatedLine = { ...line, [field]: value };

        // إذا تم تعديل المدين، نصفر الدائن
        if (field === 'debit' && value > 0) {
          updatedLine.credit = 0;
        }
        // إذا تم تعديل الدائن، نصفر المدين
        if (field === 'credit' && value > 0) {
          updatedLine.debit = 0;
        }

        // إضافة معلومات الحساب
        if (field === 'accountId') {
          const account = accounts.find((a) => a.id === value);
          updatedLine.account = account;
        }

        return updatedLine;
      })
    );
  };

  const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
  const hasEmptyLines = lines.some((line) => !line.accountId);
  const hasNoAmounts = lines.every((line) => line.debit === 0 && line.credit === 0);

  const validateForm = (): boolean => {
    if (!formData.date) {
      toast.error('يرجى تحديد تاريخ القيد');
      return false;
    }

    if (lines.length < 2) {
      toast.error('يجب أن يحتوي القيد على بندين على الأقل');
      return false;
    }

    if (hasEmptyLines) {
      toast.error('يرجى تحديد الحسابات لجميع البنود');
      return false;
    }

    if (hasNoAmounts) {
      toast.error('يجب إدخال مبالغ في البنود');
      return false;
    }

    if (!isBalanced) {
      toast.error('القيد غير متوازن. يجب أن يتساوى المدين مع الدائن');
      return false;
    }

    return true;
  };

  const handleSave = async (asDraft: boolean = false) => {
    if (!validateForm()) return;

    setSaving(true);
    setSaveAsDraft(asDraft);

    try {
      const response = await fetch('/api/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          lines: lines.map((line) => ({
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            description: line.description,
          })),
          status: asDraft ? 'DRAFT' : 'POSTED',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'حدث خطأ في حفظ القيد');
      }

      toast.success(asDraft ? 'تم حفظ القيد كمسودة' : 'تم ترحيل القيد بنجاح');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
      setSaveAsDraft(false);
    }
  };

  // تجميع الحسابات حسب النوع
  const groupedAccounts = accounts.reduce((acc, account) => {
    const type = account.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  const typeLabels: Record<string, string> = {
    ASSET: 'الأصول',
    LIABILITY: 'الخصوم',
    EQUITY: 'حقوق الملكية',
    REVENUE: 'الإيرادات',
    EXPENSE: 'المصروفات',
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* البيانات الأساسية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>التاريخ *</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
          />
        </div>
        <div>
          <Label>المرجع</Label>
          <Input
            value={formData.reference}
            onChange={(e) => setFormData((prev) => ({ ...prev, reference: e.target.value }))}
            placeholder="رقم الفاتورة، العقد، إلخ..."
          />
        </div>
        <div>
          <Label>الوصف</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="وصف القيد..."
          />
        </div>
      </div>

      {/* بنود القيد */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">بنود القيد</h3>
            <Button variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة بند
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[40%]">الحساب</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead className="w-[150px]">مدين</TableHead>
                  <TableHead className="w-[150px]">دائن</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, index) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <Select
                        value={line.accountId}
                        onValueChange={(v) => updateLine(line.id, 'accountId', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحساب..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(groupedAccounts).map(([type, accs]) => (
                            <div key={type}>
                              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                {typeLabels[type] || type}
                              </div>
                              {accs.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  <span className="font-mono text-xs ml-2">{account.code}</span>
                                  {account.nameAr || account.name}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={line.description}
                        onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                        placeholder="وصف..."
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.debit || ''}
                        onChange={(e) =>
                          updateLine(line.id, 'debit', parseFloat(e.target.value) || 0)
                        }
                        className={line.debit > 0 ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.credit || ''}
                        onChange={(e) =>
                          updateLine(line.id, 'credit', parseFloat(e.target.value) || 0)
                        }
                        className={line.credit > 0 ? 'bg-green-50 dark:bg-green-900/20' : ''}
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(line.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30 font-bold">
                  <TableCell colSpan={2}>الإجمالي</TableCell>
                  <TableCell className={totalDebit > 0 ? 'text-blue-600' : ''}>
                    {formatCurrency(totalDebit, currency)}
                  </TableCell>
                  <TableCell className={totalCredit > 0 ? 'text-green-600' : ''}>
                    {formatCurrency(totalCredit, currency)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* حالة التوازن */}
          <div className="mt-4">
            {isBalanced && totalDebit > 0 ? (
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  القيد متوازن - يمكن حفظه وترحيله
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 dark:text-red-400">
                  القيد غير متوازن - الفرق: {formatCurrency(Math.abs(totalDebit - totalCredit), currency)}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* أزرار الحفظ */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(true)}
            disabled={saving || hasEmptyLines}
          >
            {saving && saveAsDraft && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
            حفظ كمسودة
          </Button>
          <Button
            onClick={() => handleSave(false)}
            disabled={saving || !isBalanced || hasEmptyLines || hasNoAmounts}
          >
            {saving && !saveAsDraft && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
            حفظ وترحيل
          </Button>
        </div>
      </div>
    </div>
  );
}
