import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const styles = {
    success: 'bg-emerald-500/90 border-emerald-400/30 text-white',
    error:   'bg-red-500/90 border-red-400/30 text-white',
    info:    'bg-violet-600/90 border-violet-400/30 text-white',
  };
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles[t.type] || styles.info} backdrop-blur-xl border rounded-xl px-4 py-3 text-sm shadow-2xl flex items-center gap-2.5 min-w-[220px] pointer-events-auto`}
          >
            <span>{icons[t.type] || icons.info}</span>
            <span className="font-medium">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
