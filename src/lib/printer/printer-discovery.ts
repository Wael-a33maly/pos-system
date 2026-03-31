// ==================== نظام اكتشاف الطابعات ====================

import { PrinterConfig } from './thermal-printer';

// ==================== الأنواع ====================
export interface DiscoveredPrinter {
  id: string;
  name: string;
  type: 'thermal' | 'laser' | 'inkjet';
  connectionType: 'usb' | 'network' | 'bluetooth';
  vendorId?: number;
  productId?: number;
  ip?: string;
  port?: number;
  macAddress?: string;
  paperWidth: 58 | 80;
  isConnected: boolean;
  lastSeen: Date;
  capabilities: PrinterCapabilities;
}

export interface PrinterCapabilities {
  paperWidths: (58 | 80)[];
  autoCut: boolean;
  cashDrawer: boolean;
  barcode: boolean;
  qrCode: boolean;
  logo: boolean;
  colors: ('black' | 'red')[];
  encoding: string[];
}

export interface PrinterStatus {
  isOnline: boolean;
  paperStatus: 'ok' | 'low' | 'empty' | 'unknown';
  coverStatus: 'closed' | 'open' | 'unknown';
  errorStatus: 'none' | 'error' | 'unknown';
  temperature: 'normal' | 'high' | 'unknown';
  lastCheck: Date;
  errorMessage?: string;
}

export interface PrinterTestResult {
  success: boolean;
  message: string;
  testPage?: string;
  duration?: number;
}

// ==================== ثوابت الطابعات المعروفة ====================
const KNOWN_PRINTERS = [
  { vendorId: 0x04B8, productId: 0x0E03, name: 'EPSON TM-T88VI', type: 'thermal' as const },
  { vendorId: 0x04B8, productId: 0x0202, name: 'EPSON TM-T88V', type: 'thermal' as const },
  { vendorId: 0x04B8, productId: 0x0E15, name: 'EPSON TM-m30', type: 'thermal' as const },
  { vendorId: 0x0519, productId: 0x0003, name: 'Star TSP143III', type: 'thermal' as const },
  { vendorId: 0x0519, productId: 0x0002, name: 'Star TSP100', type: 'thermal' as const },
  { vendorId: 0x0DD4, productId: 0x015D, name: 'Custom Q3', type: 'thermal' as const },
  { vendorId: 0x0DD4, productId: 0x015C, name: 'Custom Q1', type: 'thermal' as const },
  { vendorId: 0x0FE6, productId: 0x1500, name: 'HPRT TP805', type: 'thermal' as const },
  { vendorId: 0x0FE6, productId: 0x1100, name: 'HPRT P80A', type: 'thermal' as const },
  { vendorId: 0x0483, productId: 0x5743, name: 'POS-5890', type: 'thermal' as const },
  { vendorId: 0x0416, productId: 0x5011, name: 'Winbond POS Printer', type: 'thermal' as const },
  { vendorId: 0x20D1, productId: 0x7006, name: 'XPrinter XP-80C', type: 'thermal' as const },
  { vendorId: 0x0416, productId: 0x8011, name: 'XPrinter XP-58', type: 'thermal' as const },
];

// منافذ الطابعات الشائعة
const PRINTER_PORTS = [9100, 9101, 9102, 9103, 515, 6101];

// ==================== PrinterDiscovery Class ====================
export class PrinterDiscovery {
  private discoveredPrinters: Map<string, DiscoveredPrinter> = new Map();
  private scanInterval: NodeJS.Timeout | null = null;

  // ==================== اكتشاف طابعات USB ====================
  async discoverUSB(): Promise<DiscoveredPrinter[]> {
    const printers: DiscoveredPrinter[] = [];
    
    // التحقق من دعم WebUSB
    if (typeof window === 'undefined' || !('usb' in navigator)) {
      console.log('WebUSB غير مدعوم');
      return printers;
    }

    try {
      const usb = (navigator as Navigator & { usb: USB }).usb;
      
      // جلب الأجهزة المتصلة مسبقاً
      const devices = await usb.getDevices();
      
      for (const device of devices) {
        const printer = this.identifyUSBPrinter(device);
        if (printer) {
          printers.push(printer);
          this.discoveredPrinters.set(printer.id, printer);
        }
      }

      // طلب اتصال جديد
      try {
        const newDevice = await usb.requestDevice({
          filters: KNOWN_PRINTERS.map(p => ({
            vendorId: p.vendorId,
            productId: p.productId,
          })),
        });
        
        const printer = this.identifyUSBPrinter(newDevice);
        if (printer && !printers.find(p => p.id === printer.id)) {
          printers.push(printer);
          this.discoveredPrinters.set(printer.id, printer);
        }
      } catch {
        // المستخدم ألغى الاختيار أو لا توجد أجهزة
      }
    } catch (error) {
      console.error('خطأ في اكتشاف طابعات USB:', error);
    }

    return printers;
  }

