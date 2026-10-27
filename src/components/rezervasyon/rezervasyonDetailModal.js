"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  CalendarDays,
  UserRound,
  Phone,
  Mail,
  Wallet,
  Loader2,
  AlertCircle,
  BedDouble,
  ReceiptText,
} from "lucide-react";

import { getRezervasyonById } from "@/app/services/rezervasyon.service";

function formatDate(value) {
  if (!value) return "Belirtilmemiş";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Belirtilmemiş";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatMoney(value) {
  if (value == null || value === "") return "Belirtilmemiş";

  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Belirtilmemiş";

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount);
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value == null || value === "" ? "Belirtilmemiş" : value}
        </p>
      </div>
    </div>
  );
}

export default function RezervasyonDetailModal({ rezervasyonId, onClose }) {
  const [rezervasyon, setRezervasyon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (rezervasyonId == null) return;

    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setRezervasyon(null);

      try {
        const result = await getRezervasyonById(rezervasyonId);

        if (active) {
          setRezervasyon(result?.data ?? result);
        }
      } catch (err) {
        if (active) {
          setError(
            err?.response?.data?.message || "Rezervasyon bilgileri alınamadı.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [rezervasyonId]);

  useEffect(() => {
    if (rezervasyonId == null) return;

    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [rezervasyonId, onClose]);

  if (!mounted || rezervasyonId == null) return null;

  const r = rezervasyon;

  const musteriAdi =
    r?.musteriAd + " " + r?.musteriSoyad ||
    r?.musteriAdSoyad ||
    "Belirtilmemiş";

  const giris = r?.girisTarihi ?? r?.giris;
  const cikis = r?.cikisTarihi ?? r?.cikis;

  const toplamFiyat = r?.toplamFiyat;
  const temizlikUcreti = r?.temizlikUcreti ?? 0;

  const toplamTutar =
    toplamFiyat != null ? Number(toplamFiyat) + Number(temizlikUcreti) : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Rezervasyon #${rezervasyonId} bilgileri`}
        className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ReceiptText size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Rezervasyon Bilgileri
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Rezervasyon #{rezervasyonId}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3">
              <Loader2 size={27} className="animate-spin text-blue-600" />
              <p className="text-sm text-slate-500">
                Rezervasyon bilgileri yükleniyor...
              </p>
            </div>
          ) : error ? (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle size={18} />
              {error}
            </div>
          ) : r ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                <p className="text-xs font-semibold text-blue-700">
                  Rezervasyon Özeti
                </p>
                <p className="mt-2 text-sm font-bold text-blue-950">
                  {r.emlakAdi ?? `Emlak #${r.emlakId ?? "-"}`}
                </p>
                {r.durumAdi && (
                  <p className="mt-1 text-xs text-blue-700">
                    Durum: {r.durumAdi}
                  </p>
                )}
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  Misafir Bilgileri
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoItem
                    icon={UserRound}
                    label="Ad Soyad"
                    value={musteriAdi}
                  />
                  <InfoItem
                    icon={Phone}
                    label="Telefon"
                    value={r.telefon ?? r.musteriTelefon}
                  />
                  <InfoItem
                    icon={Mail}
                    label="E-posta"
                    value={r.email ?? r.musteriEmail}
                  />
                  <InfoItem
                    icon={BedDouble}
                    label="Misafir Sayısı"
                    value={r.kisiSayisi ?? r.misafirSayisi}
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  Konaklama Tarihleri
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoItem
                    icon={CalendarDays}
                    label="Giriş Tarihi"
                    value={formatDate(giris)}
                  />
                  <InfoItem
                    icon={CalendarDays}
                    label="Çıkış Tarihi"
                    value={formatDate(cikis)}
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  Ücret Bilgileri
                </h3>

                <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-500">Konaklama Tutarı</span>
                    <span className="font-semibold text-slate-800">
                      {formatMoney(toplamFiyat)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-500">Temizlik Ücreti</span>
                    <span className="font-semibold text-slate-800">
                      {formatMoney(r.temizlikUcreti)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 border-t border-slate-100 pt-3">
                    <span className="font-bold text-slate-900">
                      Toplam Tutar
                    </span>
                    <span className="font-bold text-blue-700">
                      {formatMoney(toplamTutar)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-xs">
                    <span className="text-slate-500">
                      Hasar Depozitosu (ayrı)
                    </span>
                    <span className="font-semibold text-slate-600">
                      {formatMoney(r.hasarDepozitosu)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">
              Rezervasyon bulunamadı.
            </p>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <X size={16} />
            Kapat
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
