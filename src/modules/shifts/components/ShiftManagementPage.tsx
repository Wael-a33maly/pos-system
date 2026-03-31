'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  User,
  Store,
  DollarSign,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Power,
  Eye,
  Receipt,
  TrendingUp,
  Sparkles,
  Timer,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { ZReportDialog } from './ZReportDialog';
import { cn } from '@/lib/utils';

interface Shift {
  id: string;
  branchId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  totalSales: number;
  totalReturns: number;
  totalExpenses: number;
  status: 'OPEN' | 'CLOSED' | 'FORCE_CLOSED';
  closureType?: 'NORMAL' | 'FORCED' | 'AUTO' | 'BRANCH_ALL';
  closureReason?: string;
  forceClosedBy?: string;
  forceCloseRole?: string;
  sessionRevoked: boolean;
  notes?: string;
  createdAt: Date;
  user: { id: string; name: string; email: string; role: string };
  branch: { id: string; name: string };
  closedByUser?: { id: string; name: string; role: string };
  _count?: { invoices: number };
}

interface Branch {
  id: string;
  name: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  branchId?: string;
  branch?: { name: string };
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDate = (date: Date | string) => {
  return format(new Date(date), 'yyyy/MM/dd HH:mm', { locale: ar });
};

const getStatusBadge = (status: string, closureType?: string) => {
  if (status === 'OPEN') {
    return <Badge className="bg-gradient-to-l from-emerald-500 to-emerald-600 gap-1"><Unlock className="h-3 w-3" />مفتوحة</Badge>;
  }
  if (status === 'FORCE_CLOSED') {
    return <Badge className="bg-gradient-to-l from-rose-500 to-rose-600 gap-1"><AlertTriangle className="h-3 w-3" />إغلاق إجباري</Badge>;
  }
  if (closureType === 'BRANCH_ALL') {
    return <Badge className="bg-gradient-to-l from-orange-500 to-orange-600 gap-1">إغلاق جماعي</Badge>;
  }
  return <Badge variant="secondary" className="gap-1"><Lock className="h-3 w-3" />مغلقة</Badge>;
};

const getRoleName = (role: string) => {
  const roles: Record<string, string> = {
    'SUPER_ADMIN': 'مدير النظام',
    'BRANCH_ADMIN': 'مدير الفرع',
    'USER': 'كاشير'
  };
  return roles[role] || role;
};

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  gradient,
  iconBg,
  delay = 0
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <div className={cn("absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity", gradient)} />
        <CardContent className="p-4 relative">
          <div className="flex items-center gap-3">
            <motion.div 
              className={cn("p-2 rounded-xl", iconBg)}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Icon className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <motion.p
                className="text-xl font-bold"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.1 }}
              >
                {value}
              </motion.p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Skeleton Loader
function ShiftsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse p-4 rounded-lg bg-muted h-24" />
      ))}
    </div>
  );
}

