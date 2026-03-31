// ============================================
// CustomerSearch Component - البحث عن عميل
// ============================================

import { memo, useState } from 'react';
import { Search, User, UserPlus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Customer } from '../types/pos.types';

interface CustomerSearchProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  onAddCustomer: (name: string, phone: string) => void;
  showAddDialog: boolean;
  onShowAddDialog: (show: boolean) => void;
}

/**
 * مكون البحث عن عميل وإضافة عميل جديد
 * يعرض قائمة العملاء مع إمكانية البحث والإضافة
 */
const CustomerSearch = memo(function CustomerSearch({
  customers,
  selectedCustomer,
  onCustomerSelect,
  onAddCustomer,
  showAddDialog,
  onShowAddDialog,
}: CustomerSearchProps) {
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // فلترة العملاء
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch)
  );

  const handleAddCustomer = () => {
    if (!newCustomerName.trim()) return;
    onAddCustomer(newCustomerName, newCustomerPhone);
    setNewCustomerName('');
    setNewCustomerPhone('');
    onShowAddDialog(false);
  };

  return (
    <>
      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            placeholder="بحث عميل بالاسم أو التليفون..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="pr-10"
          />

          {/* قائمة النتائج */}
          {customerSearch && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
              {filteredCustomers.length > 0 ? (
                <>
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      className={cn(
                        'w-full px-3 py-2 flex items-center gap-2 hover:bg-muted transition-colors text-right',
                        selectedCustomer?.id === customer.id && 'bg-muted'
                      )}
                      onClick={() => {
                        onCustomerSelect(customer);
                        setCustomerSearch('');
                      }}
                    >
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{customer.name}</p>
                        {customer.phone && (
                          <p className="text-xs text-muted-foreground">{customer.phone}</p>
                        )}
                      </div>
                      {selectedCustomer?.id === customer.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                  <div className="border-t">
                    <button
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted transition-colors text-primary text-sm"
                      onClick={() => {
                        onShowAddDialog(true);
                        setCustomerSearch('');
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                      إضافة عميل جديد
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-3">
                  <p className="text-sm text-muted-foreground text-center mb-2">
                    لا يوجد عملاء مطابقين
                  </p>
                  <button
                    className="w-full px-3 py-2 flex items-center justify-center gap-2 hover:bg-muted transition-colors text-primary text-sm rounded-lg border"
                    onClick={() => {
                      onShowAddDialog(true);
                      setCustomerSearch('');
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                    إضافة عميل جديد
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onShowAddDialog(true)}
          title="إضافة عميل جديد"
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>

      {/* العميل المحدد */}
      {selectedCustomer && (
        <div className="mt-2 p-2 bg-muted rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <div>
              <p className="font-medium text-sm">{selectedCustomer.name}</p>
              {selectedCustomer.phone && (
                <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onCustomerSelect(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </>
  );
});

export { CustomerSearch };
