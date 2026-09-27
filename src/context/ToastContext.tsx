import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastOptions {
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 2600;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = idRef.current++;
      const { actionLabel, onAction, duration = DEFAULT_DURATION } = options ?? {};
      const toast: Toast = { id, message, actionLabel, onAction };
      setToasts((prev) => [...prev, toast]);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const handleAction = useCallback(
    (toast: Toast) => {
      toast.onAction?.();
      dismiss(toast.id);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            <span className="toast-msg">{t.message}</span>
            {t.actionLabel ? (
              <button type="button" className="toast-action" onClick={() => handleAction(t)}>
                {t.actionLabel}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}