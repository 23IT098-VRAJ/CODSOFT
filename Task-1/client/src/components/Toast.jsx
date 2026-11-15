import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { T_EXIT, T_STATE } from '../lib/motion';

const ToastContext = createContext(null);

const STYLES = {
  success: { cls: 'border-emerald-200 text-emerald-900', bar: 'bg-emerald-500', icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> },
  error: { cls: 'border-red-200 text-red-900', bar: 'bg-red-500', icon: <XCircle className="w-5 h-5 text-red-600 shrink-0" /> },
  info: { cls: 'border-parchment text-bodyInk', bar: 'bg-vividGold', icon: <Info className="w-5 h-5 text-vividGold shrink-0" /> },
};
const LIFETIME = 3.5; // seconds

// A toast is a system change, so it eases (200ms in, 150ms out) rather than
// bouncing on a spring, and it leaves faster than it arrived.
const TOAST = {
  initial: { opacity: 0, y: 12, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: T_STATE },
  exit: { opacity: 0, scale: 0.96, transition: T_EXIT },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const showToast = useCallback(
    (message, type = 'info') => {
      nextId.current += 1;
      const id = nextId.current;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]); // show at most 4
      setTimeout(() => dismiss(id), LIFETIME * 1000);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-24 md:bottom-5 inset-x-4 sm:inset-x-auto sm:right-5 z-[100] flex flex-col gap-2 sm:w-80" aria-live="polite">
        {/* popLayout takes a leaving toast out of the flow so the others can
            glide into its place; layout="position" moves them without
            re-measuring their size. */}
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const style = STYLES[t.type] || STYLES.info;
            return (
              <m.div
                key={t.id}
                layout="position"
                role="status"
                {...TOAST}
                className={`relative overflow-hidden bg-pureWhite border ${style.cls} rounded-xl px-4 py-3 text-sm shadow-lg flex items-start gap-2.5`}
              >
                {style.icon}
                <span className="font-medium flex-1">{t.message}</span>
                <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-gray-400 hover:text-bodyInk">
                  <X className="w-4 h-4" />
                </button>
                {/* a progress bar is the one place a linear curve belongs */}
                <m.span aria-hidden="true" className={`absolute bottom-0 left-0 h-0.5 w-full origin-left ${style.bar}`}
                  initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: LIFETIME, ease: 'linear' }} />
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
