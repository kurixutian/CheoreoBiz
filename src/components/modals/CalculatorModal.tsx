import React, { useState } from 'react';
import { Calculator, X } from 'lucide-react';
import { INITIAL_CALCULATOR_BUTTONS } from '../../constants/config';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose }) => {
  const [expression, setExpression] = useState('');

  if (!isOpen) return null;

  const buttons = INITIAL_CALCULATOR_BUTTONS.flat();

  const handlePress = (val: string) => {
    if (val === 'C') {
      setExpression('');
    } else if (val === '=') {
      try {
        const sanitized = expression.replace(/[^0-9+\-*/.()]/g, '');
        if (!sanitized) return;
        // eslint-disable-next-line no-new-func
        const res = Function(`"use strict"; return (${sanitized})`)();
        if (res !== undefined && !isNaN(res)) {
          setExpression(Number(Math.round(Number(res + 'e4')) + 'e-4').toString());
        } else {
          setExpression('Error');
        }
      } catch {
        setExpression('Error');
      }
    } else {
      setExpression((prev) => (prev === 'Error' ? val : prev + val));
    }
  };

  return (
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 bg-white dark:bg-darkcard rounded-2xl shadow-2xl border border-slate-200 dark:border-darkborder w-80 overflow-hidden transition-all duration-200 transform origin-bottom-right animate-scale-in">
      <div className="bg-slate-900 dark:bg-darksurface border-b border-slate-800 dark:border-darkborder px-4 py-3.5 flex justify-between items-center text-white">
        <div className="flex items-center space-x-2">
          <Calculator className="w-4 h-4 text-brand-400" />
          <span className="font-semibold text-sm tracking-tight">Quick Calculator</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close calculator"
          className="text-slate-300 hover:text-white transition-colors bg-slate-800 dark:bg-darkcard hover:bg-slate-700 rounded-lg p-1.5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 bg-slate-50 dark:bg-darkbg">
        <input
          type="text"
          value={expression}
          readOnly
          aria-label="Calculator display"
          className="w-full text-right text-3xl font-mono tabular-nums bg-white dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-xl p-3.5 mb-3.5 text-slate-900 dark:text-white focus:outline-none font-bold tracking-tight"
          placeholder="0"
        />
        <div className="grid grid-cols-4 gap-2 text-center font-semibold text-base">
          {buttons.map((val, idx) => {
            const isClear = val === 'C';
            const isEquals = val === '=';
            const isZero = val === '0';
            const isPlus = val === '+';
            const isOp = ['/', '*', '-', '+'].includes(val);
            const spanClass = isPlus || isEquals ? 'row-span-2' : isZero ? 'col-span-2' : '';

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handlePress(val)}
                className={`${spanClass} ${
                  isClear
                    ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-500/30'
                    : isEquals
                    ? 'bg-brand-600 text-white hover:bg-brand-700 flex items-center justify-center'
                    : isOp
                    ? 'bg-slate-200 dark:bg-darksurface text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-800 flex items-center justify-center'
                    : 'bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-darksurface'
                } rounded-xl py-3 transition-colors active:scale-95`}
              >
                {val === '*' ? '×' : val === '/' ? '÷' : val}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
