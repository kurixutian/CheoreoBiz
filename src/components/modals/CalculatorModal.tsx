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
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 bg-white dark:bg-darkcard rounded-3xl shadow-2xl border border-slate-200 dark:border-darkborder w-80 overflow-hidden transition-all duration-300 transform origin-bottom-right animate-scale-in">
      <div className="bg-slate-900 dark:bg-slate-800 px-5 py-4 flex justify-between items-center text-white">
        <div className="flex items-center space-x-2">
          <Calculator className="w-4 h-4 text-brand-400" />
          <span className="font-bold text-sm tracking-wide">Quick Calculator</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 rounded-lg p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5 bg-slate-50 dark:bg-darkbg">
        <input
          type="text"
          value={expression}
          readOnly
          className="w-full text-right text-3xl font-mono bg-white dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-2xl p-4 mb-4 text-slate-800 dark:text-white shadow-inner focus:outline-none font-bold tracking-tight"
          placeholder="0"
        />
        <div className="grid grid-cols-4 gap-2.5 text-center font-bold text-lg">
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
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-200'
                    : isEquals
                    ? 'bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-500/20 flex items-center justify-center'
                    : isOp
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center'
                    : 'bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs'
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
