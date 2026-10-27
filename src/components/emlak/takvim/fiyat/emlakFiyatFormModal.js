"use client";

import { useEffect, useState } from "react";

import { X, Wallet, CalendarDays, Loader2, AlertCircle } from "lucide-react";

import { formatPrice, rangesOverlap } from "@/utils/emlakCalendar";

export default function EmlakFiyatFormModal({
  open,
  initialData,
  prices = [],
  saving,
  error,
  onClose,
  onSave,
}) {
  const isEditing = Boolean(initialData);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [nightlyPrice, setNightlyPrice] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!open) return;

    setStartDate(initialData?.baslangicTarihi?.slice(0, 10) ?? "");

    setEndDate(initialData?.bitisTarihi?.slice(0, 10) ?? "");

    setNightlyPrice(
      initialData?.gecelikFiyat != null ? String(initialData.gecelikFiyat) : "",
    );

    setValidationError("");
  }, [open, initialData]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, saving, onClose]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError("");

    if (!startDate || !endDate) {
      setValidationError("Başlangıç ve bitiş tarihi zorunludur.");
      return;
    }

    if (startDate >= endDate) {
      setValidationError("Bitiş tarihi başlangıç tarihinden sonra olmalıdır.");
      return;
    }

    const price = Number(nightlyPrice);

    if (!Number.isFinite(price) || price <= 0) {
      setValidationError("Geçerli bir gecelik fiyat girin.");
      return;
    }

    // Düzenlenen kaydı kontrol dışında bırak.
    const overlapping = prices.some((item) => {
      if (isEditing && Number(item.id) === Number(initialData.id)) {
        return false;
      }

      return rangesOverlap(
        startDate,
        endDate,
        item.baslangicTarihi.slice(0, 10),
        item.bitisTarihi.slice(0, 10),
      );
    });

    if (overlapping) {
      setValidationError(
        "Bu tarih aralığı başka bir fiyat dönemiyle çakışıyor.",
      );
      return;
    }

    await onSave({
      baslangicTarihi: startDate,
      bitisTarihi: endDate,
      gecelikFiyat: price,
    });
  };

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

  const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={() => !saving && onClose()}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fiyat-form-title"
        className="relative z-10 w-full max-w-[500px] overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Wallet size={23} />
            </div>

            <div>
              <h2
                id="fiyat-form-title"
                className="text-lg font-bold text-slate-900"
              >
                {isEditing ? "Fiyat Dönemini Düzenle" : "Yeni Fiyat Dönemi"}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {isEditing
                  ? "Mevcut fiyat bilgilerini güncelleyin."
                  : "Yeni bir gecelik fiyat tanımlayın."}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fiyat-start" className={labelClass}>
                Başlangıç Tarihi
              </label>

              <input
                id="fiyat-start"
                type="date"
                required
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="fiyat-end" className={labelClass}>
                Bitiş Tarihi
              </label>

              <input
                id="fiyat-end"
                type="date"
                min={startDate || undefined}
                required
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="fiyat-amount" className={labelClass}>
              Gecelik Fiyat (₺)
            </label>

            <input
              id="fiyat-amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={nightlyPrice}
              onChange={(event) => setNightlyPrice(event.target.value)}
              placeholder="Örn. 5000"
              className={inputClass}
            />

            {Number(nightlyPrice) > 0 && (
              <p className="mt-2 text-sm font-semibold text-blue-600">
                {formatPrice(Number(nightlyPrice))} / gece
              </p>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-4">
            <CalendarDays size={17} className="mt-0.5 shrink-0 text-blue-600" />

            <p className="text-xs leading-5 text-blue-800">
              Belirtilen fiyat başlangıç gününden itibaren geçerli olur. Bitiş
              günü bu fiyat dönemine dahil değildir.
            </p>
          </div>

          {(validationError || error) && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{validationError || error}</span>
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

              {isEditing ? "Değişiklikleri Kaydet" : "Fiyat Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
