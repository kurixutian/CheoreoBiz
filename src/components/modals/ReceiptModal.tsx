import React from 'react';
import { Receipt, Download, Copy } from 'lucide-react';
import { InventoryItem, Order } from '../../types';
import { getOrderItems } from '../../services/calculations';
import { formatRawReceiptText, renderAndDownloadReceiptImage } from '../../services/exportReceipt';
import { ModalShell } from '../common/ModalShell';

interface ReceiptModalProps {
  order: Order | null;
  inventory: InventoryItem[];
  onClose: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  inventory,
  onClose,
  onToast,
}) => {
  if (!order) return null;

  const items = getOrderItems(order);
  const regularTotal = items.reduce((s, i) => s + i.qty * (i.sellPrice || 0), 0);
  const discount = regularTotal - order.totalRevenue;
  const paidVal =
    order.amountPaid !== undefined ? order.amountPaid : order.isPaid ? order.totalRevenue : 0;
  const balance = Math.max(0, order.totalRevenue - paidVal);

  const handleSavePng = async () => {
    try {
      await renderAndDownloadReceiptImage(order, inventory);
      onToast('Receipt image downloaded');
    } catch {
      onToast('Failed to generate image', 'error');
    }
  };

  const handleCopyText = async () => {
    const text = formatRawReceiptText(order);
    try {
      await navigator.clipboard.writeText(text);
      onToast('Receipt text copied to clipboard');
    } catch {
      onToast('Clipboard copy failed', 'error');
    }
  };

  return (
    <ModalShell
      title="Digital Sales Receipt"
      titleId="receipt-modal-title"
      icon={<Receipt className="w-5 h-5" />}
      iconClassName="bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400"
      maxWidthClass="max-w-md"
      zIndexClass="z-[60]"
      onClose={onClose}
      footer={
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleSavePng}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Save PNG
          </button>
          <button
            type="button"
            onClick={handleCopyText}
            className="px-4 py-2.5 bg-white dark:bg-darksurface border border-slate-200 dark:border-darkborder hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <Copy className="w-4 h-4" /> Copy Raw Text
          </button>
        </div>
      }
    >
      <div className="p-5 sm:p-6 bg-slate-100/80 dark:bg-darkbg flex justify-center">
          <div
            id="receipt-render-node"
            className="bg-white text-slate-900 p-6 rounded-2xl shadow-md border border-slate-200 w-full max-w-xs font-mono text-xs space-y-4 tabular-nums"
          >
            <div className="text-center border-b border-dashed border-slate-300 pb-4">
              <div className="font-sans font-extrabold text-lg tracking-tight text-slate-900">
                CHEOREO BIZ
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Official Sales Receipt
              </div>
              <div className="text-[11px] text-slate-500 mt-2">{order.date}</div>
              <div className="text-[10px] text-slate-400">Ref: {order.id}</div>
            </div>

            <div className="border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900 text-right">{order.customerName}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-500">Status:</span>
                <span
                  className={`font-bold uppercase ${
                    order.status === 'cancelled'
                      ? 'text-rose-600'
                      : order.isPaid
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }`}
                >
                  {order.status === 'cancelled'
                    ? 'VOID / CANCELLED'
                    : order.isPaid
                    ? 'PAID IN FULL'
                    : 'PARTIAL / UNPAID'}
                </span>
              </div>
            </div>

            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>Item</span>
                <span>Amount</span>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs">
                    <div className="pr-2">
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.qty} x ₱ {(item.sellPrice || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900 whitespace-nowrap">
                      ₱ {(item.qty * (item.sellPrice || 0)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              {discount > 0.01 && (
                <>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Subtotal:</span>
                    <span>₱ {regularTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-brand-600 font-bold">
                    <span>Bundle Discount:</span>
                    <span>-₱ {discount.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1">
                <span>TOTAL:</span>
                <span>₱ {order.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-700 font-bold">
                <span>Amount Paid:</span>
                <span>₱ {paidVal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-rose-600 font-bold pt-1 border-t border-dotted border-slate-200">
                <span>Balance Due:</span>
                <span>₱ {balance.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center pt-4 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
              Thank you for your business!
            </div>
          </div>
      </div>
    </ModalShell>
  );
};
