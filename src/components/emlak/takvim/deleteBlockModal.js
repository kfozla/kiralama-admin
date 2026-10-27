"use client";

import { useEffect } from "react";
import { X, Trash2, CalendarDays, AlertTriangle, Loader2 } from "lucide-react";

import { formatCalendarDate, addDays } from "@/utils/emlakCalendar";

export default function DeleteBlockModal({
  block,
  deleting,
  error,
  onClose,
  onConfirm,
}) {
  useEffect(() => {
    if (!block) return;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !deleting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [block, deleting, onClose]);

  if (!block) return null;

  const lastNight = addDays(block.end, -1);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[3px]"
        onClick={() => !deleting && onClose()}
      />

      {/* Modal */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-block-title"
        aria-describedby="delete-block-description"
        className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
      >
        <div className="p-6">
          {/* İkon ve kapatma */}
          <div className="mb-5 flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 size={25} strokeWidth={1.8} />
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              aria-label="Kapat"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          <h2
            id="delete-block-title"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            Bloke Kaydını Kaldır
          </h2>

          <p
            id="delete-block-description"
            className="mt-2 text-sm leading-6 text-slate-500"
          >
            Bu tarih aralığındaki bloke kaydını kaldırmak istediğinize emin
            misiniz?
          </p>

          {/* Tarih bilgileri */}
          <div className="mt-5 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-600">
              <CalendarDays size={16} className="text-blue-600" />
              Bloke Tarihleri
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">Başlangıç</span>

              <span className="text-sm font-semibold text-slate-800">
                {formatCalendarDate(block.start)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">Son Blokeli Gece</span>

              <span className="text-sm font-semibold text-slate-800">
                {formatCalendarDate(lastNight)}
              </span>
            </div>

            {block.description && (
              <div className="border-t border-slate-200 pt-3">
                <p className="mb-1 text-xs text-slate-500">Açıklama</p>

                <p className="text-sm text-slate-700">{block.description}</p>
              </div>
            )}
          </div>

          {/* Uyarı */}
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 p-3">
            <AlertTriangle
              size={17}
              className="mt-0.5 shrink-0 text-amber-600"
            />

            <p className="text-xs leading-5 text-amber-800">
              Bloke kaldırıldıktan sonra bu tarihler, başka bir rezervasyon veya
              bloke bulunmuyorsa yeniden müsait hale gelecektir.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Butonlar */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Vazgeç
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Siliniyor...
                </>
              ) : (
                <>
                  <Trash2 size={17} />
                  Blokeyi Kaldır
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
