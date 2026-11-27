import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ActivityLogEntry,
  BnplRecord,
  Bundle,
  BundleItem,
  CartItem,
  CashAdjustment,
  ConfirmDialogState,
  DashboardModalType,
  FinancialModalType,
  InventoryItem,
  Order,
  OrderItem,
  SortEntry,
  StockHistoryEntry,
  TabId,
  Timeframe,
  ToastMessage,
} from './types';
import {
  getFirebaseServices,
  isAuthorizedUserEmail,
  saveActivityLogToDb,
  saveBnplToDb,
  saveBundlesToDb,
  saveCashAdjustmentsToDb,
  saveInventoryToDb,
  saveOrdersToDb,
  saveStockHistoryToDb,
  signInWithGoogle,
  signInWithEmailPassword,
  sendPasswordResetEmail,
} from './services/firebase';
import {
  calculateCart,
  calculateLiquidCash,
  calculateSummaryMetrics,
  getOrderItems,
  getProductHistoricalCPP,
  toggleMultiColumnSort,
  withSyncedInventoryCPP,
} from './services/calculations';
import { exportDatabaseBackupJSON, exportOrdersToCSV } from './services/exportReceipt';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthScreen } from './components/layout/AuthScreen';
import { Header } from './components/layout/Header';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { InventoryView } from './components/inventory/InventoryView';
import { BundlesView } from './components/bundles/BundlesView';
import { PosView } from './components/pos/PosView';
import { BnplView } from './components/bnpl/BnplView';
import { CalculatorModal } from './components/modals/CalculatorModal';
import { SubtractCashModal } from './components/modals/SubtractCashModal';
import { CashHistoryModal } from './components/modals/CashHistoryModal';
import { FinancialDetailsModal } from './components/modals/FinancialDetailsModal';
import { StockHistoryModal } from './components/modals/StockHistoryModal';
import { DashboardProductsModal } from './components/modals/DashboardProductsModal';
import { EditStockModal } from './components/modals/EditStockModal';
import { RejectStockModal } from './components/modals/RejectStockModal';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { ApPaymentModal } from './components/modals/ApPaymentModal';
import { PaymentHistoryModal } from './components/modals/PaymentHistoryModal';
import { EditSupplierInvoiceModal } from './components/modals/EditSupplierInvoiceModal';
import { ConfirmationModal } from './components/modals/ConfirmationModal';

