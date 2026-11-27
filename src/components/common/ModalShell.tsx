import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalShellProps {
  title: string;
  titleId: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconClassName?: string;
  headerClassName?: string;
  maxWidthClass?: string;
  zIndexClass?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Accessible, consistent modal dialog container with Escape-to-close and unified surfaces. */
export const ModalShell: React.FC<ModalShellProps> = ({
  title,
  titleId,
  subtitle,
  icon,
  iconClassName = 'bg-slate-100 dark:bg-darksurface text-slate-700 dark:text-slate-300',
  headerClassName = 'bg-slate-50/70 dark:bg-darksurface/50',
  maxWidthClass = 'max-w-md',
  zIndexClass = 'z-50',
  onClose,
  children,
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 bg-slate-950/60 dark:bg-black/75 ${zIndexClass} flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-white dark:bg-darkcard rounded-2xl shadow-2xl w-full ${maxWidthClass} overflow-hidden flex flex-col max-h-[88vh] border border-slate-200 dark:border-darkborder animate-scale-in`}
      >
        <div
          className={`px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-darkborder flex justify-between items-center gap-3 flex-none ${headerClassName}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className={`${iconClassName} p-2 rounded-xl flex-shrink-0 border border-black/5 dark:border-white/5`}>
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h3
                id={titleId}
                className="text-base sm:text-lg font-semibold tracking-[-0.015em] text-slate-900 dark:text-white leading-tight truncate"
              >
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-darksurface rounded-lg border border-slate-200 dark:border-darkborder transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">{children}</div>

        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-darkborder bg-slate-50/70 dark:bg-darksurface/40 flex-none">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
