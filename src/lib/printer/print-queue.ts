// ==================== نظام طابور الطباعة ====================

import { PrinterConfig, PrintResult } from './thermal-printer';

// ==================== الأنواع ====================
export type PrintJobStatus = 
  | 'pending'    // في الانتظار
  | 'processing' // قيد المعالجة
  | 'completed'  // مكتمل
  | 'failed'     // فشل
  | 'cancelled'; // ملغى

export type PrintJobPriority = 'high' | 'normal' | 'low';

export type PrintJobType = 
  | 'invoice' 
  | 'return' 
  | 'z_report' 
  | 'shift_close' 
  | 'test' 
  | 'custom';

export interface PrintJob {
  id: string;
  type: PrintJobType;
  status: PrintJobStatus;
  priority: PrintJobPriority;
  
  // البيانات
  data: unknown;
  commands?: string;
  template?: string;
  
  // الطابعة
  printerId: string;
  printerConfig: PrinterConfig;
  
  // التوقيت
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  nextRetryAt?: Date;
  
  // إعادة المحاولة
  retryCount: number;
  maxRetries: number;
  retryDelay: number; // بالمللي ثانية
  
  // النتيجة
  result?: PrintResult;
  error?: string;
  
  // معلومات إضافية
  referenceId?: string; // معرف الفاتورة أو الوردية
  referenceNumber?: string; // رقم الفاتورة للعرض
  copies: number;
  currentCopy: number;
  
  // المستخدم
  userId?: string;
  userName?: string;
  branchId?: string;
  
  // الأولوية
  isUrgent: boolean;
}

export interface PrintQueueConfig {
  maxConcurrentJobs: number;
  defaultMaxRetries: number;
  defaultRetryDelay: number;
  retryBackoffMultiplier: number;
  maxRetryDelay: number;
  jobTimeout: number;
  pauseOnFailure: boolean;
  logSuccess: boolean;
  logFailures: boolean;
}

export interface PrintQueueStats {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  cancelledJobs: number;
  averageProcessingTime: number;
  successRate: number;
}

export interface PrintLogEntry {
  id: string;
  jobId: string;
  type: PrintJobType;
  printerId: string;
  printerName: string;
  status: PrintJobStatus;
  referenceNumber?: string;
  copies: number;
  duration?: number;
  error?: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  branchId?: string;
}

// ==================== التكوين الافتراضي ====================
const DEFAULT_QUEUE_CONFIG: PrintQueueConfig = {
  maxConcurrentJobs: 1,
  defaultMaxRetries: 3,
  defaultRetryDelay: 2000,
  retryBackoffMultiplier: 2,
  maxRetryDelay: 30000,
  jobTimeout: 30000,
  pauseOnFailure: false,
  logSuccess: true,
  logFailures: true,
};

// ==================== PrintQueue Class ====================
export class PrintQueue {
  private queue: PrintJob[] = [];
  private processing: Map<string, PrintJob> = new Map();
  private completed: PrintJob[] = [];
  private logs: PrintLogEntry[] = [];
  private config: PrintQueueConfig;
  private isProcessing: boolean = false;
  private isPaused: boolean = false;
  private jobHandlers: Map<string, (job: PrintJob) => Promise<PrintResult>> = new Map();
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(config?: Partial<PrintQueueConfig>) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
    
    // تحميل الطابور من التخزين المحلي
    this.loadFromStorage();
    
