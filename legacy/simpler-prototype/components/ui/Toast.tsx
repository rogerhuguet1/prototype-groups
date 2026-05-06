"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "success" | "info" | "warning" | "error";

interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: string) => void;
}

const Ctx = createContext<ToastContextValue | null>(null);

const TONE: Record<ToastKind, string> = {
  success: "border-emerald-200 bg-white text-emerald-800",
  info: "border-sky-200 bg-white text-sky-800",
  warning: "border-amber-200 bg-white text-amber-800",
  error: "border-rose-200 bg-white text-rose-800",
};

const ICON: Record<ToastKind, string> = {
  success: "✓",
  info: "i",
  warning: "!",
  error: "×",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `t-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, kind, message }]);
      if (typeof window !== "undefined") {
        window.setTimeout(() => dismiss(id), 3500);
      }
    },
    [dismiss],
  );

  return (
    <Ctx.Provider value={{ push, dismiss }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.kind === "error" ? "alert" : "status"}
            className={[
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-md",
              TONE[toast.kind],
            ].join(" ")}
          >
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-current/10 text-xs font-bold"
            >
              {ICON[toast.kind]}
            </span>
            <p className="flex-1 text-sm leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Cerrar aviso"
              className="text-slate-500 hover:text-slate-900"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useToast() debe usarse dentro de <ToastProvider>");
  }
  return ctx;
}
