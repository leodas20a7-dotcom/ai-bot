import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, Trash2 } from 'lucide-react';

/* ─── Context ─────────────────────────────────────────────── */
const DialogContext = createContext(null);

export function useDialog() {
  return useContext(DialogContext);
}

/* ─── Provider (wrap your app root with this) ─────────────── */
export function DialogProvider({ children }) {
  const [toast, setToast] = useState(null);        // { type, message }
  const [confirm, setConfirm] = useState(null);    // { message, onConfirm, danger }

  /** Show a toast notification (auto-dismisses after 3.5 s) */
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  /** Show a confirm dialog; resolves true/false */
  const showConfirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setConfirm({
        message,
        danger: options.danger ?? false,
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        onConfirm: () => { setConfirm(null); resolve(true); },
        onCancel:  () => { setConfirm(null); resolve(false); },
      });
    });
  }, []);

  return (
    <DialogContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* ── Toast ── */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* ── Confirm Dialog ── */}
      {confirm && <ConfirmDialog {...confirm} />}
    </DialogContext.Provider>
  );
}

/* ─── Toast ───────────────────────────────────────────────── */
const toastConfig = {
  success: { icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-200', icon_color: 'text-emerald-500', text: 'text-emerald-800' },
  error:   { icon: XCircle,      bg: 'bg-red-50',     border: 'border-red-200',     icon_color: 'text-red-500',     text: 'text-red-800'     },
  warning: { icon: AlertTriangle,bg: 'bg-amber-50',   border: 'border-amber-200',   icon_color: 'text-amber-500',   text: 'text-amber-800'   },
  info:    { icon: Info,         bg: 'bg-blue-50',    border: 'border-blue-200',    icon_color: 'text-blue-500',    text: 'text-blue-800'    },
};

function Toast({ type, message, onClose }) {
  const cfg = toastConfig[type] || toastConfig.info;
  const Icon = cfg.icon;
  return (
    <div className="fixed bottom-6 right-6 z-[200] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-xl border max-w-sm ${cfg.bg} ${cfg.border}`}>
        <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${cfg.icon_color}`} />
        <p className={`text-sm font-medium flex-1 ${cfg.text}`}>{message}</p>
        <button onClick={onClose} className={`${cfg.icon_color} hover:opacity-70 transition-opacity`}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Confirm Dialog ──────────────────────────────────────── */
function ConfirmDialog({ message, danger, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Icon bar */}
        <div className={`px-6 pt-6 flex justify-center`}>
          <div className={`h-14 w-14 rounded-full flex items-center justify-center ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
            {danger
              ? <Trash2 className="h-7 w-7 text-red-500" />
              : <AlertTriangle className="h-7 w-7 text-amber-500" />
            }
          </div>
        </div>
        {/* Body */}
        <div className="px-6 py-4 text-center">
          <p className="text-slate-700 text-sm leading-relaxed">{message}</p>
        </div>
        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors shadow-sm ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-800 hover:bg-slate-900'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
