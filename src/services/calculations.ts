import {
  InventoryItem,
  Order,
  OrderItem,
  Bundle,
  CartItem,
  CartCalculation,
  BnplRecord,
  CashAdjustment,
  StockHistoryEntry,
  SortEntry,
  Timeframe,
  OrderTab,
  ApFilter,
  SummaryMetrics,
  LiquidCashMetrics,
} from '../types';

export function getOrderItems(order: Order): OrderItem[] {
  if (order.items && Array.isArray(order.items)) return order.items;
  const qty = order.orderQty || 1;
  return [
    {
      id: order.itemId || 'legacy-id',
      name: order.itemName || 'Unknown Product',
      qty,
      sellPrice: (order.totalRevenue / qty) || 0,
      unitCost: (order.totalCost / qty) || 0,
      effectiveTotal: order.totalRevenue || 0,
      totalCost: order.totalCost || 0,
      totalProfit: order.totalProfit || 0,
    },
  ];
}

export function getProductHistoricalCPP(
  productName: string,
  bnplRecords: BnplRecord[],
  fallbackUnitCost = 0
): number {
  if (!productName) return fallbackUnitCost;
  let totalCostSum = 0;
  let totalQtySum = 0;
  const target = productName.toLowerCase().trim();

  bnplRecords.forEach((record) => {
    if (record.items && Array.isArray(record.items)) {
      record.items.forEach((bItem) => {
        if (bItem.itemName && bItem.itemName.toLowerCase().trim() === target) {
          totalCostSum += parseFloat(String(bItem.totalCost)) || 0;
          totalQtySum += parseInt(String(bItem.qty), 10) || 0;
        }
      });
    }
  });

  if (totalQtySum > 0) {
    return totalCostSum / totalQtySum;
  }
  return fallbackUnitCost || 0;
}

export function withSyncedInventoryCPP(
  inventory: InventoryItem[],
  bnplRecords: BnplRecord[]
): InventoryItem[] {
  return inventory.map((item) => ({
    ...item,
    unitCost: getProductHistoricalCPP(item.name, bnplRecords, item.unitCost),
  }));
}

export function isWithinTimeframe(dateStr: string | undefined, tf: Timeframe): boolean {
  if (tf === 'all') return true;
  if (!dateStr || dateStr === 'N/A') return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return true;
  const now = new Date();
  if (tf === 'today') return date.toDateString() === now.toDateString();
  if (tf === 'week') {
    const n1 = new Date();
    const firstDay = new Date(n1.setDate(n1.getDate() - n1.getDay()));
    const n2 = new Date();
    n2.setHours(23, 59, 59, 999);
    const lastDay = new Date(n2.setDate(n2.getDate() - n2.getDay() + 6));
    return date >= firstDay && date <= lastDay;
  }
  if (tf === 'month') {
    const current = new Date();
    return date.getMonth() === current.getMonth() && date.getFullYear() === current.getFullYear();
  }
  return true;
}

export function toggleMultiColumnSort(
  prevStack: SortEntry[],
  col: string,
  isShift: boolean
): SortEntry[] {
  const stack = prevStack.map((item) => ({ ...item }));
  const existingIndex = stack.findIndex((item) => item.col === col);
  if (isShift) {
    if (existingIndex < 0) {
      stack.push({ col, dir: 'asc' });
    } else if (stack[existingIndex].dir === 'asc') {
      stack[existingIndex].dir = 'desc';
    } else {
      stack.splice(existingIndex, 1);
    }
  } else {
    if (existingIndex === 0 && stack.length === 1) {
      if (stack[0].dir === 'asc') {
        stack[0].dir = 'desc';
      } else {
        stack.length = 0;
      }
    } else {
      stack.length = 0;
      stack.push({ col, dir: 'asc' });
    }
  }
  return stack;
}

