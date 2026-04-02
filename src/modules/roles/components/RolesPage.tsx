'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Plus, Search, Edit, Trash2, RefreshCw,
  Users, Key, Check, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS, MODULES } from '@/constants/permissions';

interface Role {
  id: string;
  name: string;
  nameAr: string;
  users: number;
  permissions: string[];
}

const mockRoles: Role[] = [
  { id: '1', name: 'SUPER_ADMIN', nameAr: 'مدير النظام', users: 1, permissions: ['all'] },
  { id: '2', name: 'BRANCH_ADMIN', nameAr: 'مدير فرع', users: 5, permissions: ['products', 'invoices', 'customers', 'shifts'] },
  { id: '3', name: 'USER', nameAr: 'مستخدم', users: 20, permissions: ['pos', 'products'] },
];

export function RolesPage() {
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const { can, isSuperAdmin } = usePermissions();

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-3xl font-bold">الأدوار والصلاحيات</h1>
            <p className="text-muted-foreground">إدارة أدوار المستخدمين وصلاحياتهم</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                دور جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء دور جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">اسم الدور (عربي)</label>
                  <Input placeholder="مثال: مدير المبيعات" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">اسم الدور (إنجليزي)</label>
                  <Input placeholder="مثال: SALES_MANAGER" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={() => setIsCreateOpen(false)}>
                    حفظ
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الأدوار</p>
                  <p className="text-2xl font-bold">{mockRoles.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المستخدمين</p>
                  <p className="text-2xl font-bold">
                    {mockRoles.reduce((acc, r) => acc + r.users, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Key className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الصلاحيات</p>
                  <p className="text-2xl font-bold">{MODULES.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مستوى الأمان</p>
                  <p className="text-2xl font-bold">عالي</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="roles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="roles">الأدوار</TabsTrigger>
            <TabsTrigger value="permissions">مصفوفة الصلاحيات</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>قائمة الأدوار</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pr-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الدور</TableHead>
                      <TableHead>الاسم بالعربية</TableHead>
                      <TableHead>المستخدمين</TableHead>
                      <TableHead>الصلاحيات</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.nameAr}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{role.users}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {role.permissions.includes('all') ? (
                              <Badge>جميع الصلاحيات</Badge>
                            ) : (
                              role.permissions.slice(0, 3).map((p) => (
                                <Badge key={p} variant="secondary">{p}</Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedRole(role)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {role.name !== 'SUPER_ADMIN' && (
                              <Button variant="ghost" size="sm" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>مصفوفة الصلاحيات</CardTitle>
                <CardDescription>تحديد الصلاحيات لكل دور</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الوحدة</TableHead>
                      {mockRoles.map((role) => (
                        <TableHead key={role.id} className="text-center">
                          {role.nameAr}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MODULES.map((module) => (
                      <TableRow key={module.id}>
                        <TableCell className="font-medium">{module.name}</TableCell>
                        {mockRoles.map((role) => (
                          <TableCell key={role.id} className="text-center">
                            <Checkbox
                              checked={
                                role.permissions.includes('all') || 
                                role.permissions.includes(module.id)
                              }
                              disabled={role.name === 'SUPER_ADMIN'}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
