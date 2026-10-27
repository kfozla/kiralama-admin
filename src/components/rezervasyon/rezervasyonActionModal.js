"use client";

import { useEffect } from "react";
import {
  X,
  CheckCircle2,
  Trash2,
  Ban,
  Loader2,
  AlertCircle,
} from "lucide-react";

const CONFIG = {
  approve: {
    title: "Rezervasyonu Onayla",
    description: "Bu rezervasyonu onaylamak istediğinize emin misiniz?",
    info: "Onaylandığında villa için otomatik bloke oluşturulacak.",
    button: "Rezervasyonu Onayla",
    Icon: CheckCircle2,
    color: "green",
  },
  delete: {
    title: "Rezervasyonu Sil",
    description: "Bu bekleyen rezervasyonu silmek istediğinize emin misiniz?",
    info: "Bu işlem rezervasyon kaydını kalıcı olarak kaldırabilir.",
    button: "Rezervasyonu Sil",
    Icon: Trash2,
    color: "red",
  },
  cancel: {
    title: "Rezervasyonu İptal Et",
    description:
      "Bu onaylı rezervasyonu iptal etmek istediğinize emin misiniz?",
    info: "Rezervasyona bağlı otomatik bloke kaldırılacak ve tarihler yeniden müsait olacak.",
    button: "Rezervasyonu İptal Et",
    Icon: Ban,
    color: "red",
  },
};

export default function RezervasyonActionModal({
  action,
  loading = false,
  error = "",
  onClose,
  onConfirm,
}) {
  const config = action ? CONFIG[action.type] : null;

  useEffect(() => {
    if (!config) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [config, loading, onClose]);

  if (!action || !config) return null;

  const { Icon } = config;
  const isApprove = config.color === "green";

  const customer =
    action.reservation.musteriAdSoyad ||
    [action.reservation.musteriAd, action.reservation.musteriSoyad]
      .filter(Boolean)
      .join(" ") ||
    `Rezervasyon #${action.reservation.id}`;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[3px]"
        onClick={() => !loading && onClose()}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="rez-action-title"
        aria-describedby="rez-action-description"
        className="relative z-10 w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
              isApprove
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            <Icon size={26} />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <h2 id="rez-action-title" className="text-xl font-bold text-slate-900">
          {config.title}
        </h2>

        <p
          id="rez-action-description"
          className="mt-2 text-sm leading-6 text-slate-500"
        >
          {config.description}
        </p>

        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">
            Rezervasyon #{action.reservation.id}
          </p>

          <p className="mt-1 text-sm font-bold text-slate-900">{customer}</p>
        </div>

        <div
          className={`mt-4 flex items-start gap-2.5 rounded-xl p-3 ${
            isApprove
              ? "bg-emerald-50 text-emerald-800"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <p className="text-xs leading-5">{config.info}</p>
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
            disabled={loading}
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Vazgeç
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-white disabled:opacity-50 ${
              isApprove
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Icon size={17} />
            )}
            {loading ? "İşleniyor..." : config.button}
          </button>
        </div>
      </div>
    </div>
  );
}
