"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  House,
  Users,
  BedDouble,
  Bath,
  MapPin,
  ChevronRight,
  CalendarDays,
} from "lucide-react";

import {
  getEmlakAdi,
  getEmlakTipiAdi,
  getYatakOdasi,
  getBanyoSayisi,
  formatValue,
} from "@/utils/emlakDetail";

export default function EmlakDetailHeader({ emlak, bolgeAdi }) {
  const stats = [
    {
      label: "Kapasite",
      value: formatValue(emlak.kapasite, " Kişi"),
      icon: Users,
    },
    {
      label: "Yatak Odası",
      value: formatValue(getYatakOdasi(emlak)),
      icon: BedDouble,
    },
    {
      label: "Banyo",
      value: formatValue(getBanyoSayisi(emlak)),
      icon: Bath,
    },
    {
      label: "Havuz",
      value: Array.isArray(emlak.havuzBilgileri)
        ? String(emlak.havuzBilgileri.length)
        : "Belirtilmemiş",
      icon: House,
    },
  ];

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/emlaklar" className="transition hover:text-blue-600">
          Emlaklar
        </Link>

        <ChevronRight size={15} />

        <span className="truncate font-medium text-slate-800">
          {getEmlakAdi(emlak)}
        </span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <House size={25} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
                {getEmlakAdi(emlak)}
              </h1>

              <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                {getEmlakTipiAdi(emlak.emlakTipi)}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <MapPin size={15} />
                {bolgeAdi || "Bölge belirtilmemiş"}
              </span>

              <span className="text-slate-300">•</span>

              <span>Emlak #{emlak.id}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/emlaklar"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Listeye Dön
          </Link>

          <Link
            href={`/emlaklar/${emlak.id}/duzenle`}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Pencil size={17} />
            Düzenle
          </Link>
          <Link
            href={`/emlaklar/${emlak.id}/takvim`}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-yellow-500 px-4 text-sm font-semibold text-white transition hover:bg-yellow-600"
          >
            <CalendarDays size={17} />
            Takvim
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-blue-600">
                <Icon size={20} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs text-slate-500">{stat.label}</p>

                <p className="mt-1 text-base font-bold text-slate-900">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
