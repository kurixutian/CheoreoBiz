import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { ToastMessage } from '../../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div
      id="toast-container"
      className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const bgClass =
          toast.type === 'success'
            ? 'bg-emerald-600 text-white'
            : toast.type === 'error'
            ? 'bg-rose-600 text-white'
            : toast.type === 'info'
            ? 'bg-brand-600 text-white'
            : 'bg-slate-900 dark:bg-slate-800 text-white';
        const Icon =
          toast.type === 'success'
            ? CheckCircle2
            : toast.type === 'error'
            ? AlertCircle
            : Info;

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-full shadow-2xl text-xs sm:text-sm font-bold transition-all duration-300 animate-slide-up ${bgClass} border border-white/10 backdrop-blur-md z-[100]`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
