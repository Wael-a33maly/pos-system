// ============================================
// POSPage Component - الصفحة الرئيسية لنقطة البيع
// ============================================

'use client';

import { useState, useCallback } from 'react';
import { Search, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAppStore, formatCurrency } from '@/store';

// Module imports
import { useProducts } from '../hooks/useProducts';
import { usePayment } from '../hooks/usePayment';
import { useSettings } from '../hooks/useSettings';
import type { Product, Customer, ViewMode, CartItem, PendingInvoice } from '../types/pos.types';
import { mockCustomers } from '../constants/defaults';

// Component imports
import { POSHeader } from './POSHeader';
import { CategoryTabs } from './CategoryTabs';
import { ProductGrid } from './ProductGrid';
import { Cart } from './Cart';
import { CartFooter } from './CartFooter';
import { CustomerSearch } from './CustomerSearch';
import { PaymentDialog } from './PaymentDialog';
import { POSSettingsDialog } from './POSSettingsDialog';
import {
  PendingInvoicesDialog,
  ReturnDialog,
  ExpenseDialog,
  ShiftDialog,
  AddCustomerDialog,
} from './POSDialogs';

/**
 * POSPage - الصفحة الرئيسية لنقطة البيع
 * مكون خفيف يجمع كل المكونات الصغيرة
 */
