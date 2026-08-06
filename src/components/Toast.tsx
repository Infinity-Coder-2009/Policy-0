/**
 * Toast Notification Component
 * ============================================================
 * Renders toast notifications from the UI store.
 */

import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const toastStyles = {
  success: 'border-[#00CC88]/30 bg-[#00CC88]/10',
  error: 'border-[#FF3355]/30 bg-[#FF3355]/10',
  warning: 'border-[#FFB800]/30 bg-[#FFB800]/10',
  info: 'border-[#0088FF]/30 bg-[#0088FF]/10',
};

const toastIconStyles = {
  success: 'text-[#00CC88]',
  error: 'text-[#FF3355]',
  warning: 'text-[#FFB800]',
  info: 'text-[#0088FF]',
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => {
        const Icon = toastIcons[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-in slide-in-from-right ${toastStyles[toast.type]}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${toastIconStyles[toast.type]}`} />
            <p className="flex-1 text-sm text-white">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#A0A0B8] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}