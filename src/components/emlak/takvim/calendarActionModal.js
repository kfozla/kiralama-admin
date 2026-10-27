"use client";

import { useEffect, useState } from "react";

import {
  X,
  CalendarDays,
  LockKeyhole,
  Wallet,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { formatCalendarDate, formatPrice } from "@/utils/emlakCalendar";

export default function CalendarActionModal({
  selection,
  mode,
  onClose,
  onSave,
  saving,
  error,
}) {
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (!selection) return;

    setDescription("");
    setPrice("");
  }, [selection]);

  useEffect(() => {
    if (!selection) return;

    const handleKey = (event) => {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [selection, saving, onClose]);

  if (!selection) return null;

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    if (mode === "price") {
      const amount = Number(price);

      if (!Number.isFinite(amount) || amount <= 0) {
        return;
      }

      await onSave({
        gecelikFiyat: amount,
      });
    } else {
      await onSave({
        aciklama: description.trim(),
      });
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={() => !saving && onClose()}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-action-title"
        className="relative z-10 w-full max-w-[460px] rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                mode === "block"
                  ? "bg-slate-100 text-slate-700"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              {mode === "block" ? (
                <LockKeyhole size={22} />
              ) : (
                <Wallet size={22} />
              )}
            </div>

            <div>
              <h2
                id="calendar-action-title"
                className="text-lg font-bold text-slate-900"
              >
                {mode === "block"
                  ? "Tarihleri Bloke Et"
                  : "Gecelik Fiyat Belirle"}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Seçilen tarih aralığına işlem uygula
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="rounded-xl bg-blue-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-700">
              <CalendarDays size={16} />
              Seçilen Tarihler
            </div>

            <p className="text-sm font-bold text-slate-900">
              {formatCalendarDate(selection.start)}
              {" → "}
              {formatCalendarDate(selection.end)}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Bitiş tarihi hariçtir. Son kapatılan veya fiyatlandırılan gece:{" "}
              {formatCalendarDate(selection.lastDay)}
            </p>
          </div>

          {mode === "block" ? (
            <div>
              <label
                htmlFor="block-description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Açıklama
                <span className="ml-1 font-normal text-slate-400">
                  (İsteğe bağlı)
                </span>
              </label>

              <textarea
                id="block-description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Örn. Villa sahibi kullanacak"
                className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>
          ) : (
            <div>
              <label
                htmlFor="nightly-price"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Gecelik Fiyat (₺)
              </label>

              <input
                id="nightly-price"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="Örn. 5000"
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />

              {Number(price) > 0 && (
                <p className="mt-2 text-sm font-semibold text-blue-600">
                  {formatPrice(Number(price))} / gece
                </p>
              )}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Vazgeç
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving && <Loader2 size={17} className="animate-spin" />}

              {mode === "block" ? "Tarihleri Bloke Et" : "Fiyatı Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
