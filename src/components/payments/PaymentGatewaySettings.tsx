'use client';

// ============================================
// مكون إعدادات بوابات الدفع
// Payment Gateway Settings Component
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Settings,
  Check,
  X,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Globe,
  DollarSign,
  Shield,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ==================== الأنواع ====================

type PaymentGatewayCode = 'paypal' | 'stripe' | 'mada' | 'apple_pay' | 'stc_pay' | 'tamara';

interface GatewayInfo {
  code: PaymentGatewayCode;
  name: string;
  nameAr: string;
  icon: string;
  description: string;
  descriptionAr: string;
  features: string[];
  supportedCurrencies: string[];
  requiresWebhook: boolean;
  config?: {
    enabled: boolean;
    testMode: boolean;
    hasApiKey: boolean;
    hasSecretKey: boolean;
    hasMerchantId: boolean;
    hasWebhookSecret: boolean;
    returnUrl?: string;
    cancelUrl?: string;
    supportedCurrencies?: string[];
    minAmount?: number;
    maxAmount?: number;
    connectionStatus: 'connected' | 'disconnected' | 'error';
    lastConnectedAt?: string;
    lastError?: string;
  };
}

// ==================== المكون الرئيسي ====================

export function PaymentGatewaySettings() {
  const [gateways, setGateways] = useState<GatewayInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGateway, setSelectedGateway] = useState<GatewayInfo | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  // جلب البوابات
  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      const response = await fetch('/api/payments/gateways');
      const data = await response.json();
      if (data.success) {
        setGateways(data.gateways);
      }
    } catch (error) {
      console.error('Failed to fetch gateways:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (code: PaymentGatewayCode) => {
    setTesting(true);
    try {
      const response = await fetch('/api/payments/gateways', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      
      if (data.success) {
        // تحديث حالة البوابة
        setGateways(prev => prev.map(g => 
          g.code === code 
            ? { ...g, config: { ...g.config!, connectionStatus: 'connected', lastConnectedAt: new Date().toISOString() } }
            : g
        ));
      } else {
        setGateways(prev => prev.map(g =>
          g.code === code
            ? { ...g, config: { ...g.config!, connectionStatus: 'error', lastError: data.message } }
            : g
        ));
      }
    } catch (error) {
      console.error('Connection test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async (config: Record<string, unknown>) => {
    if (!selectedGateway) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/payments/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: selectedGateway.code,
          ...config,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        setGateways(prev => prev.map(g =>
          g.code === selectedGateway.code
            ? { ...g, config: { ...g.config, ...data.config } as GatewayInfo['config'] }
            : g
        ));
        setConfigDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      connected: { variant: 'default', label: 'متصل' },
      disconnected: { variant: 'secondary', label: 'غير متصل' },
      error: { variant: 'destructive', label: 'خطأ' },
    };
    const { variant, label } = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">بوابات الدفع الإلكتروني</h2>
          <p className="text-muted-foreground">إدارة وتكوين بوابات الدفع المتاحة</p>
        </div>
        <Button variant="outline" onClick={fetchGateways}>
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث
        </Button>
      </div>

      {/* قائمة البوابات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {gateways.map((gateway, index) => (
            <motion.div
              key={gateway.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`h-full ${gateway.config?.enabled ? 'border-green-500/50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{gateway.nameAr}</CardTitle>
                        <CardDescription>{gateway.name}</CardDescription>
                      </div>
                    </div>
                    {gateway.config && getStatusBadge(gateway.config.connectionStatus)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{gateway.descriptionAr}</p>
                  
                  {/* المميزات */}
                  <div className="flex flex-wrap gap-1">
                    {gateway.features.slice(0, 3).map((feature, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  {/* العملات المدعومة */}
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{gateway.supportedCurrencies.join(', ')}</span>
                  </div>

                  {/* حالة التكوين */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      {gateway.config?.hasApiKey ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span>API Key</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {gateway.config?.hasSecretKey ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span>Secret Key</span>
                    </div>
                  </div>

                  {/* الأزرار */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedGateway(gateway);
                        setConfigDialogOpen(true);
                      }}
                    >
                      <Settings className="h-4 w-4 ml-2" />
                      إعدادات
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleTestConnection(gateway.code)}
                      disabled={testing}
                    >
                      {testing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* رسالة الخطأ */}
                  {gateway.config?.lastError && (
                    <div className="flex items-start gap-2 text-sm text-red-500 bg-red-50 p-2 rounded">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{gateway.config.lastError}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* حوار الإعدادات */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              إعدادات {selectedGateway?.nameAr}
            </DialogTitle>
            <DialogDescription>
              تكوين بوابة الدفع وإدخال بيانات الاعتماد
            </DialogDescription>
          </DialogHeader>
          
          {selectedGateway && (
            <GatewayConfigForm
              gateway={selectedGateway}
              onSave={handleSaveConfig}
              saving={saving}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== نموذج تكوين البوابة ====================

interface GatewayConfigFormProps {
  gateway: GatewayInfo;
  onSave: (config: Record<string, unknown>) => void;
  saving: boolean;
}

function GatewayConfigForm({ gateway, onSave, saving }: GatewayConfigFormProps) {
  const [enabled, setEnabled] = useState(gateway.config?.enabled ?? false);
  const [testMode, setTestMode] = useState(gateway.config?.testMode ?? true);
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [returnUrl, setReturnUrl] = useState(gateway.config?.returnUrl || '');
  const [cancelUrl, setCancelUrl] = useState(gateway.config?.cancelUrl || '');
  const [minAmount, setMinAmount] = useState(gateway.config?.minAmount?.toString() || '');
  const [maxAmount, setMaxAmount] = useState(gateway.config?.maxAmount?.toString() || '');
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      enabled,
      testMode,
      apiKey: apiKey || undefined,
      secretKey: secretKey || undefined,
      merchantId: merchantId || undefined,
      webhookSecret: webhookSecret || undefined,
      returnUrl: returnUrl || undefined,
      cancelUrl: cancelUrl || undefined,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
    });
  };

  const needsApiKey = ['paypal', 'stripe'].includes(gateway.code);
  const needsMerchantId = ['mada', 'apple_pay', 'stc_pay'].includes(gateway.code);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="credentials">بيانات الاعتماد</TabsTrigger>
          <TabsTrigger value="advanced">متقدم</TabsTrigger>
        </TabsList>

        {/* الإعدادات العامة */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>تفعيل البوابة</Label>
              <p className="text-sm text-muted-foreground">
                تفعيل أو تعطيل هذه البوابة للدفع
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>وضع الاختبار</Label>
              <p className="text-sm text-muted-foreground">
                استخدام بيئة الاختبار (Sandbox)
              </p>
            </div>
            <Switch checked={testMode} onCheckedChange={setTestMode} />
          </div>

          {testMode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">وضع الاختبار مفعل</span>
              </div>
              <p className="text-yellow-700 mt-1">
                ستتم معالجة المدفوعات في بيئة الاختبار فقط ولن يتم خصم أموال حقيقية.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minAmount">الحد الأدنى للمبلغ</Label>
              <Input
                id="minAmount"
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAmount">الحد الأقصى للمبلغ</Label>
              <Input
                id="maxAmount"
                type="number"
                placeholder="100000"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
          </div>
        </TabsContent>

        {/* بيانات الاعتماد */}
        <TabsContent value="credentials" className="space-y-4 mt-4">
          {needsApiKey && (
            <>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key / Client ID</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="أدخل API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pl-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {gateway.code === 'paypal' ? 'PayPal Client ID' : 'Stripe Publishable Key'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretKey">Secret Key</Label>
                <div className="relative">
                  <Input
                    id="secretKey"
                    type={showSecretKey ? 'text' : 'password'}
                    placeholder="أدخل Secret Key"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="pl-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-0 top-0 h-full px-3"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                  >
                    {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {gateway.code === 'paypal' ? 'PayPal Client Secret' : 'Stripe Secret Key'}
                </p>
              </div>
            </>
          )}

          {needsMerchantId && (
            <div className="space-y-2">
              <Label htmlFor="merchantId">Merchant ID</Label>
              <Input
                id="merchantId"
                type="text"
                placeholder="أدخل معرف التاجر"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                المعرف الذي تحصل عليه من مزود الخدمة
              </p>
            </div>
          )}

          {gateway.requiresWebhook && (
            <div className="space-y-2">
              <Label htmlFor="webhookSecret">Webhook Secret</Label>
              <div className="relative">
                <Input
                  id="webhookSecret"
                  type={showWebhookSecret ? 'text' : 'password'}
                  placeholder="أدخل Webhook Secret"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="pl-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-0 h-full px-3"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                >
                  {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                سر التوقيع للتحقق من صحة الـ Webhooks
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 text-blue-800">
              <Shield className="h-4 w-4" />
              <span className="font-medium">أمان البيانات</span>
            </div>
            <p className="text-blue-700 mt-1">
              يتم تخزين مفاتيح API بشكل مشفر في قاعدة البيانات. لا تشارك هذه المفاتيح مع أي شخص.
            </p>
          </div>
        </TabsContent>

        {/* الإعدادات المتقدمة */}
        <TabsContent value="advanced" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="returnUrl">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Return URL
              </div>
            </Label>
            <Input
              id="returnUrl"
              type="url"
              placeholder="https://example.com/payment/success"
              value={returnUrl}
              onChange={(e) => setReturnUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              الصفحة التي سيتم توجيه العميل إليها بعد نجاح الدفع
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancelUrl">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Cancel URL
              </div>
            </Label>
            <Input
              id="cancelUrl"
              type="url"
              placeholder="https://example.com/payment/cancel"
              value={cancelUrl}
              onChange={(e) => setCancelUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              الصفحة التي سيتم توجيه العميل إليها عند إلغاء الدفع
            </p>
          </div>

          <div className="bg-muted rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 font-medium mb-1">
              <DollarSign className="h-4 w-4" />
              العملات المدعومة
            </div>
            <p className="text-muted-foreground">
              {gateway.supportedCurrencies.join(', ')}
            </p>
          </div>

          <div className="bg-muted rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 font-medium mb-1">
              <Globe className="h-4 w-4" />
              Webhook Endpoint
            </div>
            <code className="text-xs bg-background px-2 py-1 rounded block">
              {typeof window !== 'undefined' ? window.location.origin : ''}/api/payments/webhook?gateway={gateway.code}
            </code>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => {}}
        >
          إلغاء
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 ml-2" />
              حفظ الإعدادات
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default PaymentGatewaySettings;
