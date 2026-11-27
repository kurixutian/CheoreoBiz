import React from 'react';

interface ViewHeaderProps {
  title: string;
  children?: React.ReactNode;
}

/** Consistent top-level page title and right-aligned action strip across all views. */
export const ViewHeader: React.FC<ViewHeaderProps> = ({ title, children }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 pb-1">
      <h1 className="text-xl sm:text-2xl font-bold tracking-[-0.02em] text-slate-900 dark:text-white">
        {title}
      </h1>
      {children && (
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
          {children}
        </div>
      )}
    </div>
  );
};
