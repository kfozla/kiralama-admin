"use client";

import { useEffect } from "react";

import { Trash2, X, Wallet, AlertTriangle, Loader2 } from "lucide-react";

import { formatCalendarDate, formatPrice } from "@/utils/emlakCalendar";

export default function DeleteFiyatModal({
  price,
  deleting,
  error,
  onClose,
  onConfirm,
}) {
  useEffect(() => {
    if (!price) return;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !deleting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [price, deleting, onClose]);

  if (!price) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[3px]"
        onClick={() => !deleting && onClose()}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-price-title"
        className="relative z-10 w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Trash2 size={25} />
          </div>

          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <h2
          id="delete-price-title"
          className="text-xl font-bold text-slate-900"
        >
          Fiyat Dönemini Sil
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Bu fiyat kaydını silmek istediğinize emin misiniz?
        </p>

        <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4">
          <div className="flex justify-between gap-3">
            <span className="text-xs text-slate-500">Başlangıç</span>
            <span className="text-sm font-semibold text-slate-800">
              {formatCalendarDate(price.baslangicTarihi)}
            </span>
          </div>

          <div className="flex justify-between gap-3">
            <span className="text-xs text-slate-500">Bitiş</span>
            <span className="text-sm font-semibold text-slate-800">
              {formatCalendarDate(price.bitisTarihi)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <Wallet size={15} />
              Gecelik Fiyat
            </span>

            <span className="text-lg font-bold text-slate-900">
              {formatPrice(price.gecelikFiyat)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex gap-2.5 rounded-xl bg-amber-50 p-3">
          <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600" />

          <p className="text-xs leading-5 text-amber-800">
            Bu fiyat dönemi silindiğinde kapsadığı günlerin gecelik fiyatı,
            başka fiyat kaydı yoksa, tanımsız hale gelir.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Vazgeç
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Trash2 size={17} />
            )}
            Fiyatı Sil
          </button>
        </div>
      </div>
    </div>
  );
}
