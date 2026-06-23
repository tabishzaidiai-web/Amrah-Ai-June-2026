import React, { createContext, useContext, useState, ReactNode } from 'react';

type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' };

const ToastContext = createContext<{
  showToast: (message: string, type: Toast['type']) => void;
} | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type']) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={`p-4 rounded-lg shadow-lg text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-800'}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