  // ==================== تحديد هوية طابعة USB ====================
  private identifyUSBPrinter(device: USBDevice): DiscoveredPrinter | null {
    const known = KNOWN_PRINTERS.find(
      p => p.vendorId === device.vendorId && p.productId === device.productId
    );

    return {
      id: `usb-${device.vendorId}-${device.productId}-${device.serialNumber || 'default'}`,
      name: known?.name || device.productName || 'طابعة غير معروفة',
      type: known?.type || 'thermal',
      connectionType: 'usb',
      vendorId: device.vendorId,
      productId: device.productId,
      paperWidth: 80,
      isConnected: device.opened,
      lastSeen: new Date(),
      capabilities: {
        paperWidths: [58, 80],
        autoCut: true,
        cashDrawer: true,
        barcode: true,
        qrCode: true,
        logo: true,
        colors: ['black'],
        encoding: ['UTF-8', 'WPC1256', 'PC850'],
      },
    };
  }

  // ==================== اكتشاف طابعات الشبكة ====================
  async discoverNetwork(
    subnet: string = '192.168.1',
    timeout: number = 5000
  ): Promise<DiscoveredPrinter[]> {
    const printers: DiscoveredPrinter[] = [];
    
    if (typeof window === 'undefined') {
      return printers;
    }

    // مسح الشبكة
    const promises: Promise<void>[] = [];
    
    for (let i = 1; i < 255; i++) {
      const ip = `${subnet}.${i}`;
      promises.push(this.checkNetworkPrinter(ip, timeout));
    }

    await Promise.allSettled(promises);
    
    // جلب النتائج
    for (const [id, printer] of this.discoveredPrinters) {
      if (printer.connectionType === 'network') {
        printers.push(printer);
      }
    }

    return printers;
  }

  // ==================== فحص طابعة شبكة محددة ====================
  private async checkNetworkPrinter(ip: string, timeout: number): Promise<void> {
    for (const port of PRINTER_PORTS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(`http://${ip}:${port}/status`, {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const printer: DiscoveredPrinter = {
            id: `network-${ip}-${port}`,
            name: `Network Printer (${ip})`,
            type: 'thermal',
            connectionType: 'network',
            ip,
            port,
            paperWidth: 80,
            isConnected: true,
            lastSeen: new Date(),
            capabilities: {
              paperWidths: [58, 80],
              autoCut: true,
              cashDrawer: true,
              barcode: true,
              qrCode: true,
              logo: true,
              colors: ['black'],
              encoding: ['UTF-8', 'WPC1256'],
            },
          };
          
          this.discoveredPrinters.set(printer.id, printer);
          return;
        }
      } catch {
        // لا توجد طابعة على هذا العنوان
      }
    }
  }

  // ==================== اكتشاف طابعة بـ IP محدد ====================
  async discoverByIP(ip: string, port: number = 9100): Promise<DiscoveredPrinter | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`http://${ip}:${port}/status`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const printer: DiscoveredPrinter = {
          id: `network-${ip}-${port}`,
          name: `Network Printer (${ip})`,
          type: 'thermal',
          connectionType: 'network',
          ip,
          port,
          paperWidth: 80,
          isConnected: true,
          lastSeen: new Date(),
          capabilities: {
            paperWidths: [58, 80],
            autoCut: true,
            cashDrawer: true,
            barcode: true,
            qrCode: true,
            logo: true,
            colors: ['black'],
            encoding: ['UTF-8', 'WPC1256'],
          },
        };
        