export function POSPage() {
  // Global store
  const {
    cart,
    currency,
    instantMode,
    setInstantMode,
    fullscreen,
    setFullscreen,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    setCartCustomer,
    setCartDiscount,
    clearCart,
    pendingInvoices,
    addPendingInvoice,
    removePendingInvoice,
    getCartTotal,
    getCartSubtotal,
    getCartItemCount,
  } = useAppStore();

  // Custom hooks
  const {
    filteredProducts,
    mainCategories,
    subCategories,
    searchQuery,
    selectedCategory,
    showSubcategories,
    setSearchQuery,
    handleCategoryClick,
    goBackToMainCategories,
  } = useProducts();

  const { settings, updateSettings, resetSettings } = useSettings();

  const payment = usePayment({
    total: getCartTotal(),
    allowMultiPayment: settings.allowMultiPayment,
  });

  // Local state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  
  // Dialog states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);

  // Return/Expense states
  const [returnInvoiceNumber, setReturnInvoiceNumber] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseDescription, setExpenseDescription] = useState('');

  // Computed values
  const subtotal = getCartSubtotal();
  const total = getCartTotal();
  const itemCount = getCartItemCount();

  // Handlers
  const handleAddToCart = useCallback((product: Product) => {
    const item: CartItem = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      barcode: product.barcode,
      quantity: 1,
      unitPrice: product.sellingPrice,
      costPrice: product.costPrice,
      discountAmount: 0,
      totalAmount: product.sellingPrice,
      product,
    };
    addToCart(item);
  }, [addToCart]);

  const handlePayment = useCallback(() => {
    setShowPaymentDialog(false);
    clearCart();
    payment.reset();
  }, [clearCart, payment]);

  const handleHoldInvoice = useCallback(() => {
    if (cart.items.length > 0) {
      addPendingInvoice({
        id: Date.now().toString(),
        invoiceNumber: `PENDING-${Date.now()}`,
        items: cart.items,
        createdAt: new Date(),
      });
      clearCart();
    }
  }, [cart.items, addPendingInvoice, clearCart]);

  const handleRestoreInvoice = useCallback((invoice: PendingInvoice) => {
    invoice.items.forEach(item => addToCart(item));
    removePendingInvoice(invoice.id);
    setShowPendingDialog(false);
  }, [addToCart, removePendingInvoice]);

  const handleAddCustomer = useCallback((name: string, phone: string) => {
    const newCustomer: Customer = {
      id: Date.now().toString(),
      name,
      phone,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCustomers(prev => [...prev, newCustomer]);
    setCartCustomer(newCustomer);
  }, [setCartCustomer]);

  return (
    <div className={cn(
      'h-screen flex flex-col bg-background',
      fullscreen && 'fixed inset-0 z-50'
    )}>
      {/* Header */}
      <POSHeader
        instantMode={instantMode}
        fullscreen={fullscreen}
        pendingInvoicesCount={pendingInvoices.length}
        onToggleInstantMode={() => setInstantMode(!instantMode)}
        onShowPendingDialog={() => setShowPendingDialog(true)}
        onShowShiftDialog={() => setShowShiftDialog(true)}
        onShowReturnDialog={() => setShowReturnDialog(true)}
        onShowSettingsDialog={() => setShowSettingsDialog(true)}
        onShowExpenseDialog={() => setShowExpenseDialog(true)}
        onToggleFullscreen={() => setFullscreen(!fullscreen)}
        onCloseShift={() => {}}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search and View Toggle */}
          <div className="p-4 border-b bg-card">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو الباركود..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Categories */}
          <CategoryTabs
            categories={showSubcategories ? subCategories : mainCategories}
            selectedCategory={selectedCategory}
            showSubcategories={showSubcategories}
            onCategoryClick={handleCategoryClick}
            onBack={goBackToMainCategories}
          />

          {/* Products Grid */}
          <ProductGrid
            products={filteredProducts}
            settings={settings}
            viewMode={viewMode}
            currency={currency}
            onAddToCart={handleAddToCart}
          />
        </div>

        {/* Cart Section */}
        <div className="w-80 md:w-96 border-r bg-card flex flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">سلة المشتريات</h2>
              <Badge variant="secondary">{itemCount} صنف</Badge>
            </div>

            {/* Customer Search */}
            <CustomerSearch
              customers={customers}
              selectedCustomer={cart.customer}
              onCustomerSelect={setCartCustomer}
              onAddCustomer={handleAddCustomer}
              showAddDialog={showAddCustomerDialog}
              onShowAddDialog={setShowAddCustomerDialog}
            />
          </div>

          {/* Cart Items */}
          <Cart
            items={cart.items}
            currency={currency}
            onUpdateQuantity={updateCartItemQuantity}
            onRemove={removeFromCart}
          />

          {/* Cart Footer */}
          <CartFooter
            subtotal={subtotal}
            total={total}
            discountAmount={cart.discountAmount}
            currency={currency}
            settings={settings}
            itemCount={itemCount}
            hasItems={cart.items.length > 0}
            onDiscountChange={setCartDiscount}
            onHold={handleHoldInvoice}
            onClear={clearCart}
            onPayment={() => setShowPaymentDialog(true)}
          />
        </div>
      </div>

      {/* Dialogs */}
      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        total={total}
        currency={currency}
        settings={settings}
        selectedPaymentMethod={payment.selectedPaymentMethod}
        paidAmount={payment.paidAmount}
        paymentMethods={payment.paymentMethods}
        onPaymentMethodChange={payment.setSelectedPaymentMethod}
        onPaidAmountChange={payment.setPaidAmount}
        isMultiPayment={payment.isMultiPayment}
        payments={payment.payments}
        totalPaid={payment.totalPaid}
        onToggleMultiPayment={() => payment.setIsMultiPayment(!payment.isMultiPayment)}
        onAddPaymentMethod={payment.addPaymentMethod}
        onUpdatePaymentAmount={payment.updatePaymentAmount}
        onRemovePayment={payment.removePayment}
        onPayment={handlePayment}
        onReset={payment.reset}
      />

      <POSSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        settings={settings}
        onUpdateSettings={updateSettings}
        onResetSettings={resetSettings}
      />

      <PendingInvoicesDialog
        open={showPendingDialog}
        onOpenChange={setShowPendingDialog}
        pendingInvoices={pendingInvoices}
        onRestore={handleRestoreInvoice}
        onDelete={removePendingInvoice}
      />

      <ReturnDialog
        open={showReturnDialog}
        onOpenChange={setShowReturnDialog}
        invoiceNumber={returnInvoiceNumber}
        onInvoiceNumberChange={setReturnInvoiceNumber}
        onSearch={() => setShowReturnDialog(false)}
      />

      <ExpenseDialog
        open={showExpenseDialog}
        onOpenChange={setShowExpenseDialog}
        currency={currency}
        expenseCategoryId={expenseCategoryId}
        expenseAmount={expenseAmount}
        expenseDescription={expenseDescription}
        onCategoryChange={setExpenseCategoryId}
        onAmountChange={setExpenseAmount}
        onDescriptionChange={setExpenseDescription}
        onSave={() => setShowExpenseDialog(false)}
      />

      <ShiftDialog
        open={showShiftDialog}
        onOpenChange={setShowShiftDialog}
        currency={currency}
      />

      <AddCustomerDialog
        open={showAddCustomerDialog}
        onOpenChange={setShowAddCustomerDialog}
        onAddCustomer={handleAddCustomer}
      />
    </div>
  );
}
