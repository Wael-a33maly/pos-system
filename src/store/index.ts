import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  User, 
  Branch, 
  Shift, 
  Cart, 
  CartItem, 
  Currency,
  Customer,
  Product,
  ProductVariant
} from '@/types';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  
  // Branch
  currentBranch: Branch | null;
  branches: Branch[];
  
  // Shift
  currentShift: Shift | null;
  
  // UI
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  posMode: boolean;
  instantMode: boolean;
  fullscreen: boolean;
  
  // Cart
  cart: Cart;
  
  // Settings
  currency: Currency | null;
  decimalPlaces: number;
  
  // Pending invoices
  pendingInvoices: { id: string; invoiceNumber: string; items: CartItem[]; createdAt: Date }[];
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  
  setCurrentBranch: (branch: Branch | null) => void;
  setBranches: (branches: Branch[]) => void;
  
  setCurrentShift: (shift: Shift | null) => void;
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setPosMode: (mode: boolean) => void;
  setInstantMode: (mode: boolean) => void;
  setFullscreen: (fullscreen: boolean) => void;
  
  // Cart Actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateCartItemQuantity: (id: string, quantity: number) => void;
  updateCartItemPrice: (id: string, price: number) => void;
  updateCartItemDiscount: (id: string, discount: number) => void;
  clearCart: () => void;
  setCartCustomer: (customer: Customer | null) => void;
  setCartDiscount: (discount: number) => void;
  setCartNotes: (notes: string) => void;
  
  // Pending Invoices Actions
  addPendingInvoice: (invoice: { id: string; invoiceNumber: string; items: CartItem[]; createdAt: Date }) => void;
  removePendingInvoice: (id: string) => void;
  clearPendingInvoices: () => void;
  
  // Settings Actions
  setCurrency: (currency: Currency | null) => void;
  setDecimalPlaces: (places: number) => void;
  
  // Helper
  getCartTotal: () => number;
  getCartSubtotal: () => number;
  getCartItemCount: () => number;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      isAuthenticated: false,
      token: null,
      
      currentBranch: null,
      branches: [],
      
      currentShift: null,
      
      theme: 'system',
      sidebarOpen: true,
      sidebarCollapsed: false,
      posMode: false,
      instantMode: false,
      fullscreen: false,
      
      cart: {
        items: [],
        customerId: undefined,
        customer: undefined,
        discountAmount: 0,
        notes: undefined,
      },
      
      currency: {
        id: 'default',
        name: 'Saudi Riyal',
        nameAr: 'ريال سعودي',
        code: 'SAR',
        symbol: 'ر.س',
        decimalPlaces: 2,
        isDefault: true,
        isActive: true,
      },
      decimalPlaces: 2,
      
      pendingInvoices: [],
      
      // Auth Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      logout: () => set({ 
        user: null, 
        isAuthenticated: false, 
        token: null,
        currentShift: null,
        cart: { items: [], customerId: undefined, customer: undefined, discountAmount: 0, notes: undefined },
        pendingInvoices: [],
      }),
      
      // Branch Actions
      setCurrentBranch: (branch) => set({ currentBranch: branch }),
      setBranches: (branches) => set({ branches }),
      
      // Shift Actions
      setCurrentShift: (shift) => set({ currentShift: shift }),
      
      // UI Actions
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setPosMode: (mode) => set({ posMode: mode }),
      setInstantMode: (mode) => set({ instantMode: mode }),
      setFullscreen: (fullscreen) => set({ fullscreen }),
      
      // Cart Actions
      addToCart: (item) => set((state) => {
        const existingItem = state.cart.items.find(i => 
          (i.productId && i.productId === item.productId && !item.variantId) ||
          (i.variantId && i.variantId === item.variantId)
        );
        
        if (existingItem) {
          const updatedItems = state.cart.items.map(i => 
            i.id === existingItem.id 
              ? { ...i, quantity: i.quantity + item.quantity, totalAmount: (i.quantity + item.quantity) * i.unitPrice - i.discountAmount }
              : i
          );
          return { cart: { ...state.cart, items: updatedItems } };
        }
        
        return { 
          cart: { 
            ...state.cart, 
            items: [...state.cart.items, { ...item, id: item.id || generateId() }] 
          } 
        };
      }),
      
      removeFromCart: (id) => set((state) => ({
        cart: { ...state.cart, items: state.cart.items.filter(i => i.id !== id) }
      })),
      
      updateCartItemQuantity: (id, quantity) => set((state) => ({
        cart: {
          ...state.cart,
          items: state.cart.items.map(i => 
            i.id === id 
              ? { ...i, quantity, totalAmount: quantity * i.unitPrice - i.discountAmount }
              : i
          )
        }
      })),
      
      updateCartItemPrice: (id, price) => set((state) => ({
        cart: {
          ...state.cart,
          items: state.cart.items.map(i => 
            i.id === id 
              ? { ...i, unitPrice: price, totalAmount: i.quantity * price - i.discountAmount }
              : i
          )
        }
      })),
      
      updateCartItemDiscount: (id, discount) => set((state) => ({
        cart: {
          ...state.cart,
          items: state.cart.items.map(i => 
            i.id === id 
              ? { ...i, discountAmount: discount, totalAmount: i.quantity * i.unitPrice - discount }
              : i
          )
        }
      })),
      
      clearCart: () => set((state) => ({
        cart: { items: [], customerId: undefined, customer: undefined, discountAmount: 0, notes: undefined }
      })),
      
      setCartCustomer: (customer) => set((state) => ({
        cart: { ...state.cart, customerId: customer?.id, customer: customer || undefined }
      })),
      
      setCartDiscount: (discount) => set((state) => ({
        cart: { ...state.cart, discountAmount: discount }
      })),
      
      setCartNotes: (notes) => set((state) => ({
        cart: { ...state.cart, notes }
      })),
      
      // Pending Invoices Actions
      addPendingInvoice: (invoice) => set((state) => ({
        pendingInvoices: [...state.pendingInvoices, invoice]
      })),
      
      removePendingInvoice: (id) => set((state) => ({
        pendingInvoices: state.pendingInvoices.filter(i => i.id !== id)
      })),
      
      clearPendingInvoices: () => set({ pendingInvoices: [] }),
      
      // Settings Actions
      setCurrency: (currency) => set({ currency }),
      setDecimalPlaces: (places) => set({ decimalPlaces: places }),
      
      // Helper Functions
      getCartTotal: () => {
        const state = get();
        const subtotal = state.cart.items.reduce((sum, item) => sum + item.totalAmount, 0);
        return subtotal - state.cart.discountAmount;
      },
      
      getCartSubtotal: () => {
        const state = get();
        return state.cart.items.reduce((sum, item) => sum + item.totalAmount, 0);
      },
      
      getCartItemCount: () => {
        const state = get();
        return state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'pos-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        currentBranch: state.currentBranch,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        currency: state.currency,
        decimalPlaces: state.decimalPlaces,
        pendingInvoices: state.pendingInvoices,
      }),
    }
  )
);

// Helper function to add product to cart
export const addProductToCart = (
  product: Product, 
  variant?: ProductVariant, 
  quantity: number = 1
) => {
  const store = useAppStore.getState();
  
  const item: CartItem = {
    id: '',
    productId: product.id,
    variantId: variant?.id,
    productName: variant?.name || product.name,
    barcode: variant?.barcode || product.barcode,
    quantity,
    unitPrice: variant?.sellingPrice || product.sellingPrice,
    costPrice: variant?.costPrice || product.costPrice,
    discountAmount: 0,
    totalAmount: (variant?.sellingPrice || product.sellingPrice) * quantity,
    product,
    variant,
  };
  
  store.addToCart(item);
};

// Format currency
export const formatCurrency = (amount: number, currency?: Currency | null, decimalPlaces?: number) => {
  const curr = currency || useAppStore.getState().currency;
  const decimals = decimalPlaces ?? useAppStore.getState().decimalPlaces ?? 2;
  
  const formatted = amount.toFixed(decimals);
  
  if (curr) {
    return `${formatted} ${curr.symbol}`;
  }
  
  return formatted;
};
