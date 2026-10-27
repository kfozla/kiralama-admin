"use client";

import Link from "next/link";
import {
  House,
  CalendarCheck2,
  Clock3,
  Wallet,
  ArrowRight,
  Plus,
} from "lucide-react";

import StatCard from "@/components/dashboard/statCard";
import ReservationChart from "@/components/dashboard/reservationChart";
import RecentReservations from "@/components/dashboard/recentReservations";
import QuickActions from "@/components/dashboard/quickActions";

import { useState } from "react";
import { useEffect } from "react";

import { getDashboardSummary } from "@/app/services/dashboard.service";

// Şimdilik tasarım testi için örnek veriler.
// Daha sonra .NET API üzerinden alınacak.

const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const [stats, setStats] = useState({
    toplamEmlak: 0,
    aktifRezervasyon: 0,
    bekleyenRezervasyon: 0,
    buAyRezervasyonTutari: 0,
  });

  useEffect(() => {
    // API'den istatistikleri al
    async function fetchStats() {
      try {
        const data = await getDashboardSummary();
        setStats(data);
      } catch (error) {
        console.error("İstatistikler alınamadı:", error);
      }
    }

    fetchStats();
  }, []);
  return (
    <div className="space-y-7">
      {/* Page introduction */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            Genel Bakış
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Villalarınızın ve rezervasyonlarınızın genel durumu.
          </p>
        </div>

        <Link
          href="/emlaklar/yeni"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Yeni Emlak Ekle
        </Link>
      </div>

      {/* Demo data notice */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
        Önizleme modu: Bu ekrandaki istatistikler ve rezervasyonlar şimdilik
        örnek verilerle gösterilmektedir.
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Toplam Villa"
          value={stats.toplamEmlak}
          description="Sistemde kayıtlı toplam emlak"
          icon={House}
          color="blue"
          href="/emlaklar"
        />

        <StatCard
          title="Aktif Rezervasyon"
          value={stats.aktifRezervasyon}
          description="Onaylanmış rezervasyonlar"
          icon={CalendarCheck2}
          color="green"
          href="/rezervasyonlar"
        />

        <StatCard
          title="Bekleyen Rezervasyon"
          value={stats.bekleyenRezervasyon}
          description="İncelenmesi gereken talepler"
          icon={Clock3}
          color="amber"
          href="/rezervasyonlar"
        />

        <StatCard
          title="Bu Ay Rezervasyon Tutarı"
          value={currencyFormatter.format(stats.buAyRezervasyonTutari)}
          description="Rezervasyon toplamı, tahsilat değil"
          icon={Wallet}
          color="violet"
        />
      </div>

      {/* Analytics and Actions */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <ReservationChart />
        </div>

        <div className="min-w-0">
          <QuickActions />
        </div>
      </div>

      {/* Recent Reservations */}
      <RecentReservations />

      {/* Bottom CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-5 sm:px-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Rezervasyon takvimini kontrol edin
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Dolu, müsait ve bloke tarihleri takvimden görüntüleyin.
          </p>
        </div>

        <Link
          href="/rezervasyonlar/takvim"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50"
        >
          Takvime Git
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
