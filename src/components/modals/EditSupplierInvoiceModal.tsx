import React, { useState, useEffect } from 'react';
import { Edit3, X } from 'lucide-react';
import { BnplRecord } from '../../types';

interface EditSupplierInvoiceModalProps {
  record: BnplRecord | null;
  onClose: () => void;
  onSave: (payload: {
    id: string;
    supplierName: string;
    invoiceNumber: string;
    purchaseDate: string;
    dueDate: string;
    notes: string;
  }) => void;
}

export const EditSupplierInvoiceModal: React.FC<EditSupplierInvoiceModalProps> = ({
  record,
  onClose,
  onSave
}) => {
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (record) {
      setSupplierName(record.supplierName || '');
      setInvoiceNumber(record.invoiceNumber || '');
      setPurchaseDate(record.purchaseDate ? record.purchaseDate.split('T')[0] : '');
      setDueDate(record.dueDate ? record.dueDate.split('T')[0] : '');
      setNotes(record.notes || '');
    }
  }, [record]);

  if (!record) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: record.id,
      supplierName: supplierName.trim(),
      invoiceNumber: invoiceNumber.trim(),
      purchaseDate,
      dueDate,
      notes: notes.trim()
    });
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-supplier-invoice-modal-title"
        className="bg-white dark:bg-darkcard rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-darkborder animate-scale-in"
      >
        <div className="px-6 py-5 border-b border-slate-100 dark:border-darkborder flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center space-x-2.5">
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-lg">
              <Edit3 className="w-5 h-5" />
            </div>
            <h3 id="edit-supplier-invoice-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-white">Edit Supplier Invoice</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-darksurface p-1.5 rounded-lg border border-slate-200 dark:border-darkborder shadow-xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Supplier / Vendor</label>
            <input
              type="text"
              required
              value={supplierName}
              onChange={e => setSupplierName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm font-medium bg-white dark:bg-darkinput text-slate-900 dark:text-white transition-all shadow-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Invoice / Ref #</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm font-mono font-medium bg-white dark:bg-darkinput text-slate-900 dark:text-white transition-all shadow-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Purchase Date</label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-xs font-bold bg-white dark:bg-darkinput text-slate-900 dark:text-white transition-all shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-xs font-bold bg-white dark:bg-darkinput text-slate-900 dark:text-white transition-all shadow-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm font-medium bg-white dark:bg-darkinput text-slate-900 dark:text-white transition-all shadow-xs"
            />
          </div>
          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-darkborder">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 dark:border-darkborder rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-500 transition-all shadow-md shadow-brand-500/20 active:scale-[0.99]"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
