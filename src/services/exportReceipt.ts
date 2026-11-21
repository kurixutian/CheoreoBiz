import {
  InventoryItem,
  Order,
  Bundle,
  StockHistoryEntry,
  ActivityLogEntry,
  BnplRecord,
  CashAdjustment,
} from '../types';
import { getOrderItems } from './calculations';

export function resizeProductImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 300;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function renderAndDownloadReceiptImage(
  order: Order,
  inventory: InventoryItem[]
): Promise<void> {
  const items = getOrderItems(order);

  const imagePromises = items.map((i) => {
    return new Promise<{ name: string; img: HTMLImageElement | null }>((resolve) => {
      const matchedInv = inventory.find(
        (inv) => inv.name.toLowerCase().trim() === i.name.toLowerCase().trim()
      );
      if (matchedInv && matchedInv.image) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve({ name: i.name, img });
        img.onerror = () => resolve({ name: i.name, img: null });
        img.src = matchedInv.image;
      } else {
        resolve({ name: i.name, img: null });
      }
    });
  });

  const loadedImages = await Promise.all(imagePromises);
  const imageMap: Record<string, HTMLImageElement | null> = {};
  loadedImages.forEach((item) => {
    imageMap[item.name] = item.img;
  });

  let origSubtotal = 0;
  items.forEach((i) => {
    origSubtotal += i.qty * (i.sellPrice || 0);
  });
  const totalSavings = order.totalRevenue < origSubtotal ? origSubtotal - order.totalRevenue : 0;
  const paidVal =
    order.amountPaid !== undefined ? order.amountPaid : order.isPaid ? order.totalRevenue : 0;
  const change = Math.max(0, paidVal - order.totalRevenue);
  const balDue = Math.max(0, order.totalRevenue - paidVal);
  const statusLine =
    order.status === 'cancelled'
      ? 'VOID / CANCELLED'
      : order.isPaid
      ? 'PAID IN FULL'
      : paidVal > 0
      ? 'PARTIAL PAYMENT'
      : 'UNPAID';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const width = 480;
  const padding = 24;
  const calculatedHeight = 440 + items.length * 52 + (totalSavings > 0.01 ? 36 : 0);

  canvas.width = width * 2;
  canvas.height = calculatedHeight * 2;

  ctx.scale(2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, calculatedHeight);

  let y = 32;
  ctx.fillStyle = '#0f172a';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(width / 2 - 20, y, 40, 40, 12);
    ctx.fill();
  } else {
    ctx.fillRect(width / 2 - 20, y, 40, 40);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 14px Manrope, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CB', width / 2, y + 25);

  y += 52;
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 18px Manrope, monospace';
  ctx.fillText('CHEOREOBIZ LEDGER', width / 2, y);

  y += 18;
  ctx.fillStyle = '#64748b';
  ctx.font = '700 10px Manrope, monospace';
  ctx.fillText('OFFICIAL DIGITAL SALES RECEIPT', width / 2, y);

  y += 14;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();

  y += 22;
  ctx.textAlign = 'left';
  ctx.font = '500 11px Manrope, monospace';
  ctx.fillStyle = '#475569';
  ctx.fillText('Receipt ID:', padding, y);
  ctx.textAlign = 'right';
  ctx.font = '700 11px Manrope, monospace';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(order.id, width - padding, y);

  y += 18;
  ctx.textAlign = 'left';
  ctx.font = '500 11px Manrope, monospace';
  ctx.fillStyle = '#475569';
  ctx.fillText('Date & Time:', padding, y);
  ctx.textAlign = 'right';
  ctx.font = '700 11px Manrope, monospace';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(order.date || 'N/A', width - padding, y);

  y += 18;
  ctx.textAlign = 'left';
  ctx.font = '500 11px Manrope, monospace';
  ctx.fillStyle = '#475569';
  ctx.fillText('Cashier:', padding, y);
  ctx.textAlign = 'right';
  ctx.font = '700 11px Manrope, monospace';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('Admin Ledger', width - padding, y);

  y += 18;
  ctx.textAlign = 'left';
  ctx.font = '500 11px Manrope, monospace';
  ctx.fillStyle = '#475569';
  ctx.fillText('Customer Name:', padding, y);
  ctx.textAlign = 'right';
  ctx.font = '700 11px Manrope, monospace';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(order.customerName, width - padding, y);

  y += 14;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();

  y += 20;
  ctx.textAlign = 'left';
  ctx.font = '900 10px Manrope, monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('PRODUCT LIST', padding, y);

  items.forEach((i) => {
    y += 10;
    const lineOrig = i.qty * (i.sellPrice || 0);
    const img = imageMap[i.name];

    if (img) {
      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(padding, y, 32, 32, 8);
      else ctx.rect(padding, y, 32, 32);
      ctx.clip();
      ctx.drawImage(img, padding, y, 32, 32);
      ctx.restore();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(padding, y, 32, 32, 8);
      else ctx.rect(padding, y, 32, 32);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ecfdf5';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(padding, y, 32, 32, 8);
      else ctx.rect(padding, y, 32, 32);
      ctx.fill();
      ctx.fillStyle = '#059669';
      ctx.font = '900 11px Manrope, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(i.name.substring(0, 2).toUpperCase(), padding + 16, y + 20);
    }

    ctx.textAlign = 'left';
    ctx.font = '700 12px Manrope, monospace';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(i.name, padding + 42, y + 14);

    ctx.font = '500 10px Manrope, monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`${i.qty} pcs x ₱${(i.sellPrice || 0).toFixed(2)}`, padding + 42, y + 28);

    ctx.textAlign = 'right';
    ctx.font = '600 12px Manrope, monospace';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(`₱${lineOrig.toFixed(2)}`, width - padding, y + 16);

    y += 34;
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  y += 12;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();

  y += 18;
  ctx.textAlign = 'left';
  ctx.font = '600 11px Manrope, monospace';
  ctx.fillStyle = '#475569';
  ctx.fillText('Original Total:', padding, y);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`₱${origSubtotal.toFixed(2)}`, width - padding, y);

  y += 18;
  ctx.textAlign = 'left';
  ctx.font = '600 11px Manrope, monospace';
  ctx.fillStyle = '#475569';
  ctx.fillText('Bundle Discount / Promo Discount:', padding, y);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('-₱0.00', width - padding, y);

  if (totalSavings > 0.01) {
    y += 18;
    ctx.textAlign = 'left';
    ctx.font = '700 11px Manrope, monospace';
    ctx.fillStyle = '#059669';
    ctx.fillText('Total Savings:', padding, y);
    ctx.textAlign = 'right';
    ctx.fillText(`-₱${totalSavings.toFixed(2)}`, width - padding, y);

    y += 20;
    ctx.fillStyle = '#ecfdf5';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(padding, y - 12, width - padding * 2, 24, 8);
    else ctx.fillRect(padding, y - 12, width - padding * 2, 24);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.font = '800 11px Manrope, monospace';
    ctx.fillStyle = '#047857';
    ctx.fillText(`You Saved ₱${totalSavings.toFixed(2)}`, padding + 10, y + 3);
  }

  y += 24;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();

  y += 22;
  ctx.textAlign = 'left';
  ctx.font = '900 14px Manrope, monospace';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('Grand Total:', padding, y);
  ctx.textAlign = 'right';
  ctx.fillText(`₱${order.totalRevenue.toFixed(2)}`, width - padding, y);

  y += 18;
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();
  ctx.setLineDash([]);

  y += 18;
  ctx.textAlign = 'left';
  ctx.font = '600 11px Manrope, monospace';
  ctx.fillStyle = '#475569';
  ctx.fillText('Amount Paid:', padding, y);
  ctx.textAlign = 'right';
  ctx.font = '700 11px Manrope, monospace';
  ctx.fillStyle = '#059669';
  ctx.fillText(`₱${paidVal.toFixed(2)}`, width - padding, y);

  if (change > 0) {
    y += 18;
    ctx.textAlign = 'left';
    ctx.font = '600 11px Manrope, monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText('Change:', padding, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(`₱${change.toFixed(2)}`, width - padding, y);
  }

  if (balDue > 0) {
    y += 18;
    ctx.textAlign = 'left';
    ctx.font = '700 11px Manrope, monospace';
    ctx.fillStyle = '#e11d48';
    ctx.fillText('Outstanding Balance:', padding, y);
    ctx.textAlign = 'right';
    ctx.fillText(`₱${balDue.toFixed(2)}`, width - padding, y);
  }

  y += 18;
  ctx.textAlign = 'left';
  ctx.font = '600 11px Manrope, monospace';
  ctx.fillStyle = '#475569';
  ctx.fillText('Payment Status:', padding, y);
  ctx.textAlign = 'right';
  ctx.font = '900 11px Manrope, monospace';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(statusLine, width - padding, y);

  y += 24;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();

  y += 18;
  ctx.textAlign = 'center';
  ctx.font = '700 10px Manrope, monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText('THANK YOU FOR YOUR BUSINESS!', width / 2, y);

  const imgData = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.download = `Receipt_${order.id}_${Date.now()}.png`;
  a.href = imgData;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function formatRawReceiptText(order: Order): string {
  const items = getOrderItems(order);
  let origSubtotal = 0;
  items.forEach((i) => {
    origSubtotal += i.qty * (i.sellPrice || 0);
  });
  const totalSavings = order.totalRevenue < origSubtotal ? origSubtotal - order.totalRevenue : 0;
  const paidVal =
    order.amountPaid !== undefined ? order.amountPaid : order.isPaid ? order.totalRevenue : 0;
  const statusLine =
    order.status === 'cancelled'
      ? 'VOID / CANCELLED'
      : order.isPaid
      ? 'PAID IN FULL'
      : paidVal > 0
      ? 'PARTIAL PAYMENT'
      : 'UNPAID';

  return `CHEOREOBIZ RECEIPT\nReceipt: ${order.id}\nDate: ${order.date}\nCustomer: ${order.customerName}\nOriginal Total: ₱${origSubtotal.toFixed(2)}\nYou Saved: ₱${totalSavings.toFixed(2)}\nGrand Total: ₱${order.totalRevenue.toFixed(2)}\nAmount Paid: ₱${paidVal.toFixed(2)}\nPayment Status: ${statusLine}`;
}

export function exportOrdersToCSV(orders: Order[]): boolean {
  if (orders.length === 0) return false;
  let csv =
    'data:text/csv;charset=utf-8,Date,ReceiptID,Customer,ItemsSummary,TotalRevenue,TotalCost,TotalProfit,Paid,Status,Delivery,Edited\r\n';
  orders.forEach((o) => {
    const itemsSummaryLine = getOrderItems(o)
      .map((i) => `${i.qty}x${i.name}`)
      .join(' | ');
    csv += `"${o.date || 'N/A'}","${o.id}","${(o.customerName || '').replace(/"/g, '""')}","${itemsSummaryLine.replace(/"/g, '""')}",${o.totalRevenue},${o.totalCost},${o.totalProfit},${o.amountPaid || 0},${o.status === 'cancelled' ? 'Cancelled' : o.isPaid ? 'Paid' : 'Due'},${o.isReceived ? 'Delivered' : 'Pending'},${o.isEdited ? 'Yes' : 'No'}\r\n`;
  });
  const a = document.createElement('a');
  a.href = encodeURI(csv);
  a.download = `cheoreobiz_sales_report_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return true;
}

export function exportDatabaseBackupJSON(payload: {
  inventory: InventoryItem[];
  orders: Order[];
  bundles: Bundle[];
  stockHistory: StockHistoryEntry[];
  activityLog: ActivityLogEntry[];
  bnplRecords: BnplRecord[];
  cashAdjustments: CashAdjustment[];
}): void {
  const a = document.createElement('a');
  a.href =
    'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
  a.download = `cheoreobiz_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
