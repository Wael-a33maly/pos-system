'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store';
import type { User } from '@/types';

// Mock data
const mockUsers: User[] = [
  { id: '1', email: 'admin@pos.com', name: 'مدير النظام', role: 'SUPER_ADMIN', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', email: 'branch1@pos.com', name: 'مدير فرع الرياض', role: 'BRANCH_ADMIN', branchId: '1', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', email: 'cashier1@pos.com', name: 'محمد أحمد', role: 'USER', branchId: '1', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '4', email: 'cashier2@pos.com', name: 'سارة علي', role: 'USER', branchId: '1', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '5', email: 'branch2@pos.com', name: 'مدير فرع جدة', role: 'BRANCH_ADMIN', branchId: '2', isActive: false, createdAt: new Date(), updatedAt: new Date() },
];

const branches = [
  { id: '1', name: 'فرع الرياض' },
  { id: '2', name: 'فرع جدة' },
  { id: '3', name: 'فرع الدمام' },
];

const modules = [
  { id: 'dashboard', name: 'لوحة التحكم' },
  { id: 'users', name: 'المستخدمين' },
  { id: 'products', name: 'المنتجات' },
  { id: 'categories', name: 'الفئات' },
  { id: 'brands', name: 'البراندات' },
  { id: 'customers', name: 'العملاء' },
  { id: 'suppliers', name: 'الموردين' },
  { id: 'invoices', name: 'الفواتير' },
  { id: 'expenses', name: 'المصروفات' },
  { id: 'reports', name: 'التقارير' },
  { id: 'settings', name: 'الإعدادات' },
];

const actions = [
  { id: 'view', name: 'عرض' },
  { id: 'create', name: 'إنشاء' },
  { id: 'edit', name: 'تعديل' },
  { id: 'delete', name: 'حذف' },
];

const roleLabels: Record<User['role'], { label: string; icon: typeof Shield; color: string }> = {
  SUPER_ADMIN: { label: 'سوبر مدير', icon: ShieldAlert, color: 'text-red-500' },
  BRANCH_ADMIN: { label: 'مدير فرع', icon: ShieldCheck, color: 'text-blue-500' },
  USER: { label: 'مستخدم', icon: Shield, color: 'text-gray-500' },
};

export function UsersPage() {
  const { user: currentUser } = useAppStore();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleToggleActive = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, isActive: !u.isActive } : u
    ));
  };

  const handleDelete = () => {
    if (selectedUser) {
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setShowDeleteDialog(false);
      setSelectedUser(null);
    }
  };

  const openPermissionsDialog = (user: User) => {
    setSelectedUser(user);
    // Initialize permissions
    const perms: Record<string, Record<string, boolean>> = {};
    modules.forEach(m => {
      perms[m.id] = {};
      actions.forEach(a => {
        perms[m.id][a.id] = user.permissions?.some(
          p => p.module === m.id && p.action === a.id && p.allowed
        ) || false;
      });
    });
    setPermissions(perms);
    setShowPermissionsDialog(true);
  };

  const togglePermission = (moduleId: string, actionId: string) => {
    setPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [actionId]: !prev[moduleId]?.[actionId]
      }
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">المستخدمين والأدوار</h1>
          <p className="text-muted-foreground">إدارة المستخدمين وصلاحياتهم</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            إضافة مستخدم
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي المستخدمين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              المستخدمين النشطين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {users.filter(u => u.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              غير النشطين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {users.filter(u => !u.isActive).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو البريد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="اختر الدور" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأدوار</SelectItem>
            <SelectItem value="SUPER_ADMIN">سوبر مدير</SelectItem>
            <SelectItem value="BRANCH_ADMIN">مدير فرع</SelectItem>
            <SelectItem value="USER">مستخدم</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الفرع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const roleInfo = roleLabels[user.role];
                const RoleIcon = roleInfo.icon;
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          {user.phone && (
                            <p className="text-xs text-muted-foreground">{user.phone}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <RoleIcon className={`h-3 w-3 ${roleInfo.color}`} />
                        {roleInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.branchId ? branches.find(b => b.id === user.branchId)?.name : 'جميع الفروع'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setShowAddDialog(true);
                          }}>
                            <Edit className="ml-2 h-4 w-4" />
                            تعديل
                          </DropdownMenuItem>
                          {user.role !== 'SUPER_ADMIN' && (
                            <>
                              <DropdownMenuItem onClick={() => openPermissionsDialog(user)}>
                                <Key className="ml-2 h-4 w-4" />
                                الصلاحيات
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(user.id)}>
                                {user.isActive ? (
                                  <>
                                    <UserX className="ml-2 h-4 w-4" />
                                    إلغاء التفعيل
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="ml-2 h-4 w-4" />
                                    تفعيل
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="ml-2 h-4 w-4" />
                                حذف
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الاسم *</Label>
                <Input placeholder="اسم المستخدم" defaultValue={selectedUser?.name} />
              </div>
              <div>
                <Label>رقم الجوال</Label>
                <Input placeholder="05xxxxxxxx" defaultValue={selectedUser?.phone} />
              </div>
            </div>
            
            <div>
              <Label>البريد الإلكتروني *</Label>
              <Input type="email" placeholder="email@example.com" defaultValue={selectedUser?.email} />
            </div>

            {!selectedUser && (
              <div>
                <Label>كلمة المرور *</Label>
                <Input type="password" placeholder="********" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الدور *</Label>
                <Select defaultValue={selectedUser?.role || 'USER'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN">سوبر مدير</SelectItem>
                    <SelectItem value="BRANCH_ADMIN">مدير فرع</SelectItem>
                    <SelectItem value="USER">مستخدم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الفرع</Label>
                <Select defaultValue={selectedUser?.branchId || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch id="isActive" defaultChecked={selectedUser?.isActive ?? true} />
              <Label htmlFor="isActive">مستخدم نشط</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setSelectedUser(null);
            }}>
              إلغاء
            </Button>
            <Button onClick={() => {
              setShowAddDialog(false);
              setSelectedUser(null);
            }}>
              {selectedUser ? 'حفظ التعديلات' : 'إضافة المستخدم'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>صلاحيات المستخدم: {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              تحديد الصلاحيات المسموحة للمستخدم
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الوحدة</TableHead>
                  {actions.map(action => (
                    <TableHead key={action.id} className="text-center">{action.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map(module => (
                  <TableRow key={module.id}>
                    <TableCell className="font-medium">{module.name}</TableCell>
                    {actions.map(action => (
                      <TableCell key={action.id} className="text-center">
                        <Switch
                          checked={permissions[module.id]?.[action.id] || false}
                          onCheckedChange={() => togglePermission(module.id, action.id)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={() => setShowPermissionsDialog(false)}>
              حفظ الصلاحيات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف المستخدم "{selectedUser?.name}"؟
              <br />
              هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
