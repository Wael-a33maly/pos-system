'use client';

import { useState, Suspense, lazy } from 'react';
import { Calculator, FileText, Scale, BookOpen, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load components
const ChartOfAccountsPage = lazy(() => 
  import('./ChartOfAccountsPage').then(m => ({ default: m.ChartOfAccountsPage }))
);
const JournalEntriesPage = lazy(() => 
  import('./JournalEntriesPage').then(m => ({ default: m.JournalEntriesPage }))
);
const FinancialReportsPage = lazy(() => 
  import('./FinancialReportsPage').then(m => ({ default: m.FinancialReportsPage }))
);

function PageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export function AccountsPage() {
  const [activeTab, setActiveTab] = useState('chart-of-accounts');

  return (
    <div className="h-full" dir="rtl">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="chart-of-accounts" className="gap-2">
              <BookOpen className="h-4 w-4" />
              شجرة الحسابات
            </TabsTrigger>
            <TabsTrigger value="journal-entries" className="gap-2">
              <FileText className="h-4 w-4" />
              القيود المحاسبية
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <Scale className="h-4 w-4" />
              التقارير المالية
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="chart-of-accounts" className="h-full m-0">
            <Suspense fallback={<PageSkeleton />}>
              <ChartOfAccountsPage />
            </Suspense>
          </TabsContent>

          <TabsContent value="journal-entries" className="h-full m-0">
            <Suspense fallback={<PageSkeleton />}>
              <JournalEntriesPage />
            </Suspense>
          </TabsContent>

          <TabsContent value="reports" className="h-full m-0">
            <Suspense fallback={<PageSkeleton />}>
              <FinancialReportsPage />
            </Suspense>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
