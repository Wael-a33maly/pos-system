// ============================================
// Product Skeleton Component - هيكل التحميل
// ============================================

import { Card, CardContent } from '@/components/ui/card';

export function ProductSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
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
              <div className="animate-pulse w-10 h-10 bg-muted rounded-md" />
              <div className="flex-1 space-y-2">
                <div className="animate-pulse h-4 bg-muted rounded w-1/3" />
                <div className="animate-pulse h-3 bg-muted rounded w-1/4" />
              </div>
              <div className="animate-pulse h-6 bg-muted rounded w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
