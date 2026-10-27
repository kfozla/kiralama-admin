"use client";

import { useEffect, useState } from "react";

import {
  X,
  CalendarDays,
  Trash2,
  Loader2,
  Wallet,
  UserRound,
  LockKeyhole,
  Eye,
  ArrowUpRight,
} from "lucide-react";

import { formatCalendarDate, formatPrice } from "@/utils/emlakCalendar";
import RezervasyonDetailModal from "@/components/rezervasyon/rezervasyonDetailModal";

const STATUS = {
  0: "Beklemede",
  1: "Onaylandı",
  2: "İptal Edildi",
  3: "Tamamlandı",
};

export default function CalendarEventModal({
  event,
  onClose,
  onDelete,
  deleting,
  error,
}) {
  useEffect(() => {
    if (!event) return;

    const handler = (e) => {
      if (e.key === "Escape" && !deleting) onClose();
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, [event, deleting, onClose]);

  const [selectedRezervasyonId, setSelectedRezervasyonId] = useState(null);

  if (!event) return null;

  const isBlock = event.type === "block";
  const isPrice = event.type === "price";
  const canDelete = (isBlock && !event.isReservationBlock) || isPrice;

  const title = isBlock
    ? "Bloke Detayı"
    : isPrice
      ? "Fiyat Detayı"
      : "Rezervasyon Detayı";

  const Icon = isBlock ? LockKeyhole : isPrice ? Wallet : UserRound;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50"
        onClick={() => !deleting && onClose()}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-title"
        className="relative z-10 w-full max-w-[440px] rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icon size={22} />
            </div>

            <div>
              <h2
                id="calendar-event-title"
                className="text-lg font-bold text-slate-900"
              >
                {title}
              </h2>

              <p className="mt-1 text-xs text-slate-500">Kayıt #{event.id}</p>
            </div>
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

        <div className="space-y-4 p-6">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <CalendarDays size={15} />
              Tarih Aralığı
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-900">
              {formatCalendarDate(event.start)}
              {" → "}
              {formatCalendarDate(event.end)}
            </p>

            <p className="mt-1 text-xs text-slate-500">Bitiş günü hariçtir.</p>
          </div>

          {isBlock && (
            <div>
              <p className="text-xs text-slate-500">Bloke Açıklaması</p>
              <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-slate-800">
                {event.description || "Açıklama girilmemiş."}
              </p>
            </div>
          )}

          {isBlock && event.isReservationBlock && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <LockKeyhole size={17} className="text-red-600" />
                <p className="text-xs font-semibold text-red-700">
                  Rezervasyona Bağlı Bloke
                </p>
              </div>

              <p className="mt-2 text-sm font-semibold text-red-900">
                Rezervasyon #{event.rezervasyonId}
              </p>

              <p className="mt-2 text-xs leading-5 text-red-700">
                Bu bloke doğrudan silinemez. Kaldırmak için ilgili rezervasyonu
                iptal etmelisiniz.
              </p>

              <button
                type="button"
                onClick={() => setSelectedRezervasyonId(event.rezervasyonId)}
                className="mt-4 inline-flex w-full items-center justify-center
                 gap-2 rounded-lg border border-red-200 bg-white
                 px-4 py-2.5 text-sm font-semibold text-red-700
                 transition hover:bg-red-100"
              >
                <Eye size={17} />
                Rezervasyon Bilgilerini Gör
                <ArrowUpRight size={15} />
              </button>
              <RezervasyonDetailModal
                rezervasyonId={selectedRezervasyonId}
                onClose={() => setSelectedRezervasyonId(null)}
              />
            </div>
          )}

          {isPrice && (
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-xs text-blue-700">Gecelik Fiyat</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatPrice(event.price)}
              </p>
            </div>
          )}

          {event.type === "reservation" && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">Müşteri</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {event.title}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Durum</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {STATUS[event.status] ?? "Bilinmiyor"}
                </p>
              </div>

              {event.raw?.kisiSayisi != null && (
                <div>
                  <p className="text-xs text-slate-500">Kişi Sayısı</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {event.raw.kisiSayisi}
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Kapat
            </button>

            {canDelete && (
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  if (
                    window.confirm(
                      isBlock
                        ? "Bu bloke kaydını kaldırmak istiyor musunuz?"
                        : "Bu fiyat kaydını silmek istiyor musunuz?",
                    )
                  ) {
                    onDelete(event);
                  }
                }}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Trash2 size={17} />
                )}
                {isBlock ? "Blokeyi Kaldır" : "Fiyatı Sil"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
