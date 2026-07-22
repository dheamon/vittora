"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Check, AlertTriangle, AlertCircle } from "lucide-react";

type ToastType = "ok" | "err" | "warn";

interface Toast {
  id: number;
  title: string;
  sub?: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (title: string, sub?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const toast = useCallback(
    (title: string, sub?: string, type: ToastType = "ok") => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, title, sub, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div id="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === "ok" ? "" : t.type}`}>
            <span className="ti">
              {t.type === "err" ? (
                <AlertCircle />
              ) : t.type === "warn" ? (
                <AlertTriangle />
              ) : (
                <Check />
              )}
            </span>
            <span className="tx">
              {t.title}
              {t.sub ? <small>{t.sub}</small> : null}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