export default function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return (
      saved === 'dark' ||
      (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  // Navigation & Filters
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [timeframe, setTimeframe] = useState<Timeframe>('all');

  // Sort Stacks
  const [inventorySortStack, setInventorySortStack] = useState<SortEntry[]>([]);
  const [bundleSortStack, setBundleSortStack] = useState<SortEntry[]>([]);
  const [orderSortStack, setOrderSortStack] = useState<SortEntry[]>([]);
  const [bnplSortStack, setBnplSortStack] = useState<SortEntry[]>([]);

  // Core Data State
  const [rawInventory, setRawInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [bnplRecords, setBnplRecords] = useState<BnplRecord[]>([]);
  const [cashAdjustments, setCashAdjustments] = useState<CashAdjustment[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistoryEntry[]>([]);

  // POS Cart & Editing State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [posCustomer, setPosCustomer] = useState('');
  const [posPaidAmount, setPosPaidAmount] = useState('');
  const [posPaidFull, setPosPaidFull] = useState(true);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isFabScrollHidden, setIsFabScrollHidden] = useState(false);

  // Modals State
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isSubtractCashOpen, setIsSubtractCashOpen] = useState(false);
  const [isCashHistoryOpen, setIsCashHistoryOpen] = useState(false);
  const [financialModalType, setFinancialModalType] = useState<FinancialModalType | null>(null);
  const [isStockHistoryOpen, setIsStockHistoryOpen] = useState(false);
  const [dashboardModalType, setDashboardModalType] = useState<DashboardModalType | null>(null);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [rejectSourceItem, setRejectSourceItem] = useState<InventoryItem | null>(null);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [apPaymentRecord, setApPaymentRecord] = useState<BnplRecord | null>(null);
  const [paymentHistoryRecord, setPaymentHistoryRecord] = useState<BnplRecord | null>(null);
  const [editingSupplierRecord, setEditingSupplierRecord] = useState<BnplRecord | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const mainScrollRef = useRef<HTMLElement | null>(null);
  const lastMainScrollTopRef = useRef(0);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3300);
    },
    []
  );

  const logActivity = useCallback(
    (type: string, message: string, currentLogs: ActivityLogEntry[]) => {
      const next: ActivityLogEntry[] = [
        {
          id: 'ACT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          date: new Date().toLocaleString(),
          type,
          message,
          timestamp: Date.now(),
        },
        ...currentLogs,
      ].slice(0, 50);
      setActivityLog(next);
      saveActivityLogToDb(next);
      return next;
    },
    []
  );

  // Sync dark mode class on <html> and PWA theme-color
  useEffect(() => {
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      if (themeMeta) themeMeta.setAttribute('content', '#060606');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      if (themeMeta) themeMeta.setAttribute('content', '#F7F7F5');
    }
  }, [isDark]);

  // Derived Inventory with synced historical CPP
  const inventory = useMemo(
    () => withSyncedInventoryCPP(rawInventory, bnplRecords),
    [rawInventory, bnplRecords]
  );

  // Synced Cart Calculation
  const cartCalc = useMemo(() => calculateCart(cart, bundles), [cart, bundles]);

  // Keep posPaidAmount synced when Paid Full is toggled
  useEffect(() => {
    if (posPaidFull) {
      setPosPaidAmount(cartCalc.total.toFixed(2));
    }
  }, [posPaidFull, cartCalc.total]);

  // Firebase Auth & Realtime Database Subscriptions
  useEffect(() => {
    const { db, auth } = getFirebaseServices();
    if (!auth || !db) return;

    const unsubscribeAuth = auth.onAuthStateChanged((user: { email?: string | null } | null) => {
      if (user) {
        if (!isAuthorizedUserEmail(user.email)) {
          auth.signOut();
          setIsAuthenticated(false);
          return;
        }
        setIsAuthenticated(true);

        db.ref('inventory').on('value', (snap: { val: () => InventoryItem[] | null }) => {
          setRawInventory(snap.val() || []);
        });
        db.ref('orders').on('value', (snap: { val: () => Order[] | null }) => {
          setOrders(snap.val() || []);
        });
        db.ref('bundles').on('value', (snap: { val: () => Bundle[] | null }) => {
          setBundles(snap.val() || []);
        });
        db.ref('bnplRecords').on('value', (snap: { val: () => BnplRecord[] | null }) => {
          setBnplRecords(snap.val() || []);
        });
        db.ref('cashAdjustments').on('value', (snap: { val: () => CashAdjustment[] | null }) => {
          setCashAdjustments(snap.val() || []);
        });
        db.ref('activityLog').on('value', (snap: { val: () => ActivityLogEntry[] | null }) => {
          setActivityLog(snap.val() || []);
        });
        db.ref('stockHistory').on('value', (snap: { val: () => StockHistoryEntry[] | null }) => {
          setStockHistory(snap.val() || []);
        });
      } else {
        setIsAuthenticated(false);
        db.ref('inventory').off();
        db.ref('orders').off();
        db.ref('bundles').off();
        db.ref('bnplRecords').off();
        db.ref('cashAdjustments').off();
        db.ref('activityLog').off();
        db.ref('stockHistory').off();
      }
    });

    return () => {
      if (typeof unsubscribeAuth === 'function') unsubscribeAuth();
    };
  }, []);

  // Escape key global handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingInventoryItem(null);
        setRejectSourceItem(null);
        setDashboardModalType(null);
        setFinancialModalType(null);
        setIsStockHistoryOpen(false);
        setConfirmDialog(null);
        setIsCalculatorOpen(false);
        setActiveReceiptOrder(null);
        setApPaymentRecord(null);
        setPaymentHistoryRecord(null);
        setEditingSupplierRecord(null);
        setIsSubtractCashOpen(false);
        setIsCashHistoryOpen(false);
        setIsCartModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main scroll handler for hiding floating Cart button on scroll down
  const handleMainScroll = (e: React.UIEvent<HTMLElement>) => {
    const st = e.currentTarget.scrollTop;
    if (st > lastMainScrollTopRef.current && st > 60) {
      setIsFabScrollHidden(true);
    } else if (st < lastMainScrollTopRef.current - 5 || st <= 60) {
      setIsFabScrollHidden(false);
    }
    lastMainScrollTopRef.current = st <= 0 ? 0 : st;
  };

  // Summary Metrics & Liquid Cash
  const summaryMetrics = useMemo(
    () =>
      calculateSummaryMetrics(
        inventory,
        orders,
        stockHistory,
        bnplRecords,
        timeframe
      ),
    [inventory, orders, stockHistory, bnplRecords, timeframe]
  );

  const liquidCash = useMemo(
    () => calculateLiquidCash(orders, bnplRecords, cashAdjustments),
    [orders, bnplRecords, cashAdjustments]
  );

  // Auth Handlers
  const handleLogin = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    return signInWithEmailPassword(email, pass);
  };

  const handlePasswordReset = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    return sendPasswordResetEmail(email);
  };

  const handleGoogleLogin = async () => {
    return signInWithGoogle();
  };

  const handleLogout = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Log Out',
      message: 'Are you sure you want to end your session?',
      proceedText: 'Log Out',
      onProceed: () => {
        const { auth } = getFirebaseServices();
        if (auth) auth.signOut();
      },
    });
  };

  const handleClearActivityLog = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Clear Activity Log?',
      message: 'Are you sure you want to clear all activity logs?',
      proceedText: 'Clear Logs',
      onProceed: () => {
        setActivityLog([]);
        saveActivityLogToDb([]);
        showToast('Activity logs cleared', 'info');
      },
    });
  };

  // Cash Adjustment Handlers
  const handleSubtractCash = (amount: number, reason: string) => {
    const next: CashAdjustment[] = [
      ...cashAdjustments,
      {
        id: 'CA-' + Date.now().toString(),
        amount,
        type: 'withdrawal',
        reason,
        date: new Date().toLocaleString(),
        timestamp: Date.now(),
        status: 'active',
      },
    ];
    setCashAdjustments(next);
    saveCashAdjustmentsToDb(next);
    logActivity(
      'stock_adj',
      `Subtracted ₱${amount.toFixed(2)} from Liquid Cash (${reason}).`,
      activityLog
    );
    showToast(`Subtracted ₱${amount.toFixed(2)} from Liquid Cash`);
    setIsSubtractCashOpen(false);
  };

  const handleUndoCashAdjustment = (id: string) => {
    const target = cashAdjustments.find((c) => c.id === id);
    if (!target || target.status === 'reversed') return;
    setConfirmDialog({
      isOpen: true,
      title: 'Undo Cash Subtraction?',
      message: `Restore ₱${(parseFloat(String(target.amount)) || 0).toFixed(2)} (${
        target.reason || 'Manual cash withdrawal'
      }) back into Available Liquid Cash?`,
      proceedText: 'Restore Cash',
      onProceed: () => {
        const next: CashAdjustment[] = cashAdjustments.map((c) =>
          c.id === id
            ? { ...c, status: 'reversed', reversedAt: new Date().toLocaleString() }
            : c
        );
        setCashAdjustments(next);
        saveCashAdjustmentsToDb(next);
        logActivity(
          'stock_adj',
          `Restored ₱${(parseFloat(String(target.amount)) || 0).toFixed(2)} back to Liquid Cash (${
            target.reason || 'Manual withdrawal'
          }).`,
          activityLog
        );
        showToast(
          `Restored ₱${(parseFloat(String(target.amount)) || 0).toFixed(2)} to Liquid Cash`
        );
      },
    });
  };

  // Inventory Handlers
  const handleRegisterProduct = (
    name: string,
    sellPrice: number,
    image: string | null,
    recMin: number,
    recMax: number
  ) => {
    const existingIdx = rawInventory.findIndex(
      (i) => i.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    const nextRaw = [...rawInventory];
    if (existingIdx > -1) {
      const existing = { ...nextRaw[existingIdx] };
      if (sellPrice > 0) existing.sellPrice = sellPrice;
      if (image) existing.image = image;
      if (recMin > 0) existing.recCppMin = recMin;
      if (recMax > 0) existing.recCppMax = recMax;
      nextRaw[existingIdx] = existing;
      logActivity(
        'stock_in',
        `Updated registered product "${name}" (Sell: ₱${sellPrice.toFixed(2)})`,
        activityLog
      );
      showToast(`Updated product: ${name}`);
    } else {
      const calculatedCpp = getProductHistoricalCPP(name, bnplRecords, 0);
      nextRaw.push({
        id: 'PROD-' + Date.now(),
        name,
        unitCost: calculatedCpp,
        sellPrice,
        stockQty: 0,
        image,
        recCppMin: recMin,
        recCppMax: recMax,
      });
      logActivity(
        'stock_in',
        `Registered new product "${name}" (Sell: ₱${sellPrice.toFixed(2)})`,
        activityLog
      );
      showToast(`Registered product: ${name}`);
    }
    setRawInventory(nextRaw);
    saveInventoryToDb(nextRaw);
  };

  const handleSaveEditedStock = (payload: {
    id: string;
    name: string;
    sellPrice: number;
    adjType: 'none' | 'correction' | 'damaged' | 'expired';
    adjQty: number;
    newImageDataUrl?: string | null;
  }) => {
    const idx = rawInventory.findIndex((i) => i.id === payload.id);
    if (idx === -1) return;

    const item = { ...rawInventory[idx] };
    let logMsg = `Updated "${payload.name}" (Sell Price: ₱${payload.sellPrice.toFixed(2)})`;

    if (payload.adjType !== 'none' && payload.adjQty !== 0) {
      let delta = payload.adjQty;
      if ((payload.adjType === 'damaged' || payload.adjType === 'expired') && delta > 0) {
        delta = -delta;
      }
      if (item.stockQty + delta < 0) {
        showToast('Adjustment exceeds current stock', 'error');
        return;
      }
      item.stockQty += delta;
      logMsg += ` | Adjusted stock by ${delta > 0 ? '+' + delta : delta} (${payload.adjType.toUpperCase()})`;
    }

    item.name = payload.name;
    item.sellPrice = payload.sellPrice;
    if (payload.newImageDataUrl !== undefined) {
      item.image = payload.newImageDataUrl;
    }

    const nextRaw = [...rawInventory];
    nextRaw[idx] = item;
    setRawInventory(nextRaw);
    saveInventoryToDb(nextRaw);
    logActivity('stock_adj', logMsg, activityLog);
    showToast('Product updated');
    setEditingInventoryItem(null);
  };

  const handleSeparateDefectiveStock = (payload: {
    sourceId: string;
    name: string;
    classification: string;
    qty: number;
    sellPrice: number;
    notes: string;
  }) => {
    const sourceIdx = rawInventory.findIndex((i) => i.id === payload.sourceId);
    if (sourceIdx === -1) return;
    const sourceItem = rawInventory[sourceIdx];

    if (payload.qty <= 0 || payload.qty > sourceItem.stockQty) {
      showToast('Invalid quantity to deduct', 'error');
      return;
    }

    const nextRaw = [...rawInventory];
    nextRaw[sourceIdx] = {
      ...sourceItem,
      stockQty: sourceItem.stockQty - payload.qty,
    };

    const existingRejectIdx = nextRaw.findIndex(
      (i) => i.name.toLowerCase() === payload.name.toLowerCase()
    );

    if (existingRejectIdx > -1) {
      const existingReject = { ...nextRaw[existingRejectIdx] };
      existingReject.stockQty += payload.qty;
      existingReject.sellPrice = payload.sellPrice;
      existingReject.isReject = true;
      existingReject.rejectStatus = payload.classification;
      if (payload.notes) existingReject.notes = payload.notes;
      nextRaw[existingRejectIdx] = existingReject;
    } else {
      nextRaw.push({
        id: 'REJ-' + Date.now(),
        name: payload.name,
        stockQty: payload.qty,
        unitCost: sourceItem.unitCost,
        sellPrice: payload.sellPrice,
        image: sourceItem.image || null,
        isReject: true,
        rejectStatus: payload.classification,
        notes: payload.notes,
      });
    }

    setRawInventory(nextRaw);
    saveInventoryToDb(nextRaw);
    logActivity(
      'stock_adj',
      `Separated ${payload.qty}x from "${sourceItem.name}" into "${payload.name}" (${payload.classification}) @ ₱${payload.sellPrice.toFixed(2)}`,
      activityLog
    );
    showToast(`Isolated ${payload.qty}x into "${payload.name}"`);
    setRejectSourceItem(null);
  };

  const handleDeleteStock = (id: string) => {
    const item = inventory.find((i) => i.id === id);
    if (!item) return;
    const isUsedInBundle = bundles.some((b) =>
      (b.items || []).some((bi) => bi.itemId === id)
    );
    if (isUsedInBundle) {
      showToast('Cannot delete: Used in an active bundle', 'error');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Product?',
      message: `Are you sure you want to delete "${item.name}"? This cannot be undone.`,
      proceedText: 'Delete',
      onProceed: () => {
        const nextRaw = rawInventory.filter((i) => i.id !== id);
        setRawInventory(nextRaw);
        saveInventoryToDb(nextRaw);
        logActivity('stock_adj', `Removed "${item.name}" from inventory.`, activityLog);
        showToast('Product deleted');
      },
    });
  };

  const handleSellItemToPos = (id: string) => {
    setActiveTab('orders');
    handleAddToCart(id);
  };

  // Bundles Handlers
  const handleSaveBundle = (
    type: 'same' | 'mixed',
    name: string,
    price: number,
    items: BundleItem[],
    editingId: string | null
  ) => {
    const nextBundles = [...bundles];
    if (editingId) {
      const idx = nextBundles.findIndex((b) => b.id === editingId);
      if (idx > -1) {
        nextBundles[idx] = {
          ...nextBundles[idx],
          type,
          name,
          price,
          items,
        };
        logActivity(
          'stock_adj',
          `Updated bundle "${name}" (Price: ₱${price.toFixed(2)})`,
          activityLog
        );
        showToast('Bundle updated successfully');
      }
    } else {
      nextBundles.push({
        id: 'BND-' + Date.now(),
        type,
        name,
        price,
        isActive: true,
        items,
      });
      logActivity(
        'stock_in',
        `Created bundle "${name}" (Price: ₱${price.toFixed(2)})`,
        activityLog
      );
      showToast('Bundle created');
    }
    setBundles(nextBundles);
    saveBundlesToDb(nextBundles);
  };

  const handleToggleBundleStatus = (id: string) => {
    const nextBundles = bundles.map((b) =>
      b.id === id ? { ...b, isActive: !b.isActive } : b
    );
    setBundles(nextBundles);
    saveBundlesToDb(nextBundles);
  };

  const handleDeleteBundle = (id: string) => {
    const b = bundles.find((x) => x.id === id);
    if (!b) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Bundle?',
      message: `Remove bundle "${b.name}"?`,
      proceedText: 'Delete',
      onProceed: () => {
        const next = bundles.filter((x) => x.id !== id);
        setBundles(next);
        saveBundlesToDb(next);
        logActivity('stock_adj', `Removed bundle "${b.name}".`, activityLog);
        showToast('Bundle deleted');
      },
    });
  };

  // POS Cart & Order Handlers
  const handleAddToCart = (itemId: string) => {
    const p = inventory.find((i) => i.id === itemId);
    if (!p || p.stockQty <= 0) return;

    const existing = cart.find((c) => c.id === itemId);
    if (existing) {
      if (existing.qty + 1 > p.stockQty) {
        showToast(`Max stock (${p.stockQty}) reached for ${p.name}`, 'error');
        return;
      }
      setCart((prev) =>
        prev.map((c) => (c.id === itemId ? { ...c, qty: c.qty + 1 } : c))
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          id: p.id,
          name: p.name,
          sellPrice: p.sellPrice,
          unitCost: p.unitCost,
          maxStock: p.stockQty,
          qty: 1,
        },
      ]);
    }
  };

  const handleUpdateCartQty = (itemId: string, delta: number) => {
    const item = cart.find((c) => c.id === itemId);
    if (!item) return;
    const p = inventory.find((i) => i.id === itemId);
    const maxQty = p ? p.stockQty : item.maxStock;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      setCart((prev) => prev.filter((c) => c.id !== itemId));
    } else if (newQty > maxQty) {
      showToast(`Only ${maxQty} available in stock`, 'error');
    } else {
      setCart((prev) =>
        prev.map((c) => (c.id === itemId ? { ...c, qty: newQty } : c))
      );
    }
  };

  const handleClearCart = () => {
    if (editingOrderId) {
      const origOrder = orders.find((o) => o.id === editingOrderId);
      if (origOrder) {
        const nextRaw = [...rawInventory];
        getOrderItems(origOrder).forEach((oi) => {
          const pIdx = nextRaw.findIndex((i) => i.id === oi.id);
          if (pIdx > -1) {
            nextRaw[pIdx] = {
              ...nextRaw[pIdx],
              stockQty: nextRaw[pIdx].stockQty - oi.qty,
            };
          }
        });
        setRawInventory(nextRaw);
      }
      setEditingOrderId(null);
      showToast('Order edit cancelled', 'info');
    }
    setCart([]);
    setPosCustomer('');
    setPosPaidFull(true);
    setPosPaidAmount('0.00');
    setIsCartModalOpen(false);
  };

  const handleEditOrder = (orderId: string) => {
    if (editingOrderId && editingOrderId !== orderId) {
      showToast('Please finish or cancel the current edit first', 'error');
      return;
    }
    if (editingOrderId === orderId) return;

    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const orderItems = getOrderItems(order);
    const nextRaw = [...rawInventory];
    orderItems.forEach((oi) => {
      const pIdx = nextRaw.findIndex((i) => i.id === oi.id);
      if (pIdx > -1) {
        nextRaw[pIdx] = {
          ...nextRaw[pIdx],
          stockQty: nextRaw[pIdx].stockQty + oi.qty,
        };
      }
    });
    setRawInventory(nextRaw);

    setEditingOrderId(order.id);
    setCart(
      orderItems.map((i) => {
        const inv = nextRaw.find((x) => x.id === i.id);
        return {
          id: i.id,
          name: i.name,
          qty: i.qty,
          sellPrice: i.sellPrice,
          unitCost: i.unitCost || 0,
          maxStock: inv ? inv.stockQty : i.qty,
        };
      })
    );
    setPosCustomer(order.customerName);
    setPosPaidFull(Boolean(order.isPaid));
    setPosPaidAmount((order.amountPaid || 0).toFixed(2));
    setIsCartModalOpen(true);
    showToast(`Editing Order for ${order.customerName}`, 'info');
  };

  const handleCheckoutCart = () => {
    if (cart.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }
    const customerName = posCustomer.trim() || 'Walk-in Customer';
    let amountPaid = parseFloat(posPaidAmount);
    if (isNaN(amountPaid) || amountPaid < 0) amountPaid = 0;

    const totalRevenue = cartCalc.total;
    if (posPaidFull || amountPaid >= totalRevenue) {
      amountPaid = totalRevenue;
    }
    const isPaid = amountPaid >= totalRevenue - 0.01;

    let totalCost = 0;
    const nextRaw = [...rawInventory];
    const orderItemsPayload: OrderItem[] = cartCalc.items.map((c) => {
      const pIdx = nextRaw.findIndex((i) => i.id === c.id);
      const currentCpp =
        pIdx > -1
          ? getProductHistoricalCPP(nextRaw[pIdx].name, bnplRecords, nextRaw[pIdx].unitCost)
          : c.unitCost;
      if (pIdx > -1) {
        nextRaw[pIdx] = {
          ...nextRaw[pIdx],
          stockQty: Math.max(0, nextRaw[pIdx].stockQty - c.qty),
        };
      }
      const lineCost = currentCpp * c.qty;
      const effectiveTotal = c.effectiveTotal !== undefined ? c.effectiveTotal : c.qty * c.sellPrice;
      totalCost += lineCost;
      return {
        id: c.id,
        name: c.name,
        qty: c.qty,
        sellPrice: c.sellPrice,
        unitCost: currentCpp,
        effectiveTotal,
        totalCost: lineCost,
        totalProfit: effectiveTotal - lineCost,
      };
    });

    const totalProfit = totalRevenue - totalCost;
    const nextOrders = [...orders];
    let savedOrder: Order;

    if (editingOrderId) {
      const idx = nextOrders.findIndex((o) => o.id === editingOrderId);
      const existing = idx > -1 ? nextOrders[idx] : null;
      savedOrder = {
        id: editingOrderId,
        customerName,
        date: existing ? existing.date : new Date().toLocaleString(),
        items: orderItemsPayload,
        totalRevenue,
        totalCost,
        totalProfit,
        amountPaid,
        isPaid,
        isReceived: existing ? existing.isReceived : false,
        status: existing ? existing.status : 'active',
        isEdited: true,
      };
      if (idx > -1) {
        nextOrders[idx] = savedOrder;
      } else {
        nextOrders.unshift(savedOrder);
      }
      logActivity(
        'sale',
        `Updated order ${editingOrderId} for "${customerName}" (Total: ₱${totalRevenue.toFixed(2)})`,
        activityLog
      );
      showToast('Order updated successfully');
      setEditingOrderId(null);
    } else {
      savedOrder = {
        id: 'ORD-' + Date.now().toString().slice(-6),
        customerName,
        date: new Date().toLocaleString(),
        items: orderItemsPayload,
        totalRevenue,
        totalCost,
        totalProfit,
        amountPaid,
        isPaid,
        isReceived: false,
        status: 'active',
      };
      nextOrders.unshift(savedOrder);
      logActivity(
        'sale',
        `New sale ${savedOrder.id} for "${customerName}" - Total: ₱${totalRevenue.toFixed(2)}`,
        activityLog
      );
      showToast('Sale completed!');
    }

    setRawInventory(nextRaw);
    setOrders(nextOrders);
    saveInventoryToDb(nextRaw);
    saveOrdersToDb(nextOrders);

    setCart([]);
    setPosCustomer('');
    setPosPaidFull(true);
    setPosPaidAmount('0.00');
    setIsCartModalOpen(false);
    setActiveReceiptOrder(savedOrder);
  };

  const handleToggleOrderPaid = (orderId: string) => {
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return;
    const o = orders[idx];
    const nextPaid = !o.isPaid;
    const updatedOrder: Order = {
      ...o,
      isPaid: nextPaid,
      amountPaid: nextPaid ? o.totalRevenue : 0,
    };
    const nextOrders = [...orders];
    nextOrders[idx] = updatedOrder;
    setOrders(nextOrders);
    saveOrdersToDb(nextOrders);
    showToast(
      `Order ${o.id} marked as ${nextPaid ? 'Paid' : 'Unpaid'}`,
      nextPaid ? 'success' : 'info'
    );
  };

  const handleToggleOrderReceived = (orderId: string) => {
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return;
    const o = orders[idx];
    const nextReceived = !o.isReceived;
    const updatedOrder: Order = {
      ...o,
      isReceived: nextReceived,
    };
    const nextOrders = [...orders];
    nextOrders[idx] = updatedOrder;
    setOrders(nextOrders);
    saveOrdersToDb(nextOrders);
    showToast(
      `Order ${o.id} marked as ${nextReceived ? 'Delivered' : 'Pending Delivery'}`,
      nextReceived ? 'success' : 'info'
    );
  };

  const handleCancelOrder = (orderId: string) => {
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return;
    const o = orders[idx];
    if (o.status === 'cancelled') return;

    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Order & Restore Stock?',
      message: `Cancel order ${o.id} for "${o.customerName}"? Items will be returned to inventory.`,
      proceedText: 'Void Order',
      onProceed: () => {
        const nextRaw = [...rawInventory];
        getOrderItems(o).forEach((item) => {
          const pIdx = nextRaw.findIndex((i) => i.id === item.id);
          if (pIdx > -1) {
            nextRaw[pIdx] = {
              ...nextRaw[pIdx],
              stockQty: nextRaw[pIdx].stockQty + item.qty,
            };
          }
        });
        const nextOrders = [...orders];
        nextOrders[idx] = { ...o, status: 'cancelled', isPaid: false, amountPaid: 0 };
        setRawInventory(nextRaw);
        setOrders(nextOrders);
        saveInventoryToDb(nextRaw);
        saveOrdersToDb(nextOrders);
        logActivity(
          'stock_adj',
          `Voided order ${o.id} for "${o.customerName}" and restored stock.`,
          activityLog
        );
        showToast('Order voided & stock restored', 'info');
      },
    });
  };

  const handleDeleteOrderPermanently = (orderId: string) => {
    const o = orders.find((x) => x.id === orderId);
    if (!o) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Order Permanently?',
      message: `Permanently delete order ${o.id} for "${o.customerName}"?`,
      proceedText: 'Delete Forever',
      onProceed: () => {
        const nextOrders = orders.filter((x) => x.id !== orderId);
        setOrders(nextOrders);
        saveOrdersToDb(nextOrders);
        showToast('Order deleted permanently');
      },
    });
  };

  // Accounts Payable / BNPL Handlers
  const handleLogSupplierPurchase = (payload: {
    supplier: string;
    purchaseDate: string;
    dueDate: string;
    batchNumber: string;
    prodName: string;
    qty: number;
    totalCost: number;
    notes: string;
    inventoryReceived: boolean;
  }) => {
    const newRecordId = 'AP-' + Date.now();
    const costPerPiece = payload.qty > 0 ? payload.totalCost / payload.qty : 0;

    const existingInv = rawInventory.find(
      (i) => i.name.toLowerCase().trim() === payload.prodName.toLowerCase().trim()
    );
    const sellingPrice = existingInv ? existingInv.sellPrice : 0;

    const newRecord: BnplRecord = {
      id: newRecordId,
      supplierName: payload.supplier,
      invoiceNumber: payload.batchNumber,
      purchaseDate: payload.purchaseDate,
      dueDate: payload.dueDate,
      notes: payload.notes,
      items: [
        {
          itemName: payload.prodName,
          qty: payload.qty,
          totalCost: payload.totalCost,
          costPerPiece,
          sellingPrice,
        },
      ],
      totalAmount: payload.totalCost,
      amountPaid: 0,
      payments: [],
      isReceived: payload.inventoryReceived,
      receivedDate: payload.inventoryReceived ? new Date().toLocaleString() : null,
      status: 'unpaid',
    };

    const nextBnpl = [newRecord, ...bnplRecords];
    const nextRaw = [...rawInventory];
    const nextStockHistory = [...stockHistory];

    if (payload.inventoryReceived) {
      const pIdx = nextRaw.findIndex(
        (i) => i.name.toLowerCase().trim() === payload.prodName.toLowerCase().trim()
      );
      if (pIdx > -1) {
        nextRaw[pIdx] = {
          ...nextRaw[pIdx],
          stockQty: nextRaw[pIdx].stockQty + payload.qty,
        };
      } else {
        nextRaw.push({
          id: 'PROD-' + Date.now(),
          name: payload.prodName,
          unitCost: costPerPiece,
          sellPrice: 0,
          stockQty: payload.qty,
          image: null,
        });
      }

      nextStockHistory.unshift({
        id: 'SH-' + Date.now(),
        productName: payload.prodName,
        qtyAdded: payload.qty,
        costPerItem: costPerPiece,
        totalCost: payload.totalCost,
        date: new Date().toLocaleString(),
      });
      setStockHistory(nextStockHistory);
      saveStockHistoryToDb(nextStockHistory);
    }

    const syncedRaw = withSyncedInventoryCPP(nextRaw, nextBnpl);
    setRawInventory(syncedRaw);
    setBnplRecords(nextBnpl);
    saveInventoryToDb(syncedRaw);
    saveBnplToDb(nextBnpl);

    logActivity(
      'stock_in',
      `Logged supplier purchase from "${payload.supplier}" (${payload.qty}x ${payload.prodName}, ₱${payload.totalCost.toFixed(2)})`,
      activityLog
    );
    showToast(`Recorded supplier purchase from ${payload.supplier}`);
  };

  const handleReceiveSupplierBatch = (id: string) => {
    const idx = bnplRecords.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const rec = bnplRecords[idx];
    if (rec.isReceived) return;

    const nextRaw = [...rawInventory];
    const nextStockHistory = [...stockHistory];

    (rec.items || []).forEach((line) => {
      const pIdx = nextRaw.findIndex(
        (i) => i.name.toLowerCase().trim() === line.itemName.toLowerCase().trim()
      );
      if (pIdx > -1) {
        nextRaw[pIdx] = {
          ...nextRaw[pIdx],
          stockQty: nextRaw[pIdx].stockQty + line.qty,
        };
      } else {
        nextRaw.push({
          id: 'PROD-' + Date.now() + Math.random().toString(36).slice(2, 5),
          name: line.itemName,
          unitCost: line.costPerPiece,
          sellPrice: line.sellingPrice || 0,
          stockQty: line.qty,
          image: null,
        });
      }

      nextStockHistory.unshift({
        id: 'SH-' + Date.now() + Math.random().toString(36).slice(2, 5),
        productName: line.itemName,
        qtyAdded: line.qty,
        costPerItem: line.costPerPiece,
        totalCost: line.totalCost,
        date: new Date().toLocaleString(),
      });
    });

    const nextBnpl = [...bnplRecords];
    nextBnpl[idx] = {
      ...rec,
      isReceived: true,
      receivedDate: new Date().toLocaleString(),
    };

    const syncedRaw = withSyncedInventoryCPP(nextRaw, nextBnpl);
    setRawInventory(syncedRaw);
    setStockHistory(nextStockHistory);
    setBnplRecords(nextBnpl);
    saveInventoryToDb(syncedRaw);
    saveStockHistoryToDb(nextStockHistory);
    saveBnplToDb(nextBnpl);
    showToast(`Batch from ${rec.supplierName} received into inventory!`);
  };

  const handleSubmitApPayment = (recordId: string, amount: number) => {
    const idx = bnplRecords.findIndex((r) => r.id === recordId);
    if (idx === -1) return;
    const rec = { ...bnplRecords[idx] };
    const remaining = Math.max(0, rec.totalAmount - (rec.amountPaid || 0));
    const payAmt = Math.min(amount, remaining);

    const newPaid = (rec.amountPaid || 0) + payAmt;
    rec.amountPaid = newPaid;
    rec.status =
      newPaid >= rec.totalAmount - 0.01
        ? 'fully_paid'
        : newPaid > 0
        ? 'partially_paid'
        : 'unpaid';
    rec.payments = [
      ...(rec.payments || []),
      {
        date: new Date().toLocaleString(),
        amount: payAmt,
      },
    ];

    const nextBnpl = [...bnplRecords];
    nextBnpl[idx] = rec;
    setBnplRecords(nextBnpl);
    saveBnplToDb(nextBnpl);
    logActivity(
      'stock_adj',
      `Paid ₱${payAmt.toFixed(2)} to "${rec.supplierName}"`,
      activityLog
    );
    showToast(`Paid ₱${payAmt.toFixed(2)} to ${rec.supplierName}`);
    setApPaymentRecord(null);
  };

  const handleSaveEditedSupplierInvoice = (payload: {
    id: string;
    supplierName: string;
    invoiceNumber: string;
    purchaseDate: string;
    dueDate: string;
    notes: string;
  }) => {
    const idx = bnplRecords.findIndex((r) => r.id === payload.id);
    if (idx === -1) return;
    const nextBnpl = [...bnplRecords];
    nextBnpl[idx] = {
      ...nextBnpl[idx],
      supplierName: payload.supplierName,
      invoiceNumber: payload.invoiceNumber,
      purchaseDate: payload.purchaseDate,
      dueDate: payload.dueDate,
      notes: payload.notes,
    };
    setBnplRecords(nextBnpl);
    saveBnplToDb(nextBnpl);
    logActivity(
      'stock_adj',
      `Updated supplier invoice details for "${payload.supplierName}".`,
      activityLog
    );
    showToast('Invoice updated');
    setEditingSupplierRecord(null);
  };

  const handleDeleteSupplierInvoice = (id: string) => {
    const rec = bnplRecords.find((r) => r.id === id);
    if (!rec) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Supplier Invoice & Rollback Stock?',
      message: `Deleting this invoice from "${rec.supplierName}" will also deduct received quantities from inventory and recalculate CPP.`,
      proceedText: 'Delete & Rollback',
      onProceed: () => {
        const nextRaw = [...rawInventory];
        if (rec.isReceived) {
          (rec.items || []).forEach((line) => {
            const pIdx = nextRaw.findIndex(
              (i) => i.name.toLowerCase().trim() === line.itemName.toLowerCase().trim()
            );
            if (pIdx > -1) {
              nextRaw[pIdx] = {
                ...nextRaw[pIdx],
                stockQty: Math.max(0, nextRaw[pIdx].stockQty - line.qty),
              };
            }
          });
        }

        const nextBnpl = bnplRecords.filter((r) => r.id !== id);
        const syncedRaw = withSyncedInventoryCPP(nextRaw, nextBnpl);

        setRawInventory(syncedRaw);
        setBnplRecords(nextBnpl);
        saveInventoryToDb(syncedRaw);
        saveBnplToDb(nextBnpl);

        logActivity(
          'stock_adj',
          `Deleted supplier invoice from "${rec.supplierName}" (₱${rec.totalAmount.toFixed(2)}).`,
          activityLog
        );
        showToast('Invoice deleted & stock rolled back');
      },
    });
  };

  // Exports
  const handleBackupDatabase = () => {
    exportDatabaseBackupJSON({
      inventory,
      orders,
      bundles,
      bnplRecords,
      cashAdjustments,
      stockHistory,
      activityLog,
    });
    showToast('Full database backup downloaded');
  };

  const handleExportCSV = () => {
    const ok = exportOrdersToCSV(orders);
    if (!ok) {
      showToast('No orders to export', 'error');
    } else {
      showToast('Orders exported to CSV');
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} />

      {!isAuthenticated ? (
        <AuthScreen
          onLogin={handleLogin}
          onGoogleLogin={handleGoogleLogin}
          onPasswordReset={handlePasswordReset}
        />
      ) : (
        <div
          id="app-container"
          ref={mainScrollRef}
          onScroll={handleMainScroll}
          className="flex flex-col flex-1 h-full overflow-y-auto"
        >
          <Header
            activeTab={activeTab}
            isDark={isDark}
            onSwitchTab={setActiveTab}
            onOpenCalculator={() => setIsCalculatorOpen((o) => !o)}
            onToggleTheme={() => setIsDark((d) => !d)}
            onExportData={handleBackupDatabase}
            onLogout={handleLogout}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 md:pb-12 max-w-[1600px] w-full mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                summary={summaryMetrics}
                activityLog={activityLog}
                onOpenFinancialModal={setFinancialModalType}
                onOpenDashboardModal={setDashboardModalType}
                onClearActivityLog={handleClearActivityLog}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryView
                inventory={inventory}
                bnplRecords={bnplRecords}
                sortStack={inventorySortStack}
                onToggleSort={(col, isShift) =>
                  setInventorySortStack((prev) => toggleMultiColumnSort(prev, col, isShift))
                }
                onRegisterProduct={handleRegisterProduct}
                onEditStock={(id) => {
                  const found = inventory.find((i) => i.id === id) || null;
                  setEditingInventoryItem(found);
                }}
                onDeleteStock={handleDeleteStock}
                onOpenRejectModal={(id) => {
                  const found = inventory.find((i) => i.id === id) || null;
                  setRejectSourceItem(found);
                }}
                onOpenStockHistoryModal={() => setIsStockHistoryOpen(true)}
                onSellItemToPos={handleSellItemToPos}
              />
            )}

            {activeTab === 'bundles' && (
              <BundlesView
                inventory={inventory}
                bundles={bundles}
                sortStack={bundleSortStack}
                onToggleSort={(col, isShift) =>
                  setBundleSortStack((prev) => toggleMultiColumnSort(prev, col, isShift))
                }
                onSaveBundle={handleSaveBundle}
                onToggleBundleStatus={handleToggleBundleStatus}
                onDeleteBundle={handleDeleteBundle}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'orders' && (
              <PosView
                inventory={inventory}
                orders={orders}
                bundles={bundles}
                cart={cart}
                editingOrderId={editingOrderId}
                posCustomer={posCustomer}
                setPosCustomer={setPosCustomer}
                posPaidAmount={posPaidAmount}
                setPosPaidAmount={setPosPaidAmount}
                posPaidFull={posPaidFull}
                setPosPaidFull={setPosPaidFull}
                isCartModalOpen={isCartModalOpen}
                setIsCartModalOpen={setIsCartModalOpen}
                isFabScrollHidden={isFabScrollHidden}
                orderSortStack={orderSortStack}
                onToggleOrderSort={(col, isShift) =>
                  setOrderSortStack((prev) => toggleMultiColumnSort(prev, col, isShift))
                }
                onAddToCart={handleAddToCart}
                onUpdateCartQty={handleUpdateCartQty}
                onClearCart={handleClearCart}
                onCheckoutCart={handleCheckoutCart}
                onToggleOrderPaid={handleToggleOrderPaid}
                onToggleOrderReceived={handleToggleOrderReceived}
                onEditOrder={handleEditOrder}
                onCancelOrder={handleCancelOrder}
                onDeleteOrderPermanently={handleDeleteOrderPermanently}
                onGenerateReceipt={(orderId) => {
                  const found = orders.find((o) => o.id === orderId) || null;
                  setActiveReceiptOrder(found);
                }}
                onExportCSV={handleExportCSV}
              />
            )}

            {activeTab === 'bnpl' && (
              <BnplView
                inventory={inventory}
                orders={orders}
                bnplRecords={bnplRecords}
                stockHistory={stockHistory}
                cashAdjustments={cashAdjustments}
                sortStack={bnplSortStack}
                onToggleSort={(col, isShift) =>
                  setBnplSortStack((prev) => toggleMultiColumnSort(prev, col, isShift))
                }
                onLogSupplierPurchase={handleLogSupplierPurchase}
                onReceiveSupplierBatch={handleReceiveSupplierBatch}
                onOpenApPaymentModal={(id) => {
                  const found = bnplRecords.find((b) => b.id === id) || null;
                  setApPaymentRecord(found);
                }}
                onViewPaymentHistory={(id) => {
                  const found = bnplRecords.find((b) => b.id === id) || null;
                  setPaymentHistoryRecord(found);
                }}
                onOpenSupplierPurchaseEdit={(id) => {
                  const found = bnplRecords.find((b) => b.id === id) || null;
                  setEditingSupplierRecord(found);
                }}
                onDeleteSupplierPurchase={handleDeleteSupplierInvoice}
                onOpenSubtractCashModal={() => setIsSubtractCashOpen(true)}
                onOpenCashHistoryModal={() => setIsCashHistoryOpen(true)}
                onShowToast={showToast}
              />
            )}
          </main>

          <MobileBottomNav activeTab={activeTab} onSwitchTab={setActiveTab} />
        </div>
      )}

      {/* Modals */}
      <CalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      <SubtractCashModal
        isOpen={isSubtractCashOpen}
        availableCash={liquidCash.availableLiquidCash}
        onClose={() => setIsSubtractCashOpen(false)}
        onSubmit={handleSubtractCash}
      />

      <CashHistoryModal
        isOpen={isCashHistoryOpen}
        cashAdjustments={cashAdjustments}
        onClose={() => setIsCashHistoryOpen(false)}
        onUndoCashAdjustment={handleUndoCashAdjustment}
      />

      <FinancialDetailsModal
        type={financialModalType}
        timeframe={timeframe}
        orders={orders}
        inventory={inventory}
        stockHistory={stockHistory}
        bnplRecords={bnplRecords}
        onClose={() => setFinancialModalType(null)}
      />

      <StockHistoryModal
        isOpen={isStockHistoryOpen}
        stockHistory={stockHistory}
        onClose={() => setIsStockHistoryOpen(false)}
      />

      <DashboardProductsModal
        type={dashboardModalType}
        inventory={inventory}
        onClose={() => setDashboardModalType(null)}
      />

      <EditStockModal
        item={editingInventoryItem}
        bnplRecords={bnplRecords}
        onClose={() => setEditingInventoryItem(null)}
        onSave={handleSaveEditedStock}
        onErrorToast={(msg) => showToast(msg, 'error')}
      />

      <RejectStockModal
        sourceItem={rejectSourceItem}
        onClose={() => setRejectSourceItem(null)}
        onSubmit={handleSeparateDefectiveStock}
      />

      <ReceiptModal
        order={activeReceiptOrder}
        inventory={inventory}
        onClose={() => setActiveReceiptOrder(null)}
        onToast={showToast}
      />

      <ApPaymentModal
        record={apPaymentRecord}
        onClose={() => setApPaymentRecord(null)}
        onSubmit={handleSubmitApPayment}
      />

      <PaymentHistoryModal
        record={paymentHistoryRecord}
        onClose={() => setPaymentHistoryRecord(null)}
      />

      <EditSupplierInvoiceModal
        record={editingSupplierRecord}
        onClose={() => setEditingSupplierRecord(null)}
        onSave={handleSaveEditedSupplierInvoice}
      />

      <ConfirmationModal
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />
    </>
  );
}
