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
            ? 'bg-emerald-700 dark:bg-emerald-600 text-white border-emerald-500/30'
            : toast.type === 'error'
            ? 'bg-rose-700 dark:bg-rose-600 text-white border-rose-500/30'
            : toast.type === 'info'
            ? 'bg-brand-600 text-white border-brand-400/30'
            : 'bg-slate-900 dark:bg-darksurface text-white border-white/10';
        const Icon =
          toast.type === 'success'
            ? CheckCircle2
            : toast.type === 'error'
            ? AlertCircle
            : Info;

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-semibold transition-all duration-200 animate-slide-up border backdrop-blur-md z-[100] ${bgClass}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
