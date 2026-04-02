'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useAppStore, formatCurrency } from '@/store';

interface OpenShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function OpenShiftDialog({ open, onOpenChange, onSuccess }: OpenShiftDialogProps) {
  const { user, currentBranch, branches, setCurrentShift, setCurrentBranch, setBranches, currency } = useAppStore();
  
  const [step, setStep] = useState<'form' | 'creating' | 'success' | 'error'>('form');
  const [openingCash, setOpeningCash] = useState<string>('0');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [hasOpenShift, setHasOpenShift] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const prevOpenRef = useRef(open);
  
  // Load branches on mount for super admin
  useEffect(() => {
    if (isSuperAdmin && branches?.length === 0) {
      fetch('/api/branches')
        .then(res => res.json())
        .then(data => {
          if (data.branches) {
            setBranches(data.branches);
          }
        })
        .catch(console.error);
    }
  }, [isSuperAdmin, branches?.length, setBranches]);
  
  // Check for existing shift when dialog opens
  useEffect(() => {
    if (!open || prevOpenRef.current === open) {
      prevOpenRef.current = open;
      return;
    }
    prevOpenRef.current = open;
    
    // Use setTimeout to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      setLoading(true);
      
      fetch(`/api/shifts?userId=${user?.id}&status=OPEN`)
        .then(res => res.json())
        .then(data => {
          if (data.shifts && data.shifts.length > 0) {
            setCurrentShift(data.shifts[0]);
            setHasOpenShift(true);
            setStep('success');
          } else {
            setHasOpenShift(false);
            setStep('form');
          }
          setLoading(false);
        })
        .catch(() => {
          setStep('form');
          setLoading(false);
        });
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [open, user?.id, setCurrentShift]);
  
  const handleSubmit = async () => {
    const cashValue = parseFloat(openingCash);
    if (isNaN(cashValue) || cashValue < 0) {
      setErrorMessage('يرجى إدخال رصيد افتتاحي صحيح');
      return;
    }
    
    const branchId = isSuperAdmin ? selectedBranchId : currentBranch?.id;
    
    if (!branchId) {
      setErrorMessage('يرجى اختيار الفرع');
      return;
    }
    
    // Validate user ID - must be a valid string
    if (!user?.id || typeof user.id !== 'string' || user.id.length < 10) {
      setErrorMessage('يرجى تسجيل الدخول مرة أخرى');
      setStep('error');
      return;
    }
    
    setStep('creating');
    setErrorMessage('');
    
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          userId: user.id,
          openingCash: cashValue,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setCurrentShift(data.shift);
        
        // Update current branch if super admin selected a different branch
        if (isSuperAdmin && selectedBranchId) {
          const branch = branches?.find(b => b.id === selectedBranchId);
          if (branch) {
            setCurrentBranch(branch);
          }
        }
        
        setStep('success');
        
        // Close dialog and navigate after short delay
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
        }, 500);
      } else {
        setErrorMessage(data.error || 'حدث خطأ في فتح الوردية');
        setStep('error');
      }
    } catch (error) {
      console.error('Error creating shift:', error);
      setErrorMessage('حدث خطأ في الاتصال');
      setStep('error');
    }
  };
  
  const handleContinueWithOpenShift = () => {
    onSuccess();
    onOpenChange(false);
  };
  
  // Loading state
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogTitle className="sr-only">جاري التحميل</DialogTitle>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Success state (already has open shift)
  if (step === 'success' && hasOpenShift) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              وردية مفتوحة
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <p className="text-muted-foreground mb-4">لديك وردية مفتوحة بالفعل</p>
            <p className="text-sm text-muted-foreground">
              يمكنك المتابعة لنقطة البيع
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button onClick={handleContinueWithOpenShift}>
              المتابعة لنقطة البيع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Success state (just created)
  if (step === 'success' && !hasOpenShift) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              تم فتح الوردية بنجاح
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="mr-2">جاري الانتقال لنقطة البيع...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Error state
  if (step === 'error') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              خطأ
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-red-500">{errorMessage}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button onClick={() => setStep('form')}>
              إعادة المحاولة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Form state
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            فتح وردية جديدة
          </DialogTitle>
          <DialogDescription>
            أدخل الرصيد الافتتاحي للصندوق لبدء العمل
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Branch Selection for Super Admin */}
          {isSuperAdmin && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                الفرع
              </Label>
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent>
                  {branches?.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      <div className="flex items-center gap-2">
                        <span>{branch.name}</span>
                        {branch.nameAr && (
                          <span className="text-muted-foreground">({branch.nameAr})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedBranchId && (
                <p className="text-sm text-yellow-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  يجب اختيار الفرع للمتابعة
                </p>
              )}
            </div>
          )}
          
          {/* Current Branch Display for non-Super Admin */}
          {!isSuperAdmin && currentBranch && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Building2 className="h-4 w-4" />
                الفرع الحالي
              </div>
              <p className="font-medium">{currentBranch.name}</p>
            </div>
          )}
          
          {/* Opening Cash */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2" htmlFor="openingCash">
              <Wallet className="h-4 w-4" />
              الرصيد الافتتاحي
            </Label>
            <div className="relative">
              <Input
                id="openingCash"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                className="text-lg h-12 pr-16"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Badge variant="secondary">{currency?.symbol || 'ر.س'}</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              أدخل المبلغ المتوفر في الصندوق عند بداية الوردية (يمكن تركه صفر)
            </p>
          </div>
          
          {/* User Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {isSuperAdmin ? 'سوبر مدير' : 'مستخدم'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={step === 'creating' || (isSuperAdmin && !selectedBranchId)}
          >
            {step === 'creating' ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري الفتح...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 ml-2" />
                فتح الوردية
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
