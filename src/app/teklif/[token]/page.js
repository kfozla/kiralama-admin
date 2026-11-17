"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  Bath,
  BedDouble,
  CalendarDays,
  House,
  Loader2,
  MapPin,
  UsersRound,
} from "lucide-react";

import { getPublicEmlakPaylasim } from "@/app/services/emlakPaylasimPublic.service";

function formatDate(date) {
  if (!date) return "";

  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}`;
}

export default function TeklifPage() {
  const { token } = useParams();

  const [paylasim, setPaylasim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || typeof token !== "string") return;

    let active = true;

    async function loadPaylasim() {
      setLoading(true);
      setError("");

      try {
        const data = await getPublicEmlakPaylasim(token);

        if (active) {
          setPaylasim(data);
        }
      } catch (err) {
        console.error("Teklif yükleme hatası:", err);

        if (active) {
          setError(
            err.response?.data?.message ||
              "Paylaşım bulunamadı veya bağlantının süresi dolmuş.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPaylasim();

    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Loader2 size={22} className="animate-spin text-blue-600" />
          Villalar yükleniyor...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="flex max-w-md items-start gap-3 rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <AlertCircle size={23} className="shrink-0 text-red-600" />

          <div>
            <h1 className="font-bold text-slate-900">Teklif görüntülenemedi</h1>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  const emlaklar = paylasim?.emlaklar ?? [];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-8 px-5 py-10 sm:py-14">
        {/* HEADER */}
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <House size={25} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {paylasim?.baslik || "Size Özel Villa Önerileri"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Sizin için seçilen konaklama alternatiflerini aşağıda
            inceleyebilirsiniz.
          </p>

          {paylasim?.girisTarihi && paylasim?.cikisTarihi && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              <CalendarDays size={18} />
              {formatDate(paylasim.girisTarihi)}
              {" – "}
              {formatDate(paylasim.cikisTarihi)}
            </div>
          )}
        </header>

        {/* RESULT HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Sizin İçin Seçilen Villalar
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {emlaklar.length} konaklama alternatifi
            </p>
          </div>
        </div>

        {/* VILLA CARDS */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {emlaklar.map((emlak) => (
            <article
              key={emlak.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative h-52 overflow-hidden bg-slate-100">
                {emlak.kapakFotografUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={emlak.kapakFotografUrl}
                    alt={emlak.emlakAdi}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <House size={48} className="text-slate-300" />
                  </div>
                )}
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {emlak.emlakAdi}
                  </h3>

                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin size={14} />
                    Bölge #{emlak.bolgeId}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <UsersRound size={17} className="text-slate-400" />
                    {emlak.kapasite} kişi
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <BedDouble size={17} className="text-slate-400" />
                    {emlak.yatakOdasiSayisi} yatak odası
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Bath size={17} className="text-slate-400" />
                    {emlak.banyoSayisi} banyo
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        {emlaklar.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <House size={30} className="mx-auto text-slate-400" />
            <p className="mt-4 text-sm font-semibold text-slate-800">
              Görüntülenebilecek villa bulunamadı.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Seçilen villalar yayından kaldırılmış olabilir.
            </p>
          </div>
        )}

        <footer className="py-5 text-center text-xs text-slate-400">
          Konaklama seçeneklerinin müsaitlik ve fiyat bilgileri rezervasyon
          öncesinde teyit edilmelidir.
        </footer>
      </div>
    </main>
  );
}