export function ShiftManagementPage() {
  const { toast } = useToast();
  
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('OPEN');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [forceCloseDialog, setForceCloseDialog] = useState(false);
  const [branchCloseDialog, setBranchCloseDialog] = useState(false);
  const [detailsSheet, setDetailsSheet] = useState(false);
  const [zReportDialog, setZReportDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  
  const [closeReason, setCloseReason] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [revokeSession, setRevokeSession] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (e) {
        console.error('Failed to fetch current user:', e);
      }
    };
    fetchCurrentUser();
  }, []);

  const fetchShifts = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== 'all') params.set('status', filterStatus);
      if (filterBranch && filterBranch !== 'all') params.set('branchId', filterBranch);
      if (filterUser && filterUser !== 'all') params.set('userId', filterUser);
      
      const res = await fetch(`/api/shifts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setShifts(data.shifts || []);
      }
    } catch (e) {
      console.error('Failed to fetch shifts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterBranch, filterStatus, filterUser]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch('/api/branches');
        if (res.ok) {
          const data = await res.json();
          setBranches(data.branches || []);
        }
      } catch (e) {
        console.error('Failed to fetch branches:', e);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (e) {
        console.error('Failed to fetch users:', e);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const filteredShifts = shifts.filter(shift => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      shift.user?.name?.toLowerCase().includes(query) ||
      shift.branch?.name?.toLowerCase().includes(query) ||
      shift.user?.email?.toLowerCase().includes(query)
    );
  });

  const canForceClose = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'BRANCH_ADMIN';
  const canCloseBranch = currentUser?.role === 'SUPER_ADMIN';

  const handleForceClose = async () => {
    if (!selectedShift || !closeReason.trim()) {
      toast({ title: 'خطأ', description: 'يجب إدخال سبب الإغلاق', variant: 'destructive' });
      return;
    }

    try {
      const res = await fetch('/api/shifts/force-close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: selectedShift.id,
          reason: closeReason,
          actualCash: actualCash ? parseFloat(actualCash) : undefined,
          revokeSession
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: 'تم الإغلاق', description: data.message });
        setForceCloseDialog(false);
        setCloseReason('');
        setActualCash('');
        setSelectedShift(null);
        fetchShifts();
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' });
    }
  };

  const handleCloseBranchShifts = async () => {
    if (!closeReason.trim() || !filterBranch || filterBranch === 'all') {
      toast({ title: 'خطأ', description: 'يجب اختيار فرع وإدخال سبب الإغلاق', variant: 'destructive' });
      return;
    }

    try {
      const res = await fetch(`/api/branches/${filterBranch}/close-shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: closeReason,
          revokeSessions: revokeSession
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: 'تم الإغلاق', description: data.message });
        setBranchCloseDialog(false);
        setCloseReason('');
        fetchShifts();
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' });
    }
  };

  const getShiftDuration = (startTime: Date, endTime?: Date) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} ساعة ${minutes} دقيقة`;
  };

  const getOpenShiftsByBranch = (branchId: string) => {
    return shifts.filter(s => s.branchId === branchId && s.status === 'OPEN').length;
  };

  return (
    <div className="p-6 space-y-6 pb-10">
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-l from-foreground to-foreground/70 bg-clip-text">
            إدارة الورديات
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Clock className="h-4 w-4" />
            إدارة وإغلاق ورديات المستخدمين
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" size="icon" onClick={() => fetchShifts(true)} disabled={refreshing}>
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </motion.div>
          {canCloseBranch && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="destructive" onClick={() => setBranchCloseDialog(true)} className="gap-2">
                <Power className="h-4 w-4" />
                إغلاق فرع كامل
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="ورديات مفتوحة"
          value={shifts.filter(s => s.status === 'OPEN').length}
          icon={Unlock}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600"
          delay={0}
        />
        <StatsCard
          title="ورديات مغلقة"
          value={shifts.filter(s => s.status === 'CLOSED').length}
          icon={Lock}
          gradient="bg-gradient-to-br from-gray-500 to-gray-600"
          iconBg="bg-gradient-to-br from-gray-500 to-gray-600"
          delay={0.1}
        />
        <StatsCard
          title="إغلاق إجباري"
          value={shifts.filter(s => s.status === 'FORCE_CLOSED').length}
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-rose-500 to-rose-600"
          iconBg="bg-gradient-to-br from-rose-500 to-rose-600"
          delay={0.2}
        />
        <StatsCard
          title="مبيعات مفتوحة"
          value={formatCurrency(shifts.filter(s => s.status === 'OPEN').reduce((sum, s) => sum + s.totalSales, 0))}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0.3}
        />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-l from-muted/30 to-muted/10">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <Label>الفرع</Label>
                <Select value={filterBranch} onValueChange={setFilterBranch}>
                  <SelectTrigger className="bg-background/50 mt-1"><SelectValue placeholder="جميع الفروع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفروع</SelectItem>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} ({getOpenShiftsByBranch(branch.id)} مفتوحة)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>الحالة</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-background/50 mt-1"><SelectValue placeholder="جميع الحالات" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="OPEN">مفتوحة</SelectItem>
                    <SelectItem value="CLOSED">مغلقة</SelectItem>
                    <SelectItem value="FORCE_CLOSED">إغلاق إجباري</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>المستخدم</Label>
                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger className="bg-background/50 mt-1"><SelectValue placeholder="جميع المستخدمين" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>بحث</Label>
                <div className="relative mt-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="اسم المستخدم أو الفرع..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9 bg-background/50" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Shifts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              قائمة الورديات
            </CardTitle>
            <CardDescription>{filteredShifts.length} وردية</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {loading ? (
                <ShiftsSkeleton />
              ) : filteredShifts.length === 0 ? (
                <motion.div 
                  className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Clock className="h-16 w-16 mb-4 opacity-50" />
                  </motion.div>
                  <p className="text-lg font-medium">لا توجد ورديات</p>
                  <p className="text-sm">جرب تغيير الفلاتر</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredShifts.map((shift, index) => (
                      <motion.div
                        key={shift.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all duration-300",
                          shift.status === 'OPEN' && "border-emerald-200 dark:border-emerald-800",
                          shift.status === 'FORCE_CLOSED' && "border-rose-200 dark:border-rose-800"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <motion.div 
                              className={cn(
                                "p-2 rounded-xl",
                                shift.status === 'OPEN' ? "bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/20" :
                                shift.status === 'FORCE_CLOSED' ? "bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-800/20" :
                                "bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800/30 dark:to-gray-700/20"
                              )}
                              whileHover={{ scale: 1.1 }}
                            >
                              <User className={cn(
                                "h-5 w-5",
                                shift.status === 'OPEN' ? "text-emerald-600 dark:text-emerald-400" :
                                shift.status === 'FORCE_CLOSED' ? "text-rose-600 dark:text-rose-400" :
                                "text-gray-600 dark:text-gray-400"
                              )} />
                            </motion.div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{shift.user?.name}</p>
                                {getStatusBadge(shift.status, shift.closureType)}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1"><Store className="h-3 w-3" />{shift.branch?.name}</span>
                                <span className="flex items-center gap-1"><Timer className="h-3 w-3" />{getShiftDuration(shift.startTime, shift.endTime)}</span>
                              </div>
                              {shift.status === 'FORCE_CLOSED' && shift.closureReason && (
                                <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">السبب: {shift.closureReason}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-left">
                              <p className="text-xs text-muted-foreground">المبيعات</p>
                              <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(shift.totalSales)}</p>
                            </div>
                            <div className="text-left">
                              <p className="text-xs text-muted-foreground">الافتتاحية</p>
                              <p className="font-medium">{formatCurrency(shift.openingCash)}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button variant="ghost" size="sm" onClick={() => { setSelectedShift(shift); setDetailsSheet(true); }}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </motion.div>
                              
                              {shift.status !== 'OPEN' && (
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <Button variant="outline" size="sm" onClick={() => { setSelectedShift(shift); setZReportDialog(true); }} className="gap-1">
                                    <Receipt className="h-4 w-4" />Z
                                  </Button>
                                </motion.div>
                              )}
                              
                              {shift.status === 'OPEN' && canForceClose && (
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <Button variant="destructive" size="sm" onClick={() => { setSelectedShift(shift); setForceCloseDialog(true); }} className="gap-1">
                                    <Lock className="h-4 w-4" />إغلاق
                                  </Button>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* Force Close Dialog */}
      <AlertDialog open={forceCloseDialog} onOpenChange={setForceCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              إغلاق وردية إجباري
            </AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إغلاق وردية <strong>{selectedShift?.user?.name}</strong> من فرع <strong>{selectedShift?.branch?.name}</strong> بشكل إجباري.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>سبب الإغلاق الإجباري *</Label>
              <Textarea placeholder="أدخل سبب الإغلاق..." value={closeReason} onChange={(e) => setCloseReason(e.target.value)} className="mt-1" />
            </div>
            
            <div>
              <Label>المبلغ الفعلي (اختياري)</Label>
              <Input type="number" placeholder={selectedShift?.expectedCash?.toString() || '0'} value={actualCash} onChange={(e) => setActualCash(e.target.value)} className="mt-1" />
              {selectedShift?.expectedCash && (
                <p className="text-sm text-muted-foreground mt-1">المتوقع: {formatCurrency(selectedShift.expectedCash)}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" id="revokeSession" checked={revokeSession} onChange={(e) => setRevokeSession(e.target.checked)} className="rounded border-gray-300" />
              <Label htmlFor="revokeSession" className="font-normal">إلغاء جلسة المستخدم فوراً (تسجيل الخروج)</Label>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setCloseReason(''); setActualCash(''); setSelectedShift(null); }}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceClose} className="bg-rose-500 hover:bg-rose-600">تأكيد الإغلاق الإجباري</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Branch Shifts Dialog */}
      <AlertDialog open={branchCloseDialog} onOpenChange={setBranchCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Power className="h-5 w-5 text-rose-500" />
              إغلاق جميع ورديات فرع
            </AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إغلاق جميع الورديات المفتوحة في الفرع المحدد بشكل إجباري.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>اختر الفرع</Label>
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} ({getOpenShiftsByBranch(branch.id)} مفتوحة)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>سبب الإغلاق *</Label>
              <Textarea placeholder="أدخل سبب إغلاق جميع الورديات..." value={closeReason} onChange={(e) => setCloseReason(e.target.value)} className="mt-1" />
            </div>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" id="revokeSessions" checked={revokeSession} onChange={(e) => setRevokeSession(e.target.checked)} className="rounded border-gray-300" />
              <Label htmlFor="revokeSessions" className="font-normal">إلغاء جلسات جميع المستخدمين</Label>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setCloseReason(''); }}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseBranchShifts} className="bg-rose-500 hover:bg-rose-600">تأكيد إغلاق الفرع</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Shift Details Sheet */}
      <Sheet open={detailsSheet} onOpenChange={setDetailsSheet}>
        <SheetContent className="w-[500px] sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              تفاصيل الوردية
            </SheetTitle>
            <SheetDescription>وردية {selectedShift?.user?.name}</SheetDescription>
          </SheetHeader>
          
          {selectedShift && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  {getStatusBadge(selectedShift.status, selectedShift.closureType)}
                </div>
                <div className="p-3 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground">الفرع</p>
                  <p className="font-medium">{selectedShift.branch?.name}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground">الافتتاحية</p>
                  <p className="font-medium">{formatCurrency(selectedShift.openingCash)}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground">المدة</p>
                  <p className="font-medium">{getShiftDuration(selectedShift.startTime, selectedShift.endTime)}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-3">الملخص المالي</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">إجمالي المبيعات</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(selectedShift.totalSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المستردات</span>
                    <span className="font-medium text-rose-500">-{formatCurrency(selectedShift.totalReturns)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المصروفات</span>
                    <span className="font-medium text-orange-500">-{formatCurrency(selectedShift.totalExpenses)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span>النقد المتوقع</span>
                    <span className="font-bold">{formatCurrency(selectedShift.expectedCash || selectedShift.openingCash)}</span>
                  </div>
                  {selectedShift.closingCash && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">النقد الفعلي</span>
                      <span className="font-medium">{formatCurrency(selectedShift.closingCash)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedShift.status === 'FORCE_CLOSED' && (
                <>
                  <Separator />
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                    <h4 className="font-medium text-rose-700 dark:text-rose-400 mb-2">تفاصيل الإغلاق الإجباري</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-rose-600 dark:text-rose-400">سبب الإغلاق:</span>
                        <span>{selectedShift.closureReason}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-600 dark:text-rose-400">تم بواسطة:</span>
                        <span>{selectedShift.closedByUser?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-600 dark:text-rose-400">الدور:</span>
                        <span>{getRoleName(selectedShift.forceCloseRole || '')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-600 dark:text-rose-400">إلغاء الجلسة:</span>
                        <span>{selectedShift.sessionRevoked ? 'نعم' : 'لا'}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              <Separator />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>بدء الوردية: {formatDate(selectedShift.startTime)}</p>
                {selectedShift.endTime && <p>انتهاء الوردية: {formatDate(selectedShift.endTime)}</p>}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Z Report Dialog */}
      <ZReportDialog open={zReportDialog} onOpenChange={setZReportDialog} shiftId={selectedShift?.id || null} />
    </div>
  );
}
