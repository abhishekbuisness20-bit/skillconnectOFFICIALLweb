import { AlertTriangle, Mail, X } from 'lucide-react';

export interface GmailConfirmationRequest {
  title: string;
  description: string;
  details?: { label: string; value: string }[];
  confirmLabel: string;
  destructive?: boolean;
}

interface GmailConfirmModalProps {
  request: GmailConfirmationRequest | null;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function GmailConfirmModal({
  request,
  busy = false,
  onCancel,
  onConfirm,
}: GmailConfirmModalProps) {
  if (!request) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gmail-confirm-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#090F22] p-6 sm:p-7 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {request.destructive ? (
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
            ) : (
              <Mail className="w-6 h-6 text-cyan-400 shrink-0" />
            )}
            <h3 id="gmail-confirm-title" className="text-lg font-bold text-white">
              {request.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close confirmation dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">{request.description}</p>

        {request.details && request.details.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-[#050814] p-4 space-y-2 text-xs">
            {request.details.map((item) => (
              <div key={item.label} className="grid grid-cols-12 gap-2">
                <span className="col-span-3 font-medium text-slate-400">{item.label}</span>
                <span className="col-span-9 text-slate-100 break-words whitespace-pre-wrap">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-semibold text-slate-200 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
              request.destructive
                ? 'bg-rose-500 text-white hover:bg-rose-400'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
            }`}
          >
            {busy ? 'Applying...' : request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
