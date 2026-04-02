'use client';

import { useState, useEffect } from 'react';
import { Clock, User, Building2, Filter, Search, RefreshCw, AlertTriangle, Shield, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  branchId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  createdAt: Date;
  user: { id: string; name: string; email: string };
  branch?: { id: string; name: string };
}

const formatDate = (date: Date | string) => {
  return format(new Date(date), 'yyyy/MM/dd HH:mm:ss', { locale: ar });
};

const getActionBadge = (action: string) => {
  const colors: Record<string, string> = {
    'LOGIN': 'bg-blue-500',
    'LOGOUT': 'bg-gray-500',
    'CREATE': 'bg-green-500',
    'UPDATE': 'bg-yellow-500',
    'DELETE': 'bg-red-500',
    'FORCE_CLOSE_SHIFT': 'bg-red-600',
    'CLOSE_BRANCH_SHIFTS': 'bg-red-700',
    'OPEN_SHIFT': 'bg-green-600',
    'CLOSE_SHIFT': 'bg-blue-600',
  };
  return <Badge className={colors[action] || 'bg-gray-500'}>{action}</Badge>;
};

const getEntityTypeName = (type: string) => {
  const types: Record<string, string> = {
    'USER': 'مستخدم',
    'SHIFT': 'وردية',
    'INVOICE': 'فاتورة',
    'PRODUCT': 'منتج',
    'BRANCH': 'فرع',
    'CUSTOMER': 'عميل',
    'EXPENSE': 'مصروف',
  };
  return types[type] || type;
};

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

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

  const fetchLogs = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (filterAction && filterAction !== 'all') params.set('action', filterAction);
      if (filterUser && filterUser !== 'all') params.set('userId', filterUser);
      if (filterBranch && filterBranch !== 'all') params.set('branchId', filterBranch);
      
      // For now, we'll use a mock implementation since audit logs API might not exist
      // In a real implementation, you would fetch from /api/audit-logs
      
      // Mock data for demonstration
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          action: 'LOGIN',
          entityType: 'USER',
          entityId: 'user1',
          userId: 'user1',
          branchId: 'branch1',
          createdAt: new Date(),
          user: { id: 'user1', name: 'أحمد محمد', email: 'ahmed@example.com' },
          branch: { id: 'branch1', name: 'الفرع الرئيسي' },
        },
        {
          id: '2',
          action: 'OPEN_SHIFT',
          entityType: 'SHIFT',
          entityId: 'shift1',
          userId: 'user1',
          branchId: 'branch1',
          createdAt: new Date(Date.now() - 1000 * 60 * 30),
          user: { id: 'user1', name: 'أحمد محمد', email: 'ahmed@example.com' },
          branch: { id: 'branch1', name: 'الفرع الرئيسي' },
          details: 'الرصيد الافتتاحي: 1000 ر.س',
        },
      ];
      
      setLogs(mockLogs);
    } catch (e) {
      console.error('Failed to fetch audit logs:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction, filterUser, filterBranch]);

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.user?.name?.toLowerCase().includes(query) ||
      log.branch?.name?.toLowerCase().includes(query) ||
      log.action?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">سجل التدقيق</h1>
          <p className="text-muted-foreground">تتبع جميع العمليات والتغييرات في النظام</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => fetchLogs(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي العمليات</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تسجيلات الدخول</p>
                <p className="text-2xl font-bold">{logs.filter(l => l.action === 'LOGIN').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">عمليات حساسة</p>
                <p className="text-2xl font-bold">{logs.filter(l => ['DELETE', 'FORCE_CLOSE_SHIFT', 'CLOSE_BRANCH_SHIFTS'].includes(l.action)).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <LogOut className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تسجيلات الخروج</p>
                <p className="text-2xl font-bold">{logs.filter(l => l.action === 'LOGOUT').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <Label>نوع العملية</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="LOGIN">تسجيل دخول</SelectItem>
                  <SelectItem value="LOGOUT">تسجيل خروج</SelectItem>
                  <SelectItem value="OPEN_SHIFT">فتح وردية</SelectItem>
                  <SelectItem value="CLOSE_SHIFT">إغلاق وردية</SelectItem>
                  <SelectItem value="FORCE_CLOSE_SHIFT">إغلاق إجباري</SelectItem>
                  <SelectItem value="CREATE">إنشاء</SelectItem>
                  <SelectItem value="UPDATE">تعديل</SelectItem>
                  <SelectItem value="DELETE">حذف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>المستخدم</Label>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>الفرع</Label>
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>بحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>سجل العمليات</CardTitle>
          <CardDescription>{filteredLogs.length} عملية</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse p-4 rounded-lg bg-muted h-20" />
                ))}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد عمليات</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map(log => (
                  <div key={log.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <Shield className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getActionBadge(log.action)}
                            <span className="text-sm text-muted-foreground">{getEntityTypeName(log.entityType)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.user?.name}
                            </span>
                            {log.branch && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {log.branch.name}
                              </span>
                            )}
                          </div>
                          {log.details && (
                            <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-left text-sm text-muted-foreground">
                        <p>{formatDate(log.createdAt)}</p>
                        {log.ipAddress && <p className="text-xs">{log.ipAddress}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
