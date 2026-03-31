'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Gift, Star, Users, TrendingUp, Award, Coins,
  Plus, Search, Settings, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const tiers = [
  { name: 'برونزي', minPoints: 0, maxPoints: 1000, color: 'bg-amber-600' },
  { name: 'فضي', minPoints: 1000, maxPoints: 5000, color: 'bg-gray-400' },
  { name: 'ذهبي', minPoints: 5000, maxPoints: 10000, color: 'bg-yellow-500' },
  { name: 'بلاتيني', minPoints: 10000, maxPoints: Infinity, color: 'bg-purple-500' },
];

const mockCustomers = [
  { id: '1', name: 'أحمد محمد', points: 2500, tier: 'فضي', totalSpent: 5000 },
  { id: '2', name: 'سارة علي', points: 7500, tier: 'ذهبي', totalSpent: 15000 },
  { id: '3', name: 'خالد أحمد', points: 500, tier: 'برونزي', totalSpent: 1000 },
];

export function LoyaltyPage() {
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState({
    enabled: true,
    pointsPerRiyal: 1,
    redemptionRate: 100,
    welcomeBonus: 50,
  });

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
            <h1 className="text-3xl font-bold">نظام الولاء</h1>
            <p className="text-muted-foreground">إدارة برنامج نقاط الولاء</p>
          </div>
          <Button className="gap-2">
            <Settings className="h-4 w-4" />
            إعدادات البرنامج
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الأعضاء</p>
                  <p className="text-2xl font-bold">1,234</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                  <Coins className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي النقاط</p>
                  <p className="text-2xl font-bold">125,000</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Gift className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المكافآت المستبدلة</p>
                  <p className="text-2xl font-bold">456</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">نسبة التفعيل</p>
                  <p className="text-2xl font-bold">78%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="customers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="customers">العملاء</TabsTrigger>
            <TabsTrigger value="tiers">مستويات العضوية</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>أعضاء البرنامج</CardTitle>
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
                      <TableHead>العميل</TableHead>
                      <TableHead>المستوى</TableHead>
                      <TableHead>النقاط</TableHead>
                      <TableHead>إجمالي المشتريات</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{customer.tier}</Badge>
                        </TableCell>
                        <TableCell>{customer.points.toLocaleString()}</TableCell>
                        <TableCell>{customer.totalSpent.toLocaleString()} ر.س</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">عرض</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tiers" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map((tier, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-full ${tier.color}`}>
                        <Award className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{tier.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {tier.maxPoints === Infinity 
                            ? `${tier.minPoints.toLocaleString()}+ نقطة`
                            : `${tier.minPoints.toLocaleString()} - ${tier.maxPoints.toLocaleString()} نقطة`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>الأعضاء</span>
                        <span className="font-medium">
                          {Math.floor(Math.random() * 500) + 100}
                        </span>
                      </div>
                      <Progress value={Math.random() * 100} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات البرنامج</CardTitle>
                <CardDescription>تخصيص نظام نقاط الولاء</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تفعيل البرنامج</Label>
                    <p className="text-sm text-muted-foreground">تفعيل أو تعطيل نظام الولاء</p>
                  </div>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نقاط لكل ريال</Label>
                    <Input
                      type="number"
                      value={settings.pointsPerRiyal}
                      onChange={(e) => setSettings(prev => ({ ...prev, pointsPerRiyal: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>قيمة النقطة (ريال)</Label>
                    <Input
                      type="number"
                      value={settings.redemptionRate}
                      onChange={(e) => setSettings(prev => ({ ...prev, redemptionRate: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>مكافأة الترحيب</Label>
                    <Input
                      type="number"
                      value={settings.welcomeBonus}
                      onChange={(e) => setSettings(prev => ({ ...prev, welcomeBonus: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                <Button>حفظ الإعدادات</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
