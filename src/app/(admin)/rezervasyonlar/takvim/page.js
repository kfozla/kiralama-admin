"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LogIn,
  LogOut,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Phone,
  Mail,
  Users,
  House,
  Loader2,
} from "lucide-react";

import VillaSearch from "@/components/rezervasyon/villaSearch";
import { getRezervasyonTakvim } from "@/app/services/rezervasyon.service";

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const STATUS = {
  0: { label: "Beklemede", color: "bg-amber-50 text-amber-700" },
  1: { label: "Onaylandı", color: "bg-emerald-50 text-emerald-700" },
  2: { label: "İptal Edildi", color: "bg-red-50 text-red-700" },
  3: { label: "Tamamlandı", color: "bg-slate-100 text-slate-600" },
};

function getToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function dateOnly(value) {
  return typeof value === "string" ? value.slice(0, 10) : "";
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(`${dateOnly(value)}T12:00:00Z`).toLocaleDateString("tr-TR", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function monthTitle(year, month) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("tr-TR", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
}

function getMonthDays(year, month) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Array(offset).fill(null);
  for (let day = 1; day <= count; day++) {
    cells.push(
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function StatCard({ title, value, Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div
        className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${color}`}
      >
        <Icon size={21} />
      </div>
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ReservationList({ title, items, Icon, color }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
          >
            <Icon size={19} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {items.length} rezervasyon
            </p>
          </div>
        </div>
        <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[140px] flex-col items-center justify-center gap-2 p-6 text-slate-400">
          <CalendarDays size={28} strokeWidth={1.5} />
          <p className="text-sm">Bu gün için kayıt bulunmuyor.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <th className="px-5 py-4">Müşteri</th>
                <th className="px-5 py-4">İletişim</th>
                <th className="px-5 py-4">Villa</th>
                <th className="px-5 py-4">Tarihler</th>
                <th className="px-5 py-4">Kişi</th>
                <th className="px-5 py-4">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((r) => {
                const durum = STATUS[Number(r.durum)] ?? STATUS[0];
                return (
                  <tr key={r.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-slate-900">
                        {r.musteriAd} {r.musteriSoyad}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Rezervasyon #{r.id}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        {r.telefon ? (
                          <a
                            href={`tel:${r.telefon.replace(/[^+\d]/g, "")}`}
                            className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600"
                          >
                            <Phone size={14} className="text-slate-400" />
                            {r.telefon}
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Telefon belirtilmemiş
                          </span>
                        )}
                        {r.email ? (
                          <a
                            href={`mailto:${r.email}`}
                            className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600"
                          >
                            <Mail size={14} />
                            {r.email}
                          </a>
                        ) : (
                          <span className="block text-xs text-slate-400">
                            E-posta yok
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/emlaklar/${r.emlakId}/takvim`}
                        className="group inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        <House size={16} />
                        <span className="max-w-[180px] truncate group-hover:underline">
                          {r.emlakAdi || `Villa #${r.emlakId}`}
                        </span>
                        <ArrowRight
                          size={14}
                          className="transition group-hover:translate-x-0.5"
                        />
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1.5 text-xs">
                        <p className="text-slate-700">
                          <span className="font-semibold text-blue-600">
                            Giriş:{" "}
                          </span>
                          {formatDate(r.girisTarihi)}
                        </p>
                        <p className="text-slate-700">
                          <span className="font-semibold text-amber-600">
                            Çıkış:{" "}
                          </span>
                          {formatDate(r.cikisTarihi)}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <Users size={15} className="text-slate-400" />
                        {r.kisiSayisi}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold ${durum.color}`}
                      >
                        {durum.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function RezervasyonTakvimPage() {
  const [today] = useState(getToday);
  const [initialYear, initialMonth] = today.split("-").map(Number);
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState(today);
  const [reservations, setReservations] = useState([]);
  const [villaFilter, setVillaFilter] = useState("");
  const [showPending, setShowPending] = useState(false);
  const [todayEntries, setTodayEntries] = useState(0);
  const [todayExits, setTodayExits] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadMonth() {
      setLoading(true);
      setError("");
      try {
        const data = await getRezervasyonTakvim(
          {
            year,
            month,
            today,
            showPending,
            ...(villaFilter ? { emlakId: Number(villaFilter) } : {}),
          },
          controller.signal,
        );
        if (!active) return;
        setReservations(
          Array.isArray(data?.reservations) ? data.reservations : [],
        );
        setTodayEntries(Number(data?.todayEntries ?? 0));
        setTodayExits(Number(data?.todayExits ?? 0));
        setPendingCount(Number(data?.pendingCount ?? 0));
      } catch (err) {
        if (
          !active ||
          controller.signal.aborted ||
          err?.code === "ERR_CANCELED"
        )
          return;
        setReservations([]);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Takvim bilgileri yüklenemedi.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMonth();
    return () => {
      active = false;
      controller.abort();
    };
  }, [year, month, today, villaFilter, showPending, reloadKey]);

  const calendarCounts = useMemo(() => {
    const counts = {};
    for (const r of reservations) {
      const giris = dateOnly(r.girisTarihi);
      const cikis = dateOnly(r.cikisTarihi);
      if (giris) {
        if (!counts[giris]) counts[giris] = { entries: 0, exits: 0 };
        counts[giris].entries += 1;
      }
      if (cikis) {
        if (!counts[cikis]) counts[cikis] = { entries: 0, exits: 0 };
        counts[cikis].exits += 1;
      }
    }
    return counts;
  }, [reservations]);

  const selectedEntries = useMemo(
    () => reservations.filter((r) => dateOnly(r.girisTarihi) === selectedDay),
    [reservations, selectedDay],
  );
  const selectedExits = useMemo(
    () => reservations.filter((r) => dateOnly(r.cikisTarihi) === selectedDay),
    [reservations, selectedDay],
  );
  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  function changeMonth(offset) {
    const next = new Date(Date.UTC(year, month - 1 + offset, 1));
    const nextYear = next.getUTCFullYear();
    const nextMonth = next.getUTCMonth() + 1;
    setYear(nextYear);
    setMonth(nextMonth);
    setSelectedDay(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01`);
  }

  function goToday() {
    setYear(initialYear);
    setMonth(initialMonth);
    setSelectedDay(today);
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/rezervasyonlar" className="hover:text-blue-600">
              Rezervasyonlar
            </Link>
            <ArrowRight size={14} />
            <span className="text-slate-800">Takvim</span>
          </div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
            <CalendarDays className="text-blue-600" />
            Rezervasyon Takvimi
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Misafir giriş ve çıkışlarını takvim üzerinden takip edin.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Yenile
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Bugünkü Girişler"
          value={loading ? "—" : todayEntries}
          Icon={LogIn}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Bugünkü Çıkışlar"
          value={loading ? "—" : todayExits}
          Icon={LogOut}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Bekleyen Talepler"
          value={loading ? "—" : pendingCount}
          Icon={Clock3}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
        <VillaSearch value={villaFilter} onChange={setVillaFilter} />
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
          <input
            type="checkbox"
            checked={showPending}
            onChange={(e) => setShowPending(e.target.checked)}
            className="h-4 w-4 accent-blue-600"
          />
          Bekleyen rezervasyonları da göster
        </label>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-bold capitalize text-slate-900">
              {monthTitle(year, month)}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Giriş ve çıkış detaylarını görmek için güne tıklayın.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToday}
              className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold hover:bg-slate-50"
            >
              Bugün
            </button>
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Önceki ay"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Sonraki ay"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-5">
          <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
            {DAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-bold text-slate-400"
              >
                {day}
              </div>
            ))}
          </div>
          {loading ? (
            <div className="flex min-h-[420px] items-center justify-center gap-3 text-slate-500">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span className="text-sm">Takvim yükleniyor...</span>
            </div>
          ) : error ? (
            <div className="flex min-h-[260px] items-center justify-center text-sm text-red-600">
              Takvim verisi alınamadı.
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {days.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} />;
                const counts = calendarCounts[day] ?? { entries: 0, exits: 0 };
                const selected = selectedDay === day;
                const isToday = day === today;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    aria-pressed={selected}
                    className={`flex min-h-[95px] flex-col rounded-xl border p-1.5 text-left transition sm:min-h-[125px] sm:p-3 ${selected ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-100 hover:border-blue-300 hover:bg-slate-50"}`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold sm:text-sm ${isToday ? "bg-blue-600 text-white" : "text-slate-800"}`}
                    >
                      {Number(day.slice(-2))}
                    </span>
                    <div className="mt-3 w-full space-y-1.5">
                      {counts.entries > 0 && (
                        <div className="flex items-center gap-1 rounded-md bg-blue-100 px-1.5 py-1.5 text-[10px] font-bold text-blue-700 sm:text-xs">
                          <LogIn size={12} className="shrink-0" />
                          <span className="hidden sm:inline">
                            {counts.entries} Giriş
                          </span>
                          <span className="sm:hidden">{counts.entries}</span>
                        </div>
                      )}
                      {counts.exits > 0 && (
                        <div className="flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-1.5 text-[10px] font-bold text-amber-700 sm:text-xs">
                          <LogOut size={12} className="shrink-0" />
                          <span className="hidden sm:inline">
                            {counts.exits} Çıkış
                          </span>
                          <span className="sm:hidden">{counts.exits}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-slate-100 pt-4">
            <span className="flex items-center gap-2 text-xs text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              Girişler
            </span>
            <span className="flex items-center gap-2 text-xs text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Çıkışlar
            </span>
          </div>
        </div>
      </section>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Günlük Rezervasyonlar
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {formatDate(selectedDay)}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Seçilen tarihte giriş ve çıkış yapacak müşteriler.
            </p>
          </div>
          {!loading && !error && (
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                {selectedEntries.length} Giriş
              </span>
              <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                {selectedExits.length} Çıkış
              </span>
            </div>
          )}
        </div>
        {loading ? (
          <div className="flex min-h-40 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin text-blue-600" />
            Günlük rezervasyonlar yükleniyor...
          </div>
        ) : !error ? (
          <>
            <ReservationList
              title="Giriş Yapacaklar"
              items={selectedEntries}
              Icon={LogIn}
              color="bg-blue-50 text-blue-600"
            />
            <ReservationList
              title="Çıkış Yapacaklar"
              items={selectedExits}
              Icon={LogOut}
              color="bg-amber-50 text-amber-600"
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