export function getSortedInventory(
  inventory: InventoryItem[],
  bnplRecords: BnplRecord[],
  inventorySortStack: SortEntry[]
): InventoryItem[] {
  const sorted = [...inventory];
  if (inventorySortStack.length > 0) {
    sorted.sort((a, b) => {
      for (const sortObj of inventorySortStack) {
        const { col, dir } = sortObj;
        const dirMod = dir === 'asc' ? 1 : -1;
        let diff = 0;

        const cppA = getProductHistoricalCPP(a.name, bnplRecords, a.unitCost);
        const cppB = getProductHistoricalCPP(b.name, bnplRecords, b.unitCost);

        if (col === 'name') diff = a.name.localeCompare(b.name);
        else if (col === 'stock') diff = (a.stockQty || 0) - (b.stockQty || 0);
        else if (col === 'cpp') diff = cppA - cppB;
        else if (col === 'price') diff = (a.sellPrice || 0) - (b.sellPrice || 0);
        else if (col === 'profit') diff = (a.sellPrice || 0) - cppA - ((b.sellPrice || 0) - cppB);
        else if (col === 'margin') {
          const mA = a.sellPrice > 0 ? (a.sellPrice - cppA) / a.sellPrice : 0;
          const mB = b.sellPrice > 0 ? (b.sellPrice - cppB) / b.sellPrice : 0;
          diff = mA - mB;
        } else if (col === 'value') {
          diff = (a.stockQty || 0) * cppA - (b.stockQty || 0) * cppB;
        }

        if (diff !== 0) return diff * dirMod;
      }
      return 0;
    });
  }
  return sorted;
}

export function getSortedBundles(
  bundles: Bundle[],
  bundleSortStack: SortEntry[]
): Bundle[] {
  const sorted = [...bundles];
  sorted.sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }

    if (bundleSortStack.length > 0) {
      for (const sortObj of bundleSortStack) {
        const { col, dir } = sortObj;
        const dirMod = dir === 'asc' ? 1 : -1;
        let diff = 0;

        if (col === 'name') diff = a.name.localeCompare(b.name);
        else if (col === 'includes') {
          const strA = (a.items || []).map((i) => `${i.qty}x ${i.name}`).join(', ');
          const strB = (b.items || []).map((i) => `${i.qty}x ${i.name}`).join(', ');
          diff = strA.localeCompare(strB);
        } else if (col === 'price') diff = (a.price || 0) - (b.price || 0);
        else if (col === 'status') diff = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);

        if (diff !== 0) return diff * dirMod;
      }
    }
    return 0;
  });
  return sorted;
}

export function calculateCart(cart: CartItem[], bundles: Bundle[]): CartCalculation {
  const cartSnapshot: CartItem[] = JSON.parse(JSON.stringify(cart));
  let savings = 0;
  const appliedBundles: { name: string; times: number; save: number }[] = [];
  let total = 0;

  cartSnapshot.forEach((item) => {
    item.remainingQty = item.qty;
    item.discountedAmount = 0;
  });

  const activeBundles = bundles.filter((b) => b.isActive);
  const sameItemBundles = activeBundles
    .filter((b) => b.type === 'same' && b.items && b.items.length > 0)
    .sort((a, b) => b.items[0].qty - a.items[0].qty);
  const mixedBundles = activeBundles.filter((b) => b.type === 'mixed');

  mixedBundles.forEach((bundle) => {
    let possibleApps = Infinity;
    (bundle.items || []).forEach((bi) => {
      const cItem = cartSnapshot.find((c) => c.id === bi.itemId);
      if (!cItem) possibleApps = 0;
      else possibleApps = Math.min(possibleApps, Math.floor((cItem.remainingQty || 0) / bi.qty));
    });
    if (possibleApps > 0 && possibleApps !== Infinity) {
      let regCost = 0;
      const itemsInvolved: { item: CartItem; part: number }[] = [];
      (bundle.items || []).forEach((bi) => {
        const cItem = cartSnapshot.find((c) => c.id === bi.itemId)!;
        cItem.remainingQty = (cItem.remainingQty || 0) - bi.qty * possibleApps;
        const costPart = bi.qty * possibleApps * cItem.sellPrice;
        regCost += costPart;
        itemsInvolved.push({ item: cItem, part: costPart });
      });
      const bCost = bundle.price * possibleApps;
      const save = regCost - bCost;
      if (save > 0) {
        savings += save;
        appliedBundles.push({ name: bundle.name, times: possibleApps, save });
        itemsInvolved.forEach((inv) => {
          inv.item.discountedAmount = (inv.item.discountedAmount || 0) + save * (inv.part / regCost);
        });
      }
    }
  });

  sameItemBundles.forEach((bundle) => {
    const bi = bundle.items[0];
    const cItem = cartSnapshot.find((c) => c.id === bi.itemId);
    if (cItem && (cItem.remainingQty || 0) >= bi.qty) {
      const apps = Math.floor((cItem.remainingQty || 0) / bi.qty);
      const regCost = apps * bi.qty * cItem.sellPrice;
      const bCost = apps * bundle.price;
      const save = regCost - bCost;
      if (save > 0) {
        cItem.remainingQty = (cItem.remainingQty || 0) - apps * bi.qty;
        savings += save;
        appliedBundles.push({ name: bundle.name, times: apps, save });
        cItem.discountedAmount = (cItem.discountedAmount || 0) + save;
      }
    }
  });

  cartSnapshot.forEach((item) => {
    item.effectiveTotal = item.qty * item.sellPrice - (item.discountedAmount || 0);
    item.effectivePrice = item.effectiveTotal / item.qty;
    total += item.effectiveTotal;
  });

  return { total, savings, appliedBundles, items: cartSnapshot };
}

