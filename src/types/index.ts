export type TabId = 'dashboard' | 'inventory' | 'bundles' | 'orders' | 'bnpl';
export type Timeframe = 'all' | 'today' | 'week' | 'month';
export type OrderTab = 'all' | 'active' | 'completed' | 'cancelled';
export type ApFilter = 'all' | 'unpaid' | 'partial' | 'paid';
export type FinancialModalType =
  | 'revenue'
  | 'profit'
  | 'outstanding'
  | 'inventory_value'
  | 'money_spent'
  | 'expected_sales'
  | 'expected_profit';
export type DashboardModalType = 'total' | 'low' | 'out';

export interface SortEntry {
  col: string;
  dir: 'asc' | 'desc';
}

export interface InventoryItem {
  id: string;
  name: string;
  unitCost: number;
  sellPrice: number;
  stockQty: number;
  image?: string | null;
  recCppMin?: number;
  recCppMax?: number;
  isReject?: boolean;
  rejectStatus?: string;
  notes?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  sellPrice: number;
  unitCost: number;
  effectiveTotal: number;
  totalCost: number;
  totalProfit: number;
}

export interface Order {
  id: string;
  customerName: string;
  date: string;
  items?: OrderItem[];
  itemId?: string;
  itemName?: string;
  orderQty?: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  amountPaid?: number;
  isPaid: boolean;
  isReceived: boolean;
  status: 'active' | 'cancelled' | string;
  isEdited?: boolean;
}

export interface BundleItem {
  itemId: string;
  name: string;
  qty: number;
}

export interface Bundle {
  id: string;
  type: 'same' | 'mixed';
  name: string;
  price: number;
  isActive: boolean;
  items: BundleItem[];
}

export interface CartItem {
  id: string;
  name: string;
  sellPrice: number;
  unitCost: number;
  maxStock: number;
  qty: number;
  remainingQty?: number;
  discountedAmount?: number;
  effectiveTotal?: number;
  effectivePrice?: number;
}

export interface AppliedBundleInfo {
  name: string;
  times: number;
  save: number;
}

export interface CartCalculation {
  total: number;
  savings: number;
  appliedBundles: AppliedBundleInfo[];
  items: CartItem[];
}

export interface ActivityLogEntry {
  id: string;
  date: string;
  type: 'stock_in' | 'sale' | 'stock_adj' | string;
  message: string;
  timestamp: number;
}

export interface StockHistoryEntry {
  id: string;
  productName: string;
  qtyAdded: number;
  costPerItem: number;
  totalCost: number;
  date: string;
}

export interface BnplLineItem {
  itemName: string;
  qty: number;
  totalCost: number;
  costPerPiece: number;
  sellingPrice: number;
}

export interface BnplPayment {
  amount: number;
  date: string;
}

export interface BnplRecord {
  id: string;
  supplierName: string;
  invoiceNumber: string;
  purchaseDate: string;
  dueDate: string;
  notes: string;
  items: BnplLineItem[];
  totalAmount: number;
  amountPaid: number;
  payments?: BnplPayment[];
  isReceived: boolean;
  receivedDate: string | null;
  status: 'unpaid' | 'partially_paid' | 'fully_paid' | string;
}

export interface CashAdjustment {
  id: string;
  amount: number;
  type: 'withdrawal' | string;
  reason: string;
  date: string;
  timestamp: number;
  status: 'active' | 'reversed';
  reversedAt?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  proceedText: string;
  onProceed: (() => void) | null;
}

export interface SummaryMetrics {
  revenue: number;
  profit: number;
  roi: number;
  completedOrdersCount: number;
  completedOrdersTotalValue: number;
  pendingBalance: number;
  inventoryVal: number;
  totalSpent: number;
  expectedSalesVal: number;
  expectedProfitVal: number;
  totalProductsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface LiquidCashMetrics {
  systemLiquidCash: number;
  activeManualCashUsed: number;
  availableLiquidCash: number;
  totalApPaid: number;
  totalApUnpaid: number;
}
