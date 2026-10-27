"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, UsersRound, RefreshCw } from "lucide-react";

import { getRecentReservations } from "@/app/services/dashboard.service";

const statusConfig = {
  0: {
    label: "Beklemede",
    style: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  1: {
    label: "Onaylandı",
    style: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  2: {
    label: "İptal Edildi",
    style: "bg-red-50 text-red-700 ring-red-200",
  },
  3: {
    label: "Tamamlandı",
    style: "bg-blue-50 text-blue-700 ring-blue-200",
  },
};

function formatDate(date) {
  if (!date) return "-";

  // Backend DateOnly: YYYY-MM-DD
  const [year, month, day] = date.slice(0, 10).split("-");

  if (!year || !month || !day) return "-";

  return `${day}.${month}.${year}`;
}

export default function RecentReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchReservations = async () => {
      try {
        const data = await getRecentReservations();

        if (!active) return;

        setReservations(Array.isArray(data) ? data : []);
        setError("");
      } catch (err) {
        if (!active) return;

        console.error("Son rezervasyonlar alınamadı:", err);
        setError("Rezervasyonlar yüklenirken bir hata oluştu.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchReservations();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Son Rezervasyonlar
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            En son oluşturulan 5 rezervasyon kaydı
          </p>
        </div>

        <Link
          href="/rezervasyonlar"
          className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          Tümünü Gör
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[690px] text-left">
          <thead className="bg-slate-50/80">
            <tr className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              <th className="px-6 py-4">Emlak</th>
              <th className="px-6 py-4">Misafir</th>
              <th className="px-6 py-4">Konaklama</th>
              <th className="px-6 py-4">Durum</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  {Array.from({ length: 4 }).map((_, col) => (
                    <td key={col} className="px-6 py-5">
                      <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center">
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <RefreshCw size={15} />
                    Tekrar Dene
                  </button>
                </td>
              </tr>
            ) : reservations.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-sm text-slate-400"
                >
                  Henüz rezervasyon bulunmuyor.
                </td>
              </tr>
            ) : (
              reservations.map((item) => {
                const status = statusConfig[item.durum] ?? {
                  label: "Bilinmiyor",
                  style: "bg-slate-50 text-slate-600 ring-slate-200",
                };

                return (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/emlaklar/${item.emlakId}`}
                        className="text-sm font-semibold text-slate-800 hover:text-blue-600"
                      >
                        {item.emlakAdi || "Emlak bulunamadı"}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <UsersRound
                          size={16}
                          className="shrink-0 text-slate-400"
                        />
                        {item.musteriAdi || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs whitespace-nowrap text-slate-600">
                        <CalendarDays
                          size={15}
                          className="shrink-0 text-slate-400"
                        />
                        {formatDate(item.girisTarihi)}
                        {" - "}
                        {formatDate(item.cikisTarihi)}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${status.style}`}
                      >
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
