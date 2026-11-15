import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { T_EXIT, T_STATE } from '../lib/motion';

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />,
  error: <XCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />,
  info: <Info className="w-4 h-4 text-muted shrink-0 mt-0.5" />,
};

// A toast is a system message, so it eases in (200ms) and out (150ms)
// rather than bouncing, and leaves faster than it arrived.
const TOAST = {
  initial: { opacity: 0, y: 10, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: T_STATE },
  exit: { opacity: 0, scale: 0.97, transition: T_EXIT },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  const showToast = useCallback(
    (message, type = 'info') => {
      nextId.current += 1;
      const id = nextId.current;
      setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss]
  );
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 inset-x-4 sm:inset-x-auto sm:right-5 z-[100] flex flex-col gap-2 sm:w-80" aria-live="polite">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <m.div key={t.id} layout="position" role="status" {...TOAST}
              className="bg-surface border border-line rounded-xl px-4 py-3 text-sm text-ink shadow-lift flex items-start gap-2.5">
              {ICONS[t.type] || ICONS.info}
              <span className="flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-faint hover:text-ink"><X className="w-4 h-4" /></button>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
