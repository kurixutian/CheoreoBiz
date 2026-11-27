import React, { useState, useEffect } from 'react';
import { Edit3 } from 'lucide-react';
import { BnplRecord } from '../../types';
import { ModalShell } from '../common/ModalShell';

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
  onSave,
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
      notes: notes.trim(),
    });
  };

  return (
    <ModalShell
      title="Edit Supplier Invoice"
      titleId="edit-supplier-invoice-modal-title"
      icon={<Edit3 className="w-5 h-5" />}
      iconClassName="bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Supplier / Vendor
          </label>
          <input
            type="text"
            required
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-darkborder rounded-xl focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none text-sm font-medium bg-slate-50 dark:bg-darkinput text-slate-900 dark:text-white transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Invoice / Ref #
          </label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-darkborder rounded-xl focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none text-sm font-mono font-medium bg-slate-50 dark:bg-darkinput text-slate-900 dark:text-white transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Purchase Date
            </label>
            <input
              type="date"
              required
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-darkborder rounded-xl focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none text-xs font-semibold bg-slate-50 dark:bg-darkinput text-slate-900 dark:text-white transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-darkborder rounded-xl focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none text-xs font-semibold bg-slate-50 dark:bg-darkinput text-slate-900 dark:text-white transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-darkborder rounded-xl focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none text-sm font-medium bg-slate-50 dark:bg-darkinput text-slate-900 dark:text-white transition-all"
          />
        </div>
        <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-200 dark:border-darkborder">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 dark:border-darkborder rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-darksurface transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-[0.99]"
          >
            Save Changes
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
