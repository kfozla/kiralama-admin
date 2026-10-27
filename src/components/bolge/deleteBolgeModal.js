"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";

export default function DeleteBolgeModal({
  bolge,
  loading,
  error,
  onClose,
  onConfirm,
}) {
  if (!bolge) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-bolge-title"
        aria-describedby="delete-bolge-description"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle size={23} />
          </div>

          <button
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <h2
          id="delete-bolge-title"
          className="mt-5 text-xl font-bold text-slate-900"
        >
          Bölge silinsin mi?
        </h2>

        <p
          id="delete-bolge-description"
          className="mt-3 text-sm leading-6 text-slate-500"
        >
          <strong className="text-slate-800">{bolge.ad}</strong> bölgesini
          silmek üzeresiniz. Bölgeye bağlı alt bölgeler veya emlaklar varsa
          işlem engellenebilir.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
          >
            {error}
          </div>
        )}

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Vazgeç
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading && <Loader2 size={17} className="animate-spin" />}

            {loading ? "Siliniyor..." : "Evet, Sil"}
          </button>
        </div>
      </div>
    </div>
  );
}