export function getFilteredOrders(
  orders: Order[],
  currentOrderTab: OrderTab,
  searchQuery: string,
  orderSortStack: SortEntry[]
): Order[] {
  let filtered = [...orders];

  switch (currentOrderTab) {
    case 'cancelled':
      filtered = filtered.filter((o) => o.status === 'cancelled');
      break;
    case 'active':
      filtered = filtered.filter((o) => o.status !== 'cancelled' && !o.isPaid);
      break;
    case 'completed':
      filtered = filtered.filter((o) => o.status !== 'cancelled' && o.isPaid);
      break;
    case 'all':
    default:
      filtered = filtered.filter((o) => o.status !== 'cancelled');
      break;
  }

  const searchVal = searchQuery.trim().toLowerCase();
  if (searchVal) {
    filtered = filtered.filter((o) => {
      const itemsMatch = getOrderItems(o).some((i) => i.name.toLowerCase().includes(searchVal));
      return (
        o.id.toLowerCase().includes(searchVal) ||
        (o.customerName || '').toLowerCase().includes(searchVal) ||
        itemsMatch
      );
    });
  }

  filtered.sort((a, b) => {
    if (orderSortStack.length > 0) {
      for (const sortObj of orderSortStack) {
        const { col, dir } = sortObj;
        const dirMod = dir === 'asc' ? 1 : -1;
        let diff = 0;

        if (col === 'customer') diff = (a.customerName || '').localeCompare(b.customerName || '');
        else if (col === 'date') diff = new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
        else if (col === 'total') diff = (a.totalRevenue || 0) - (b.totalRevenue || 0);
        else if (col === 'payment') diff = (a.isPaid ? 1 : 0) - (b.isPaid ? 1 : 0);
        else if (col === 'delivery') diff = (a.isReceived ? 1 : 0) - (b.isReceived ? 1 : 0);

        if (diff !== 0) return diff * dirMod;
      }
      return 0;
    }

    const aUnpaid = !a.isPaid && a.status !== 'cancelled' ? 0 : 1;
    const bUnpaid = !b.isPaid && b.status !== 'cancelled' ? 0 : 1;

    if (aUnpaid !== bUnpaid) {
      return aUnpaid - bUnpaid;
    }

    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    if (dateA !== dateB) {
      return dateB - dateA;
    }

    return b.id.localeCompare(a.id);
  });

  return filtered;
}

export function getSortedBnplRecords(
  bnplRecords: BnplRecord[],
  currentApFilter: ApFilter,
  searchQuery: string,
  bnplSortStack: SortEntry[]
): BnplRecord[] {
  let filtered = [...bnplRecords];
  if (currentApFilter === 'unpaid') filtered = filtered.filter((b) => b.status === 'unpaid');
  else if (currentApFilter === 'partial') filtered = filtered.filter((b) => b.status === 'partially_paid');
  else if (currentApFilter === 'paid') filtered = filtered.filter((b) => b.status === 'fully_paid');

  const searchVal = searchQuery.trim().toLowerCase();
  if (searchVal) {
    filtered = filtered.filter((b) => {
      const supplierMatch = (b.supplierName || '').toLowerCase().includes(searchVal);
      const invoiceMatch = (b.invoiceNumber || '').toLowerCase().includes(searchVal);
      const itemsMatch = (b.items || []).some((i) => i.itemName.toLowerCase().includes(searchVal));
      return supplierMatch || invoiceMatch || itemsMatch;
    });
  }

  filtered.sort((a, b) => {
    const aUnpaid = a.status !== 'fully_paid' ? 0 : 1;
    const bUnpaid = b.status !== 'fully_paid' ? 0 : 1;
    if (aUnpaid !== bUnpaid) {
      return aUnpaid - bUnpaid;
    }

    if (bnplSortStack.length > 0) {
      for (const sortObj of bnplSortStack) {
        const { col, dir } = sortObj;
        const dirMod = dir === 'asc' ? 1 : -1;
        let diff = 0;

        if (col === 'supplier') diff = (a.supplierName || '').localeCompare(b.supplierName || '');
        else if (col === 'date')
          diff = new Date(a.purchaseDate || 0).getTime() - new Date(b.purchaseDate || 0).getTime();
        else if (col === 'product') {
          const strA = (a.items || []).map((i) => i.itemName).join(', ');
          const strB = (b.items || []).map((i) => i.itemName).join(', ');
          diff = strA.localeCompare(strB);
        } else if (col === 'financials') diff = (a.totalAmount || 0) - (b.totalAmount || 0);
        else if (col === 'status') diff = (a.status || '').localeCompare(b.status || '');

        if (diff !== 0) return diff * dirMod;
      }
    }

    return new Date(b.purchaseDate || 0).getTime() - new Date(a.purchaseDate || 0).getTime();
  });

  return filtered;
}