    // بدء المعالجة
    this.startProcessing();
  }

  // ==================== إضافة مهمة ====================
  addJob(options: {
    type: PrintJobType;
    data: unknown;
    printerConfig: PrinterConfig;
    template?: string;
    priority?: PrintJobPriority;
    maxRetries?: number;
    retryDelay?: number;
    referenceId?: string;
    referenceNumber?: string;
    copies?: number;
    userId?: string;
    userName?: string;
    branchId?: string;
    isUrgent?: boolean;
  }): PrintJob {
    const job: PrintJob = {
      id: this.generateJobId(),
      type: options.type,
      status: 'pending',
      priority: options.priority || 'normal',
      
      data: options.data,
      template: options.template,
      
      printerId: options.printerConfig.id || 'default',
      printerConfig: options.printerConfig,
      
      createdAt: new Date(),
      
      retryCount: 0,
      maxRetries: options.maxRetries ?? this.config.defaultMaxRetries,
      retryDelay: options.retryDelay ?? this.config.defaultRetryDelay,
      
      referenceId: options.referenceId,
      referenceNumber: options.referenceNumber,
      copies: options.copies || 1,
      currentCopy: 0,
      
      userId: options.userId,
      userName: options.userName,
      branchId: options.branchId,
      
      isUrgent: options.isUrgent || false,
    };

    // إضافة للطابور
    this.queue.push(job);
    this.sortQueue();
    this.saveToStorage();
    
    // إطلاق حدث
    this.emit('jobAdded', job);
    
    // بدء المعالجة
    this.processQueue();
    
    return job;
  }

  // ==================== معالجة الطابور ====================
  private startProcessing(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isPaused) return;
    if (this.processing.size >= this.config.maxConcurrentJobs) return;
    
    const job = this.getNextJob();
    if (!job) return;
    
    // نقل للمعالجة
    this.queue = this.queue.filter(j => j.id !== job.id);
    this.processing.set(job.id, job);
    
    job.status = 'processing';
    job.startedAt = new Date();
    
    this.emit('jobStarted', job);
    
    try {
      // تنفيذ المهمة مع timeout
      const result = await this.executeWithTimeout(job);
      
      job.result = result;
      job.status = result.success ? 'completed' : 'failed';
      job.completedAt = new Date();
      
      if (result.success) {
        // نجاح
        this.completed.push(job);
        this.addLog(job, 'completed');
        this.emit('jobCompleted', job);
      } else {
        // فشل
        await this.handleFailure(job, result.message);
      }
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'خطأ غير معروف';
      job.completedAt = new Date();
      await this.handleFailure(job, job.error);
    } finally {
      this.processing.delete(job.id);
      this.saveToStorage();
      
      // متابعة المعالجة
      setTimeout(() => this.processQueue(), 100);
    }
  }

  // ==================== تنفيذ المهمة ====================
  private async executeWithTimeout(job: PrintJob): Promise<PrintResult> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('انتهت مهلة الطباعة'));
      }, this.config.jobTimeout);
      
      this.executeJob(job)
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  private async executeJob(job: PrintJob): Promise<PrintResult> {
    // البحث عن معالج للمهمة
    const handler = this.jobHandlers.get(job.type);
    
    if (handler) {
      return handler(job);
    }
    
    // معالج افتراضي
    return this.defaultHandler(job);
  }

  private async defaultHandler(job: PrintJob): Promise<PrintResult> {
    // معالجة النسخ
    for (let i = 0; i < job.copies; i++) {
      job.currentCopy = i + 1;
      
      // محاكاة الطباعة
      await this.simulatePrint(job);
    }
    
    return {
      success: true,
      message: 'تمت الطباعة بنجاح',
      printTime: new Date(),
      jobId: job.id,
    };
  }

  private async simulatePrint(_job: PrintJob): Promise<void> {
    // محاكاة وقت الطباعة
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // ==================== معالجة الفشل ====================
  private async handleFailure(job: PrintJob, error: string): Promise<void> {
    job.error = error;
    job.retryCount++;
    
    this.addLog(job, 'failed', error);
    this.emit('jobFailed', { job, error });
    
    // إعادة المحاولة
    if (job.retryCount < job.maxRetries) {
      // حساب التأخير مع backoff
      const delay = Math.min(
        job.retryDelay * Math.pow(this.config.retryBackoffMultiplier, job.retryCount - 1),
        this.config.maxRetryDelay
      );
      
      job.status = 'pending';
      job.nextRetryAt = new Date(Date.now() + delay);
      
      // إعادة للطابور
      this.queue.unshift(job);
      this.sortQueue();
      
      // جدولة إعادة المحاولة
      setTimeout(() => this.processQueue(), delay);
    } else {
      // تجاوز حد المحاولات
      job.status = 'failed';
      this.completed.push(job);
      
      // إيقاف الطابور إذا كان مفعلاً
      if (this.config.pauseOnFailure) {
        this.pause();
      }
    }
  }

  // ==================== إدارة الطابور ====================
  
  // الحصول على المهمة التالية
  private getNextJob(): PrintJob | null {
    if (this.queue.length === 0) return null;
    
    // تجاهل المهام المؤجلة
    const now = new Date();
    return this.queue.find(job => {
      if (job.nextRetryAt && job.nextRetryAt > now) {
        return false;
      }
      return true;
    }) || null;
  }

  // ترتيب الطابور
  private sortQueue(): void {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    
    this.queue.sort((a, b) => {
      // المهام العاجلة أولاً
      if (a.isUrgent !== b.isUrgent) {
        return a.isUrgent ? -1 : 1;
      }
      
      // الأولوية
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      
      // تاريخ الإنشاء
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  // إلغاء مهمة
  cancelJob(jobId: string): boolean {
    const jobIndex = this.queue.findIndex(j => j.id === jobId);
    
    if (jobIndex !== -1) {
      const job = this.queue[jobIndex];
      job.status = 'cancelled';
      job.completedAt = new Date();
      
      this.queue.splice(jobIndex, 1);
      this.completed.push(job);
      this.addLog(job, 'cancelled');
      this.saveToStorage();
      
      this.emit('jobCancelled', job);
      return true;
    }
    
    // التحقق من المهام قيد المعالجة
    const processingJob = this.processing.get(jobId);
    if (processingJob) {
      processingJob.status = 'cancelled';
      processingJob.completedAt = new Date();
      this.emit('jobCancelled', processingJob);
      return true;
    }
    
    return false;
  }

  // إعادة محاولة مهمة فاشلة
  retryJob(jobId: string): boolean {
    const job = this.completed.find(j => j.id === jobId && j.status === 'failed');
    
    if (job) {
      job.status = 'pending';
      job.retryCount = 0;
      job.error = undefined;
      job.result = undefined;
      job.startedAt = undefined;
      job.completedAt = undefined;
      job.nextRetryAt = undefined;
      
      this.completed = this.completed.filter(j => j.id !== jobId);
      this.queue.push(job);
      this.sortQueue();
      this.saveToStorage();
      
      this.emit('jobRetried', job);
      this.processQueue();
      
      return true;
    }
    
    return false;
  }

  // إيقاف الطابور
  pause(): void {
    this.isPaused = true;
    this.emit('queuePaused', {});
  }

  // استئناف الطابور
  resume(): void {
    this.isPaused = false;
    this.emit('queueResumed', {});
    this.processQueue();
  }

  // مسح الطابور
  clearQueue(): void {
    const cancelledJobs = this.queue.map(job => {
      job.status = 'cancelled';
      job.completedAt = new Date();
      return job;
    });
    
    this.completed.push(...cancelledJobs);
    this.queue = [];
    this.saveToStorage();
    
    this.emit('queueCleared', { count: cancelledJobs.length });
  }

  // ==================== الاستعلام ====================
  
  // الحصول على مهمة
  getJob(jobId: string): PrintJob | undefined {
    return this.queue.find(j => j.id === jobId) ||
           this.processing.get(jobId) ||
           this.completed.find(j => j.id === jobId);
  }

  // الحصول على حالة المهمة
  getJobStatus(jobId: string): PrintJobStatus | undefined {
    return this.getJob(jobId)?.status;
  }

  // الحصول على جميع المهام
  getAllJobs(): PrintJob[] {
    return [
      ...this.queue,
      ...Array.from(this.processing.values()),
      ...this.completed,
    ];
  }

  // الحصول على المهام المعلقة
  getPendingJobs(): PrintJob[] {
    return this.queue.filter(j => j.status === 'pending');
  }

  // الحصول على المهام قيد المعالجة
  getProcessingJobs(): PrintJob[] {
    return Array.from(this.processing.values());
  }

  // الحصول على المهام المكتملة
  getCompletedJobs(limit?: number): PrintJob[] {
    const jobs = this.completed.filter(j => j.status === 'completed');
    return limit ? jobs.slice(-limit) : jobs;
  }

  // الحصول على المهام الفاشلة
  getFailedJobs(limit?: number): PrintJob[] {
    const jobs = this.completed.filter(j => j.status === 'failed');
    return limit ? jobs.slice(-limit) : jobs;
  }

  // إحصائيات الطابور
  getStats(): PrintQueueStats {
    const allJobs = this.getAllJobs();
    const completedJobs = allJobs.filter(j => j.status === 'completed');
    
    // حساب متوسط وقت المعالجة
    const processingTimes = completedJobs
      .filter(j => j.startedAt && j.completedAt)
      .map(j => new Date(j.completedAt!).getTime() - new Date(j.startedAt!).getTime());
    
    const averageProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;
    
    // حساب معدل النجاح
    const finishedJobs = allJobs.filter(j => 
      j.status === 'completed' || j.status === 'failed'
    );
    const successRate = finishedJobs.length > 0
      ? (completedJobs.length / finishedJobs.length) * 100
      : 100;
    
    return {
      totalJobs: allJobs.length,
      pendingJobs: this.queue.length,
      processingJobs: this.processing.size,
      completedJobs: completedJobs.length,
      failedJobs: this.completed.filter(j => j.status === 'failed').length,
      cancelledJobs: this.completed.filter(j => j.status === 'cancelled').length,
      averageProcessingTime,
      successRate,
    };
  }

  // ==================== السجل ====================
  
  private addLog(job: PrintJob, status: PrintJobStatus, error?: string): void {
    if (status === 'completed' && !this.config.logSuccess) return;
    if (status === 'failed' && !this.config.logFailures) return;
    
    const entry: PrintLogEntry = {
      id: `log-${Date.now()}-${job.id}`,
      jobId: job.id,
      type: job.type,
      printerId: job.printerId,
      printerName: job.printerConfig.name,
      status,
      referenceNumber: job.referenceNumber,
      copies: job.copies,
      error,
      timestamp: new Date(),
      userId: job.userId,
      userName: job.userName,
      branchId: job.branchId,
    };
    
    if (job.startedAt && job.completedAt) {
      entry.duration = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
    }
    
    this.logs.unshift(entry);
    
    // الحد من حجم السجل
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(0, 1000);
    }
  }

  getLogs(limit?: number): PrintLogEntry[] {
    return limit ? this.logs.slice(0, limit) : this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }

  // ==================== تسجيل المعالجات ====================
  
  registerHandler(type: PrintJobType, handler: (job: PrintJob) => Promise<PrintResult>): void {
    this.jobHandlers.set(type, handler);
  }

  unregisterHandler(type: PrintJobType): void {
    this.jobHandlers.delete(type);
  }

  // ==================== الأحداث ====================
  
  on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.eventListeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // ==================== التخزين ====================
  
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const data = {
        queue: this.queue,
        completed: this.completed.slice(-100), // آخر 100 مهمة
      };
      localStorage.setItem('printQueue', JSON.stringify(data));
    } catch {
      // فشل الحفظ
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('printQueue');
      if (stored) {
        const data = JSON.parse(stored);
        this.queue = (data.queue || []).map((j: PrintJob) => ({
          ...j,
          createdAt: new Date(j.createdAt),
          startedAt: j.startedAt ? new Date(j.startedAt) : undefined,
          completedAt: j.completedAt ? new Date(j.completedAt) : undefined,
          nextRetryAt: j.nextRetryAt ? new Date(j.nextRetryAt) : undefined,
        }));
        this.completed = (data.completed || []).map((j: PrintJob) => ({
          ...j,
          createdAt: new Date(j.createdAt),
          startedAt: j.startedAt ? new Date(j.startedAt) : undefined,
          completedAt: j.completedAt ? new Date(j.completedAt) : undefined,
        }));
      }
    } catch {
      // فشل التحميل
    }
  }

  // ==================== أدوات مساعدة ====================
  
  private generateJobId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ==================== Export Singleton ====================
export const printQueue = new PrintQueue();

// ==================== دوال مساعدة ====================
export function createPrintJob(options: Parameters<PrintQueue['addJob']>[0]): PrintJob {
  return printQueue.addJob(options);
}

export function getPrintJobStatus(jobId: string): PrintJobStatus | undefined {
  return printQueue.getJobStatus(jobId);
}

export function cancelPrintJob(jobId: string): boolean {
  return printQueue.cancelJob(jobId);
}

export function getPrintQueueStats(): PrintQueueStats {
  return printQueue.getStats();
}
