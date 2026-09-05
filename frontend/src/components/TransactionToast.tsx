import { useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import clsx from "clsx";

export type TxStatus = "pending" | "success" | "error";

interface Toast {
  id: string;
  status: TxStatus;
  title: string;
  message?: string;
  txHash?: string;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, "id">) => void;
  txPending: (title: string, msg?: string) => string;
  txSuccess: (id: string, txHash?: string) => void;
  txError: (id: string, msg?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function TransactionToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const full: Toast = { ...toast, id };
    setToasts((prev) => [...prev, full]);

    if (toast.status !== "pending") {
      setTimeout(() => removeToast(id), 6000);
    }
    return id;
  }, [removeToast]);

  const txPending = useCallback((title: string, msg?: string) => {
    const id = Math.random().toString(36).slice(2);
    const t: Toast = { id, status: "pending", title, message: msg || "Waiting for confirmation..." };
    setToasts((prev) => [...prev, t]);
    return id;
  }, []);

  const txSuccess = useCallback((id: string, txHash?: string) => {
    setToasts((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: "success" as TxStatus, message: "Transaction confirmed!", txHash }
          : t
      )
    );
    setTimeout(() => removeToast(id), 6000);
  }, [removeToast]);

  const txError = useCallback((id: string, msg?: string) => {
    setToasts((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: "error" as TxStatus, message: msg || "Transaction failed." }
          : t
      )
    );
    setTimeout(() => removeToast(id), 8000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, txPending, txSuccess, txError }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const icons = {
    pending: <Clock className="w-5 h-5 text-yellow-400 animate-spin" />,
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
  };

  const borderColors = {
    pending: "border-yellow-500/30",
    success: "border-green-500/30",
    error: "border-red-500/30",
  };

  return (
    <div
      className={clsx(
        "pointer-events-auto glass-card px-4 py-3 flex items-start gap-3 min-w-72 max-w-96 animate-slide-up",
        borderColors[toast.status]
      )}
      style={{ borderLeft: "3px solid" }}
    >
      <div className="mt-0.5 shrink-0">{icons[toast.status]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-slate-400 mt-0.5">{toast.message}</p>
        )}
        {toast.txHash && (
          <a
            href={`https://sepolia.etherscan.io/tx/${toast.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-400 flex items-center gap-1 mt-1 hover:text-brand-300"
          >
            View on Etherscan <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-slate-500 hover:text-slate-300 transition-colors ml-2 shrink-0"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside TransactionToastProvider");
  return ctx;
}
