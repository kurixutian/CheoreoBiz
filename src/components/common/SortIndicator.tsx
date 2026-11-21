import React from 'react';
import { SortEntry } from '../../types';

interface SortIndicatorProps {
  stack: SortEntry[];
  col: string;
}

export const SortIndicator: React.FC<SortIndicatorProps> = ({ stack, col }) => {
  const stackIndex = stack.findIndex((item) => item.col === col);
  if (stackIndex < 0) return <span className="text-brand-500 font-bold" />;
  const item = stack[stackIndex];
  const arrow = item.dir === 'asc' ? '↑' : '↓';
  return (
    <span className="text-brand-500 font-bold">
      {' '}
      {arrow}
      {stack.length > 1 && <span className="sort-priority-badge">{stackIndex + 1}</span>}
    </span>
  );
};