        this.discoveredPrinters.set(printer.id, printer);
        return printer;
      }
    } catch {
      // لا توجد طابعة
    }
    
    return null;
  }

  // ==================== اكتشاف طابعات Bluetooth ====================
  async discoverBluetooth(): Promise<DiscoveredPrinter[]> {
    const printers: DiscoveredPrinter[] = [];
    
    // التحقق من دعم Web Bluetooth
    if (typeof window === 'undefined' || !('bluetooth' in navigator)) {
      console.log('Web Bluetooth غير مدعوم');
      return printers;
    }

    try {
      const bluetooth = (navigator as Navigator & { bluetooth: Bluetooth }).bluetooth;
      
      const device = await bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Printer Service
        ],
        optionalServices: ['battery_service'],
      });

      const printer: DiscoveredPrinter = {
        id: `bluetooth-${device.id}`,
        name: device.name || 'Bluetooth Printer',
        type: 'thermal',
        connectionType: 'bluetooth',
        macAddress: device.id,
        paperWidth: 58,
        isConnected: device.gatt?.connected || false,
        lastSeen: new Date(),
        capabilities: {
          paperWidths: [58],
          autoCut: true,
          cashDrawer: false,
          barcode: true,
          qrCode: true,
          logo: false,
          colors: ['black'],
          encoding: ['UTF-8'],
        },
      };
      
      printers.push(printer);
      this.discoveredPrinters.set(printer.id, printer);
    } catch {
      // المستخدم ألغى أو لا توجد أجهزة
    }

    return printers;
  }

  // ==================== اكتشاف شامل ====================
  async discoverAll(options?: {
    usb?: boolean;
    network?: boolean;
    networkSubnet?: string;
    bluetooth?: boolean;
  }): Promise<DiscoveredPrinter[]> {
    const promises: Promise<DiscoveredPrinter[]>[] = [];
    
    if (options?.usb !== false) {
      promises.push(this.discoverUSB());
    }
    
    if (options?.network !== false) {
      promises.push(this.discoverNetwork(options?.networkSubnet));
    }
    
    if (options?.bluetooth !== false) {
      promises.push(this.discoverBluetooth());
    }
    
    const results = await Promise.allSettled(promises);
    
    const printers: DiscoveredPrinter[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        printers.push(...result.value);
      }
    }
    
    return printers;
  }

  // ==================== اختبار الاتصال ====================
  async testConnection(printer: PrinterConfig | DiscoveredPrinter): Promise<PrinterTestResult> {
    const startTime = Date.now();
    
    try {
      switch (printer.connectionType) {
        case 'usb':
          return await this.testUSBConnection(printer);
        case 'network':
          return await this.testNetworkConnection(printer);
        case 'bluetooth':
          return await this.testBluetoothConnection(printer);
        default:
          return { success: false, message: 'نوع اتصال غير معروف' };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'فشل الاتصال',
        duration: Date.now() - startTime,
      };
    }
  }

  // ==================== اختبار اتصال USB ====================
  private async testUSBConnection(printer: PrinterConfig | DiscoveredPrinter): Promise<PrinterTestResult> {
    const startTime = Date.now();
    
    if (typeof window === 'undefined' || !('usb' in navigator)) {
      return { success: false, message: 'WebUSB غير مدعوم' };
    }

    try {
      const usb = (navigator as Navigator & { usb: USB }).usb;
      const devices = await usb.getDevices();
      
      const device = devices.find(d => 
        'vendorId' in printer && printer.vendorId === d.vendorId &&
        'productId' in printer && printer.productId === d.productId
      );
      
      if (!device) {
        return { success: false, message: 'الطابعة غير موجودة' };
      }

      // محاولة فتح الجهاز
      if (!device.opened) {
        await device.open();
      }

      // إرسال أمر اختبار
      const interfaceNumber = device.configuration?.interfaces[0]?.interfaceNumber || 0;
      await device.claimInterface(interfaceNumber);
      
      const testData = new TextEncoder().encode('\x1B@\x1B\x61\x01Test Print\n\n');
      const endpoint = device.configuration?.interfaces[0]?.alternates[0]?.endpoints[0];
      
      if (endpoint && 'endpointNumber' in endpoint) {
        await device.transferOut(endpoint.endpointNumber, testData);
      }
      
      await device.releaseInterface(interfaceNumber);
      await device.close();

      return {
        success: true,
        message: 'تم الاتصال بنجاح',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'فشل الاتصال',
        duration: Date.now() - startTime,
      };
    }
  }

  // ==================== اختبار اتصال الشبكة ====================
  private async testNetworkConnection(printer: PrinterConfig | DiscoveredPrinter): Promise<PrinterTestResult> {
    const startTime = Date.now();
    
    const ip = printer.ip;
    const port = printer.port || 9100;
    
    if (!ip) {
      return { success: false, message: 'عنوان IP غير محدد' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // إرسال صفحة اختبار
      const testCommands = '\x1B@\x1B\x61\x01Test Print\n\n\x1D\x56\x00';
      
      const response = await fetch(`http://${ip}:${port}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: testCommands,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      return {
        success: response.ok,
        message: response.ok ? 'تم الاتصال بنجاح' : 'فشل الإرسال للطابعة',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'فشل الاتصال',
        duration: Date.now() - startTime,
      };
    }
  }

  // ==================== اختبار اتصال Bluetooth ====================
  private async testBluetoothConnection(printer: PrinterConfig | DiscoveredPrinter): Promise<PrinterTestResult> {
    const startTime = Date.now();
    
    if (typeof window === 'undefined' || !('bluetooth' in navigator)) {
      return { success: false, message: 'Web Bluetooth غير مدعوم' };
    }

    try {
      const bluetooth = (navigator as Navigator & { bluetooth: Bluetooth }).bluetooth;
      const device = await bluetooth.requestDevice({
        filters: [{ namePrefix: printer.name.substring(0, 5) }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
      });

      if (!device.gatt) {
        return { success: false, message: 'GATT غير متاح' };
      }

      const server = await device.gatt.connect();
      
      // إرسال اختبار
      // هذه عملية معقدة تتطلب معرفة الـ UUID للـ characteristics
      
      server.disconnect();

      return {
        success: true,
        message: 'تم الاتصال بنجاح',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'فشل الاتصال',
        duration: Date.now() - startTime,
      };
    }
  }

  // ==================== فحص حالة الطابعة ====================
  async checkStatus(printer: PrinterConfig | DiscoveredPrinter): Promise<PrinterStatus> {
    const baseStatus: PrinterStatus = {
      isOnline: false,
      paperStatus: 'unknown',
      coverStatus: 'unknown',
      errorStatus: 'unknown',
      temperature: 'unknown',
      lastCheck: new Date(),
    };

    try {
      switch (printer.connectionType) {
        case 'network':
          if (printer.ip) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(`http://${printer.ip}:${printer.port || 9100}/status`, {
              method: 'GET',
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const data = await response.json();
              return {
                ...baseStatus,
                isOnline: true,
                paperStatus: data.paperStatus || 'ok',
                coverStatus: data.coverStatus || 'closed',
                errorStatus: data.errorStatus || 'none',
                temperature: data.temperature || 'normal',
                lastCheck: new Date(),
              };
            }
          }
          break;
          
        case 'usb':
          // فحص USB
          if (typeof window !== 'undefined' && 'usb' in navigator) {
            const usb = (navigator as Navigator & { usb: USB }).usb;
            const devices = await usb.getDevices();
            const found = devices.find(d => 
              'vendorId' in printer && d.vendorId === printer.vendorId
            );
            return {
              ...baseStatus,
              isOnline: !!found,
              paperStatus: 'ok',
              coverStatus: 'closed',
              errorStatus: 'none',
              lastCheck: new Date(),
            };
          }
          break;
      }
    } catch (error) {
      baseStatus.errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    }

    return baseStatus;
  }

  // ==================== مراقبة الطابعات ====================
  startMonitoring(interval: number = 30000, callback?: (printers: DiscoveredPrinter[]) => void): void {
    this.scanInterval = setInterval(async () => {
      const printers = await this.discoverAll({
        usb: true,
        network: false, // تجنب المسح الشامل للشبكة
        bluetooth: false,
      });
      callback?.(printers);
    }, interval);
  }

  stopMonitoring(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  // ==================== الحصول على الطابعات المكتشفة ====================
  getDiscoveredPrinters(): DiscoveredPrinter[] {
    return Array.from(this.discoveredPrinters.values());
  }

  // ==================== إضافة طابعة يدوياً ====================
  addPrinter(printer: DiscoveredPrinter): void {
    this.discoveredPrinters.set(printer.id, printer);
  }

  // ==================== إزالة طابعة ====================
  removePrinter(printerId: string): boolean {
    return this.discoveredPrinters.delete(printerId);
  }

  // ==================== تحويل DiscoveredPrinter إلى PrinterConfig ====================
  toPrinterConfig(printer: DiscoveredPrinter): PrinterConfig {
    return {
      id: printer.id,
      name: printer.name,
      type: printer.type,
      connectionType: printer.connectionType,
      ip: printer.ip,
      port: printer.port,
      paperWidth: printer.paperWidth,
      autoCut: printer.capabilities.autoCut,
      openDrawer: printer.capabilities.cashDrawer,
      isDefault: false,
      isConnected: printer.isConnected,
    };
  }
}

// ==================== Export Singleton ====================
export const printerDiscovery = new PrinterDiscovery();

// ==================== دوال مساعدة ====================
export async function discoverPrinters(): Promise<DiscoveredPrinter[]> {
  return printerDiscovery.discoverAll();
}

export async function testPrinterConnection(printer: PrinterConfig | DiscoveredPrinter): Promise<PrinterTestResult> {
  return printerDiscovery.testConnection(printer);
}

export async function checkPrinterStatus(printer: PrinterConfig | DiscoveredPrinter): Promise<PrinterStatus> {
  return printerDiscovery.checkStatus(printer);
}
