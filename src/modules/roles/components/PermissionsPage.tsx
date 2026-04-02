'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Search, 
  RefreshCw, 
  Save, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  Info,
  Lock,
  Unlock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { MODULES, ROLE_NAMES, type PermissionModule, type PermissionAction, type PermissionDetail } from '@/constants/permissions';

// واجهة المستخدم من API
interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roleName: string;
  isActive: boolean;
  permissions: Array<{
    id: string;
    module: string;
    action: string;
    allowed: boolean;
  }>;
}

// واجهة الدور
interface ApiRole {
  id: string;
  name: string;
  nameEn: string;
  description: string;
}

// واجهة حالة الصلاحيات
interface PermissionState {
  [key: string]: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
}

export function PermissionsPage() {
  const { isSuperAdmin } = usePermissions();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userPermissions, setUserPermissions] = useState<PermissionState>({});
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [activeTab, setActiveTab] = useState('users');

  // جلب البيانات
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/permissions');
      if (!response.ok) throw new Error('فشل في جلب البيانات');
      const data = await response.json();
      setUsers(data.users || []);
      setRoles(data.roles || []);
    } catch (error) {
      toast.error('حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // تصفية المستخدمين
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      u => u.name.toLowerCase().includes(query) || 
           u.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // فتح حوار تعديل الصلاحيات
  const openEditDialog = (user: ApiUser) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    
    // تحويل الصلاحيات إلى حالة التحرير
    const permState: PermissionState = {};
    MODULES.forEach(module => {
      permState[module.id] = {
        read: false,
        write: false,
        delete: false,
      };
    });
    
    // تطبيق الصلاحيات الحالية
    user.permissions.forEach(p => {
      if (permState[p.module]) {
        permState[p.module][p.action as PermissionAction] = p.allowed;
      }
    });
    
    setUserPermissions(permState);
    setEditDialogOpen(true);
  };

  // تحديث صلاحية معينة
  const togglePermission = (moduleId: string, action: PermissionAction) => {
    setUserPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [action]: !prev[moduleId][action],
      },
    }));
  };

  // تحديث جميع صلاحيات وحدة
  const toggleModulePermissions = (moduleId: string, checked: boolean) => {
    const permModule = MODULES.find(m => m.id === moduleId);
    if (!permModule) return;
    
    setUserPermissions(prev => ({
      ...prev,
      [moduleId]: {
        read: permModule.actions.includes('read') ? checked : false,
        write: permModule.actions.includes('write') ? checked : false,
        delete: permModule.actions.includes('delete') ? checked : false,
      },
    }));
  };

  // حفظ الصلاحيات
  const savePermissions = async () => {
    if (!selectedUser) return;
    
    setSaving(true);
    try {
      // تحويل الحالة إلى مصفوفة صلاحيات
      const permissions: PermissionDetail[] = [];
      Object.entries(userPermissions).forEach(([moduleId, actions]) => {
        Object.entries(actions).forEach(([action, allowed]) => {
          if (allowed) {
            permissions.push({
              module: moduleId,
              action: action as PermissionAction,
              allowed: true,
            });
          }
        });
      });
      
      const response = await fetch('/api/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: selectedRole,
          permissions,
        }),
      });
      
      if (!response.ok) throw new Error('فشل في الحفظ');
      
      toast.success('تم حفظ الصلاحيات بنجاح');
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  // إعادة تعيين للصلاحيات الافتراضية
  const resetToDefault = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch('/api/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          resetToDefault: true,
        }),
      });
      
      if (!response.ok) throw new Error('فشل في إعادة التعيين');
      
      toast.success('تم إعادة تعيين الصلاحيات للوضع الافتراضي');
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ أثناء إعادة التعيين');
    }
  };

  // التحقق من الصلاحية
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center" dir="rtl">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">الوصول مقيد</h2>
        <p className="text-gray-600 max-w-md">
          هذه الصفحة متاحة فقط لمدير النظام
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            إدارة الصلاحيات والأدوار
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة صلاحيات المستخدمين والتحكم في الوصول للنظام
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مديري النظام</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'SUPER_ADMIN').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مديري الفروع</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'BRANCH_ADMIN').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المستخدمين العاديين</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'USER').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">المستخدمين</TabsTrigger>
          <TabsTrigger value="matrix">مصفوفة الصلاحيات</TabsTrigger>
          <TabsTrigger value="roles">الأدوار</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>قائمة المستخدمين</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الصلاحيات</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                            {user.roleName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'destructive'}>
                            {user.isActive ? 'نشط' : 'معطل'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {user.role === 'SUPER_ADMIN' ? (
                              <Badge variant="outline" className="text-xs">
                                <Unlock className="w-3 h-3 ml-1" />
                                كامل الصلاحيات
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                {user.permissions.length} صلاحية
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-left">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            disabled={user.role === 'SUPER_ADMIN'}
                          >
                            <Shield className="w-4 h-4 ml-1" />
                            تعديل الصلاحيات
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        لا يوجد مستخدمين
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matrix Tab */}
        <TabsContent value="matrix" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>مصفوفة الصلاحيات</CardTitle>
              <CardDescription>
                عرض جميع الوحدات والصلاحيات المتاحة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky top-0 bg-background">الوحدة</TableHead>
                      <TableHead className="sticky top-0 bg-background text-center">قراءة</TableHead>
                      <TableHead className="sticky top-0 bg-background text-center">كتابة</TableHead>
                      <TableHead className="sticky top-0 bg-background text-center">حذف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MODULES.map(module => (
                      <TableRow key={module.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <module.icon className={`w-5 h-5 ${module.color || ''}`} />
                            <div>
                              <p className="font-medium">{module.name}</p>
                              <p className="text-xs text-muted-foreground">{module.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {module.actions.includes('read') && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              متاح
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {module.actions.includes('write') && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              متاح
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {module.actions.includes('delete') && (
                            <Badge variant="outline" className="bg-red-50 text-red-700">
                              متاح
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            {roles.map(role => (
              <Card key={role.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    {role.name}
                  </CardTitle>
                  <CardDescription>{role.nameEn}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {role.description}
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">الصلاحيات الافتراضية:</p>
                    <div className="flex flex-wrap gap-1">
                      {MODULES.slice(0, 5).map(m => (
                        <Badge key={m.id} variant="outline" className="text-xs">
                          {m.name}
                        </Badge>
                      ))}
                      {MODULES.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{MODULES.length - 5}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Permissions Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              تعديل صلاحيات: {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>
              قم بتعديل صلاحيات المستخدم والوحدات المتاحة له
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Role Selection */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">الدور:</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Permissions Grid */}
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الوحدة</TableHead>
                    <TableHead className="text-center">قراءة</TableHead>
                    <TableHead className="text-center">كتابة</TableHead>
                    <TableHead className="text-center">حذف</TableHead>
                    <TableHead className="text-center">الكل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODULES.map(module => (
                    <TableRow key={module.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <module.icon className={`w-4 h-4 ${module.color || ''}`} />
                          <span>{module.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {module.actions.includes('read') && (
                          <Checkbox
                            checked={userPermissions[module.id]?.read || false}
                            onCheckedChange={() => togglePermission(module.id, 'read')}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {module.actions.includes('write') && (
                          <Checkbox
                            checked={userPermissions[module.id]?.write || false}
                            onCheckedChange={() => togglePermission(module.id, 'write')}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {module.actions.includes('delete') && (
                          <Checkbox
                            checked={userPermissions[module.id]?.delete || false}
                            onCheckedChange={() => togglePermission(module.id, 'delete')}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={
                            userPermissions[module.id]?.read &&
                            (module.actions.includes('write') ? userPermissions[module.id]?.write : true) &&
                            (module.actions.includes('delete') ? userPermissions[module.id]?.delete : true)
                          }
                          onCheckedChange={(checked) => toggleModulePermissions(module.id, checked)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetToDefault}>
              إعادة تعيين
            </Button>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={savePermissions} disabled={saving}>
              {saving ? (
                <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PermissionsPage;
