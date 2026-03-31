'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  Plus,
  Tag,
  Percent,
  DollarSign,
  Gift,
  Clock,
  Calendar,
  Eye,
  Trash2,
  Edit,
  Package,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Copy,
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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useAppStore, formatCurrency } from '@/store';
import { cn } from '@/lib/utils';

// Types
type OfferType = 'PERCENTAGE' | 'FIXED' | 'BUY_X_GET_Y';
type OfferStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'PAUSED';

interface Offer {
  id: string;
  name: string;
  type: OfferType;
  status: OfferStatus;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  buyQuantity?: number;
  getQuantity?: number;
  startDate: string;
  endDate: string;
  applicableProducts: string[];
  usageCount: number;
  usageLimit?: number;
  createdAt: string;
}

const offerTypeConfig: Record<OfferType, { label: string; color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }> = {
  PERCENTAGE: { label: 'نسبة مئوية', color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', icon: Percent },
  FIXED: { label: 'مبلغ ثابت', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: DollarSign },
  BUY_X_GET_Y: { label: 'اشترِ واحصل', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', icon: Gift },
};

const statusConfig: Record<OfferStatus, { label: string; color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }> = {
  ACTIVE: { label: 'نشط', color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle },
  SCHEDULED: { label: 'مجدول', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: Clock },
  EXPIRED: { label: 'منتهي', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800/50', icon: XCircle },
  PAUSED: { label: 'متوقف', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', icon: AlertCircle },
};

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  gradient,
  iconColor,
  delay = 0,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconColor: string;
  delay?: number;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <div className={cn('absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity', gradient)} />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <motion.p
                className="text-3xl font-bold mt-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.1 }}
              >
                {value}
              </motion.p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <motion.div
              className={cn('p-3 rounded-xl', gradient)}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Icon className={cn('h-6 w-6', iconColor)} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Skeleton Loader
function OffersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b">
              <div className="animate-pulse w-8 h-8 bg-muted rounded" />
              <div className="flex-1 space-y-2">
                <div className="animate-pulse h-4 bg-muted rounded w-1/3" />
                <div className="animate-pulse h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: OfferStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn('gap-1 font-medium', config.bgColor, config.color)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// Offer Type Badge Component
function OfferTypeBadge({ type }: { type: OfferType }) {
  const config = offerTypeConfig[type];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn('gap-1', config.bgColor, config.color)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// Create/Edit Offer Dialog
function CreateOfferDialog({
  open,
  onClose,
  onSubmit,
  editOffer,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  editOffer?: Offer | null;
}) {
  const { currency } = useAppStore();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [type, setType] = useState<OfferType>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [buyQuantity, setBuyQuantity] = useState('2');
  const [getQuantity, setGetQuantity] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [applicableProducts, setApplicableProducts] = useState<string[]>([]);

  const resetForm = () => {
    setStep(1);
    setName('');
    setType('PERCENTAGE');
    setValue('');
    setMinPurchase('');
    setMaxDiscount('');
    setBuyQuantity('2');
    setGetQuantity('1');
    setStartDate('');
    setEndDate('');
    setUsageLimit('');
    setApplicableProducts([]);
  };

  useEffect(() => {
    if (editOffer) {
      setName(editOffer.name);
      setType(editOffer.type);
      setValue(editOffer.value.toString());
      setMinPurchase(editOffer.minPurchase?.toString() || '');
      setMaxDiscount(editOffer.maxDiscount?.toString() || '');
      setBuyQuantity(editOffer.buyQuantity?.toString() || '2');
      setGetQuantity(editOffer.getQuantity?.toString() || '1');
      setStartDate(editOffer.startDate.split('T')[0]);
      setEndDate(editOffer.endDate.split('T')[0]);
      setUsageLimit(editOffer.usageLimit?.toString() || '');
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOffer, open]);

  const handleSubmit = () => {
    if (!name || !value || !startDate || !endDate) return;

    onSubmit({
      name,
      type,
      value: parseFloat(value),
      minPurchase: minPurchase ? parseFloat(minPurchase) : undefined,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
      buyQuantity: type === 'BUY_X_GET_Y' ? parseInt(buyQuantity) : undefined,
      getQuantity: type === 'BUY_X_GET_Y' ? parseInt(getQuantity) : undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
      applicableProducts,
      id: editOffer?.id,
    });

    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            {editOffer ? 'تعديل العرض' : 'إنشاء عرض جديد'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? 'أدخل تفاصيل العرض' : 'حدد الفترة والشروط'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">اسم العرض</label>
                <Input
                  placeholder="أدخل اسم العرض"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">نوع الخصم</label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(offerTypeConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setType(key as OfferType)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 border rounded-xl transition-all',
                          type === key
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        )}
                      >
                        <Icon className={cn('h-6 w-6', config.color)} />
                        <span className="text-sm font-medium">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {type === 'PERCENTAGE' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">نسبة الخصم %</label>
                    <Input
                      type="number"
                      placeholder="أدخل نسبة الخصم"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">الحد الأدنى للشراء</label>
                      <Input
                        type="number"
                        placeholder="اختياري"
                        value={minPurchase}
                        onChange={(e) => setMinPurchase(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">الحد الأقصى للخصم</label>
                      <Input
                        type="number"
                        placeholder="اختياري"
                        value={maxDiscount}
                        onChange={(e) => setMaxDiscount(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {type === 'FIXED' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">مبلغ الخصم ({currency})</label>
                  <Input
                    type="number"
                    placeholder="أدخل مبلغ الخصم"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
              )}

              {type === 'BUY_X_GET_Y' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">اشترِ</label>
                    <Input
                      type="number"
                      value={buyQuantity}
                      onChange={(e) => setBuyQuantity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">احصل على</label>
                    <Input
                      type="number"
                      value={getQuantity}
                      onChange={(e) => setGetQuantity(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!name || !value}>
                  التالي
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">تاريخ البدء</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">تاريخ الانتهاء</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">حد الاستخدام (اختياري)</label>
                <Input
                  type="number"
                  placeholder="غير محدود إذا لم يتم تحديده"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                />
              </div>

              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">ملخص العرض</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الاسم:</span>
                      <span className="font-medium">{name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">النوع:</span>
                      <span>{offerTypeConfig[type].label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">القيمة:</span>
                      <span>
                        {type === 'PERCENTAGE' ? `${value}%` : 
                         type === 'FIXED' ? formatCurrency(parseFloat(value), currency) :
                         `اشترِ ${buyQuantity} واحصل على ${getQuantity}`}
                      </span>
                    </div>
                    {minPurchase && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الحد الأدنى:</span>
                        <span>{formatCurrency(parseFloat(minPurchase), currency)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  السابق
                </Button>
                <Button onClick={handleSubmit} disabled={!startDate || !endDate}>
                  {editOffer ? 'حفظ التعديلات' : 'إنشاء العرض'}
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Offer Details Dialog
function OfferDetailsDialog({
  offer,
  onClose,
  onToggleStatus,
  onDelete,
}: {
  offer: Offer | null;
  onClose: () => void;
  onToggleStatus: (id: string, status: OfferStatus) => void;
  onDelete: (id: string) => void;
}) {
  const { currency } = useAppStore();

  if (!offer) return null;

  const typeConfig = offerTypeConfig[offer.type];

  return (
    <Dialog open={!!offer} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            تفاصيل العرض
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات العرض */}
          <div className="flex items-center gap-4">
            <div className={cn('p-3 rounded-xl', typeConfig.bgColor)}>
              {typeConfig.icon && <typeConfig.icon className={cn('h-6 w-6', typeConfig.color)} />}
            </div>
            <div>
              <h3 className="text-lg font-bold">{offer.name}</h3>
              <div className="flex gap-2 mt-1">
                <OfferTypeBadge type={offer.type} />
                <StatusBadge status={offer.status} />
              </div>
            </div>
          </div>

          <Separator />

          {/* تفاصيل الخصم */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">قيمة الخصم</p>
              <p className="text-2xl font-bold text-primary">
                {offer.type === 'PERCENTAGE' ? `${offer.value}%` :
                 offer.type === 'FIXED' ? formatCurrency(offer.value, currency) :
                 `${offer.buyQuantity}+${offer.getQuantity}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مرات الاستخدام</p>
              <p className="text-2xl font-bold">
                {offer.usageCount}
                {offer.usageLimit && ` / ${offer.usageLimit}`}
              </p>
            </div>
          </div>

          {/* الشروط */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-2 text-sm">
              {offer.minPurchase && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الحد الأدنى للشراء:</span>
                  <span>{formatCurrency(offer.minPurchase, currency)}</span>
                </div>
              )}
              {offer.maxDiscount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الحد الأقصى للخصم:</span>
                  <span>{formatCurrency(offer.maxDiscount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">تاريخ البدء:</span>
                <span>{new Date(offer.startDate).toLocaleDateString('ar-SA')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">تاريخ الانتهاء:</span>
                <span>{new Date(offer.endDate).toLocaleDateString('ar-SA')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            {offer.status === 'ACTIVE' ? (
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => onToggleStatus(offer.id, 'PAUSED')}
              >
                <AlertCircle className="h-4 w-4" />
                إيقاف
              </Button>
            ) : offer.status === 'PAUSED' ? (
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => onToggleStatus(offer.id, 'ACTIVE')}
              >
                <CheckCircle className="h-4 w-4" />
                تفعيل
              </Button>
            ) : null}
            <Button
              variant="outline"
              className="flex-1 gap-2 text-rose-600 hover:text-rose-700"
              onClick={() => {
                onDelete(offer.id);
                onClose();
              }}
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Offers Page Component
export function OffersPage() {
  const { currency } = useAppStore();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [editOffer, setEditOffer] = useState<Offer | null>(null);

  const fetchOffers = () => {
    setLoading(true);

    // Simulated data
    setOffers([
      {
        id: '1',
        name: 'خصم نهاية الموسم',
        type: 'PERCENTAGE',
        status: 'ACTIVE',
        value: 25,
        minPurchase: 100,
        maxDiscount: 50,
        startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        applicableProducts: [],
        usageCount: 145,
        usageLimit: 500,
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      },
      {
        id: '2',
        name: 'عرض الخصم الثابت',
        type: 'FIXED',
        status: 'ACTIVE',
        value: 20,
        minPurchase: 150,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        applicableProducts: [],
        usageCount: 32,
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'اشترِ 2 واحصل على 1',
        type: 'BUY_X_GET_Y',
        status: 'ACTIVE',
        value: 0,
        buyQuantity: 2,
        getQuantity: 1,
        startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
        endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        applicableProducts: [],
        usageCount: 89,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: '4',
        name: 'عرض رمضان الخاص',
        type: 'PERCENTAGE',
        status: 'SCHEDULED',
        value: 30,
        startDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        endDate: new Date(Date.now() + 60 * 86400000).toISOString(),
        applicableProducts: [],
        usageCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: '5',
        name: 'عرض الشتاء',
        type: 'PERCENTAGE',
        status: 'EXPIRED',
        value: 15,
        startDate: new Date(Date.now() - 60 * 86400000).toISOString(),
        endDate: new Date(Date.now() - 30 * 86400000).toISOString(),
        applicableProducts: [],
        usageCount: 234,
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      },
      {
        id: '6',
        name: 'خصم مؤقت',
        type: 'FIXED',
        status: 'PAUSED',
        value: 10,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        applicableProducts: [],
        usageCount: 12,
        createdAt: new Date().toISOString(),
      },
    ]);

    setLoading(false);
  };

  useEffect(() => {
    fetchOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateOffer = (data: any) => {
    console.log('Creating offer:', data);
    fetchOffers();
  };

  const handleToggleStatus = (id: string, status: OfferStatus) => {
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setSelectedOffer(null);
  };

  const handleDelete = (id: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };

  const stats = {
    total: offers.length,
    active: offers.filter((o) => o.status === 'ACTIVE').length,
    scheduled: offers.filter((o) => o.status === 'SCHEDULED').length,
    totalUsage: offers.reduce((sum, o) => sum + o.usageCount, 0),
  };

  const filteredOffers = offers.filter((o) => {
    const matchesSearch = o.name.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesType = typeFilter === 'all' || o.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="p-6">
        <OffersSkeleton />
      </div>
    );
  }

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
            العروض والخصومات
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Tag className="h-4 w-4" />
            إدارة العروض والخصومات
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              تصدير
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" />
              عرض جديد
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard
          title="إجمالي العروض"
          value={stats.total}
          icon={Tag}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          iconColor="text-white"
          delay={0}
        />
        <StatsCard
          title="نشطة"
          value={stats.active}
          icon={Sparkles}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          iconColor="text-white"
          delay={0.1}
        />
        <StatsCard
          title="مجدولة"
          value={stats.scheduled}
          icon={Clock}
          gradient="bg-gradient-to-br from-amber-500 to-amber-600"
          iconColor="text-white"
          delay={0.2}
        />
        <StatsCard
          title="مرات الاستخدام"
          value={stats.totalUsage}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          iconColor="text-white"
          delay={0.3}
        />
      </div>

      {/* Filters */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن عرض..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-background/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-background/50">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="ACTIVE">نشط</SelectItem>
            <SelectItem value="SCHEDULED">مجدول</SelectItem>
            <SelectItem value="PAUSED">متوقف</SelectItem>
            <SelectItem value="EXPIRED">منتهي</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 bg-background/50">
            <SelectValue placeholder="النوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأنواع</SelectItem>
            <SelectItem value="PERCENTAGE">نسبة مئوية</SelectItem>
            <SelectItem value="FIXED">مبلغ ثابت</SelectItem>
            <SelectItem value="BUY_X_GET_Y">اشترِ واحصل</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Offers Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {filteredOffers.length === 0 ? (
              <motion.div
                className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Tag className="h-16 w-16 mb-4 opacity-50" />
                </motion.div>
                <p className="text-lg font-medium">لا توجد عروض</p>
                <p className="text-sm">جرب تغيير البحث أو الفلتر</p>
              </motion.div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>اسم العرض</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>القيمة</TableHead>
                    <TableHead>الفترة</TableHead>
                    <TableHead>الاستخدام</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredOffers.map((offer) => {
                      const typeConfig = offerTypeConfig[offer.type];
                      return (
                        <TableRow
                          key={offer.id}
                          className="cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => setSelectedOffer(offer)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <motion.div
                                className={cn('p-2 rounded-lg', typeConfig.bgColor)}
                                whileHover={{ scale: 1.1 }}
                              >
                                <Tag className={cn('h-4 w-4', typeConfig.color)} />
                              </motion.div>
                              <span className="font-medium">{offer.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <OfferTypeBadge type={offer.type} />
                          </TableCell>
                          <TableCell className="font-medium">
                            {offer.type === 'PERCENTAGE' ? `${offer.value}%` :
                             offer.type === 'FIXED' ? formatCurrency(offer.value, currency) :
                             `${offer.buyQuantity}+${offer.getQuantity}`}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{new Date(offer.startDate).toLocaleDateString('ar-SA')}</div>
                              <div className="text-xs text-muted-foreground">
                                إلى {new Date(offer.endDate).toLocaleDateString('ar-SA')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{offer.usageCount}</span>
                            {offer.usageLimit && (
                              <span className="text-muted-foreground"> / {offer.usageLimit}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={offer.status} />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                  <Filter className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedOffer(offer)}>
                                  <Eye className="ml-2 h-4 w-4" />
                                  عرض
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditOffer(offer)}>
                                  <Edit className="ml-2 h-4 w-4" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="ml-2 h-4 w-4" />
                                  نسخ
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-rose-600"
                                  onClick={() => handleDelete(offer.id)}
                                >
                                  <Trash2 className="ml-2 h-4 w-4" />
                                  حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <CreateOfferDialog
        open={showCreateDialog || !!editOffer}
        onClose={() => {
          setShowCreateDialog(false);
          setEditOffer(null);
        }}
        onSubmit={handleCreateOffer}
        editOffer={editOffer}
      />

      <OfferDetailsDialog
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
      />
    </div>
  );
}