export function calculateLiquidCash(
  orders: Order[],
  bnplRecords: BnplRecord[],
  cashAdjustments: CashAdjustment[]
): LiquidCashMetrics {
  let pool = 0;
  orders.forEach((o) => {
    if (o.status !== 'cancelled') pool += o.amountPaid || 0;
  });

  let totalApPaid = 0;
  let totalApUnpaid = 0;
  bnplRecords.forEach((b) => {
    totalApPaid += b.amountPaid || 0;
    totalApUnpaid += b.totalAmount - (b.amountPaid || 0);
  });

  const systemLiquidCash = pool - totalApPaid;

  let activeManualCashUsed = 0;
  cashAdjustments.forEach((adj) => {
    if (adj.status === 'active' && adj.type === 'withdrawal') {
      activeManualCashUsed += parseFloat(String(adj.amount)) || 0;
    }
  });

  const availableLiquidCash = systemLiquidCash - activeManualCashUsed;

  return {
    systemLiquidCash,
    activeManualCashUsed,
    availableLiquidCash,
    totalApPaid,
    totalApUnpaid,
  };
}

export function calculateSummaryMetrics(
  inventory: InventoryItem[],
  orders: Order[],
  stockHistory: StockHistoryEntry[],
  bnplRecords: BnplRecord[],
  dashboardTimeframe: Timeframe
): SummaryMetrics {
  let revenue = 0;
  let profit = 0;
  let totalSpent = 0;
  let completedOrdersCount = 0;
  let completedOrdersTotalValue = 0;

  const validOrders = orders.filter(
    (o) => o.status !== 'cancelled' && isWithinTimeframe(o.date, dashboardTimeframe)
  );
  validOrders.forEach((o) => {
    revenue += o.totalRevenue;
    if (o.isPaid === true && o.isReceived === true) {
      completedOrdersCount++;
      completedOrdersTotalValue += o.totalRevenue;
      if (o.totalProfit !== undefined) {
        profit += o.totalProfit;
      } else {
        profit += o.totalRevenue - (o.totalCost || 0);
      }
    }
  });

  let pendingBalance = 0;
  orders.forEach((o) => {
    if (o.status !== 'cancelled') pendingBalance += o.totalRevenue - (o.amountPaid || 0);
  });

  const activeStockHistory = stockHistory.filter((sh) =>
    isWithinTimeframe(sh.date, dashboardTimeframe)
  );
  activeStockHistory.forEach((sh) => {
    totalSpent += sh.totalCost || 0;
  });

  let inventoryVal = 0;
  let expectedSalesVal = 0;
  let expectedProfitVal = 0;
  const totalProductsCount = inventory.length;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  inventory.forEach((i) => {
    const currentStock = i.stockQty || 0;
    const avgCPP = getProductHistoricalCPP(i.name, bnplRecords, i.unitCost);
    const price = i.sellPrice || 0;

    inventoryVal += currentStock * avgCPP;
    expectedSalesVal += currentStock * price;
    expectedProfitVal += currentStock * (price - avgCPP);

    if (currentStock <= 0) outOfStockCount++;
    else if (currentStock <= 3) lowStockCount++;
  });

  const spentDivisor = totalSpent || inventoryVal;
  const roi = spentDivisor > 0 ? (profit / spentDivisor) * 100 : 0;

  return {
    revenue,
    profit,
    roi,
    completedOrdersCount,
    completedOrdersTotalValue,
    pendingBalance,
    inventoryVal,
    totalSpent,
    expectedSalesVal,
    expectedProfitVal,
    totalProductsCount,
    lowStockCount,
    outOfStockCount,
  };
}
