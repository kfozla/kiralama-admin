"use client";

import Link from "next/link";

import {
  X,
  CalendarDays,
  House,
  Users,
  UserRound,
  Phone,
  Mail,
  Wallet,
  Clock3,
  ExternalLink,
  Hash,
  CalendarClock,
} from "lucide-react";

import { getDurumClass, getRezervasyonDurumu } from "@/constants/rezervasyon";

import {
  calculateNights,
  formatDate,
  formatMoney,
  formatDateTime,
} from "@/utils/rezervasyon";

import { useEffect, useState } from "react";
import { getEmlakById } from "@/app/services/emlak.service";

// Ortak bilgi kartı
function DetailField({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon size={15} />
        {label}
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {value === null || value === undefined || value === "" ? "-" : value}
      </p>
    </div>
  );
}

// Bölüm başlığı
function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon size={18} />
      </div>

      <h3 className="text-sm font-bold text-slate-900">{children}</h3>
    </div>
  );
}

export default function RezervasyonDetailDrawer({
  reservation,
  emlakName,
  onClose,
}) {
  // ESC ile kapatma
  useEffect(() => {
    if (!reservation) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [reservation, onClose]);

  // Drawer açıkken arka plan scroll kilidi
  useEffect(() => {
    if (!reservation) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [reservation]);

  const [emlak, setEmlak] = useState(null);
  const [loadingEmlak, setLoadingEmlak] = useState(false);

  useEffect(() => {
    const emlakId = reservation?.emlakId;

    if (!emlakId) {
      setEmlak(null);
      setLoadingEmlak(false);
      return;
    }

    let active = true;

    const loadEmlak = async () => {
      setEmlak(null);
      setLoadingEmlak(true);

      try {
        const data = await getEmlakById(emlakId);

        if (active) {
          setEmlak(data?.data ?? data);
        }
      } catch (error) {
        console.error("Emlak bilgileri alınamadı:", error);

        if (active) {
          setEmlak(null);
        }
      } finally {
        if (active) {
          setLoadingEmlak(false);
        }
      }
    };

    loadEmlak();

    return () => {
      active = false;
    };
  }, [reservation?.emlakId]);

  if (!reservation) return null;

  console.log("Rezervasyon detayları:", reservation);

  const konaklamaFiyati = Number(
    reservation.toplamFiyat ?? reservation.toplamTutar ?? 0,
  );

  const temizlikUcreti = Number(reservation.temizlikUcreti ?? 0);

  const hasarDepozitosu = Number(reservation.hasarDepozitosu ?? 0);

  const toplamFiyat = konaklamaFiyati + temizlikUcreti;

  const nights = calculateNights(
    reservation.girisTarihi ?? reservation.baslangicTarihi,
    reservation.cikisTarihi ?? reservation.bitisTarihi,
  );

  const musteriAdSoyad =
    reservation.musteriAdSoyad ||
    [reservation.musteriAd, reservation.musteriSoyad]
      .filter(Boolean)
      .join(" ") ||
    "Belirtilmemiş";

  const telefon = reservation.telefon;
  const email = reservation.email;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Arka plan */}
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sağ detay paneli */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-detail-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-[500px] flex-col bg-white shadow-2xl"
      >
        {/* HEADER */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Rezervasyon Detayı
            </p>

            <h2
              id="reservation-detail-title"
              className="mt-1 text-xl font-bold text-slate-900"
            >
              Rezervasyon #{reservation.id}
            </h2>

            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getDurumClass(
                reservation.durum,
              )}`}
            >
              {getRezervasyonDurumu(reservation.durum)}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Detay panelini kapat"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={21} />
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* MÜŞTERİ BİLGİLERİ */}
          <section>
            <SectionTitle icon={UserRound}>Müşteri Bilgileri</SectionTitle>

            <div className="rounded-2xl border border-slate-200 p-5">
              {/* Müşteri profil alanı */}
              <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <UserRound size={23} />
                </div>

                <div className="min-w-0">
                  <p className="text-base font-bold text-slate-900">
                    {musteriAdSoyad}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Rezervasyon Müşterisi
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Telefon */}
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500">
                    <Phone size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">Telefon Numarası</p>

                    {telefon ? (
                      <a
                        href={`tel:${telefon}`}
                        className="mt-1 block break-all text-sm font-semibold text-blue-600 hover:underline"
                      >
                        {telefon}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        Belirtilmemiş
                      </p>
                    )}
                  </div>
                </div>

                {/* E-posta */}
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500">
                    <Mail size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">E-posta Adresi</p>

                    {email ? (
                      <a
                        href={`mailto:${email}`}
                        className="mt-1 block break-all text-sm font-semibold text-blue-600 hover:underline"
                      >
                        {email}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        Belirtilmemiş
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* EMLAK BİLGİLERİ */}
          <section>
            <SectionTitle icon={House}>Emlak Bilgileri</SectionTitle>

            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-base font-bold text-slate-800">
                {emlakName || `Emlak #${reservation.emlakId ?? "-"}`}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Emlak ID: {reservation.emlakId ?? "-"}
              </p>

              {reservation.emlakId != null && (
                <Link
                  href={`/emlaklar/${reservation.emlakId}`}
                  onClick={onClose}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Emlak Detayına Git
                  <ExternalLink size={15} />
                </Link>
              )}
            </div>
          </section>

          {/* KONAKLAMA BİLGİLERİ */}
          <section>
            <SectionTitle icon={CalendarDays}>Konaklama Bilgileri</SectionTitle>

            <div className="grid grid-cols-2 gap-3">
              <DetailField
                icon={CalendarDays}
                label="Giriş Tarihi"
                value={formatDate(
                  reservation.girisTarihi ?? reservation.baslangicTarihi,
                )}
              />

              <DetailField
                icon={CalendarDays}
                label="Çıkış Tarihi"
                value={formatDate(
                  reservation.cikisTarihi ?? reservation.bitisTarihi,
                )}
              />

              <DetailField
                icon={Clock3}
                label="Gece Sayısı"
                value={nights == null ? "-" : `${nights} Gece`}
              />

              <DetailField
                icon={Users}
                label="Kişi Sayısı"
                value={
                  reservation.kisiSayisi == null
                    ? "-"
                    : `${reservation.kisiSayisi} Kişi`
                }
              />
            </div>
          </section>

          {/* FİYAT BİLGİLERİ */}

          {/* FİYAT BİLGİLERİ */}

          {/* FİYAT BİLGİLERİ */}
          <section>
            <SectionTitle icon={Wallet}>Fiyat Bilgileri</SectionTitle>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
              {/* KONAKLAMA FİYATI */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">Konaklama Fiyatı</span>

                <span className="text-sm font-semibold text-slate-800">
                  {formatMoney(konaklamaFiyati)}
                </span>
              </div>

              {/* TEMİZLİK ÜCRETİ */}
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">Temizlik Ücreti</span>

                <span className="text-sm font-semibold text-slate-800">
                  {formatMoney(temizlikUcreti)}
                </span>
              </div>

              {/* TOPLAM FİYAT */}
              <div className="mt-5 border-t border-blue-200 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-slate-900">
                    Toplam Fiyat
                  </span>

                  <span className="text-2xl font-bold text-blue-600">
                    {formatMoney(toplamFiyat)}
                  </span>
                </div>
              </div>

              {/* GECELİK ORTALAMA */}
              {nights != null && nights > 0 && (
                <div className="mt-4 flex items-center justify-between border-t border-blue-100 pt-3">
                  <span className="text-xs text-slate-500">
                    Gecelik Ortalama
                  </span>

                  <span className="text-sm font-semibold text-slate-700">
                    {formatMoney(konaklamaFiyati / nights)}
                  </span>
                </div>
              )}
            </div>

            {/* HASAR DEPOZİTOSU */}
            {hasarDepozitosu > 0 && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-amber-900">
                    Hasar Depozitosu
                  </span>

                  <span className="text-lg font-bold text-amber-900">
                    {formatMoney(hasarDepozitosu)}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-amber-800">
                  Bu tutar rezervasyon fiyatına dahil değildir. Misafirden giriş
                  sırasında nakit olarak tahsil edilir. Çıkışta hasar
                  kontrolünden sonra, herhangi bir hasar veya eksik bulunmaması
                  durumunda iade edilir.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-amber-800">
                    Girişte nakit alınacak
                  </span>

                  <span className="rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-amber-800">
                    Rezervasyon toplamına dahil değil
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* KAYIT BİLGİLERİ */}
          <section>
            <SectionTitle icon={CalendarClock}>Kayıt Bilgileri</SectionTitle>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailField
                icon={CalendarClock}
                label="Oluşturulma Tarihi"
                value={formatDateTime(reservation.createdAt)}
              />

              <DetailField
                icon={Clock3}
                label="Son Güncelleme"
                value={formatDateTime(reservation.updatedAt)}
              />
            </div>

            <div className="mt-3">
              <DetailField
                icon={Hash}
                label="Rezervasyon Numarası"
                value={`#${reservation.id}`}
              />
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <div className="shrink-0 border-t border-slate-100 bg-white p-5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Kapat
          </button>
        </div>
      </aside>
    </div>
  );
}
