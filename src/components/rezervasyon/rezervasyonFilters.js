"use client";

import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";

import { REZERVASYON_DURUMLARI } from "@/constants/rezervasyon";

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

const labelClass = "mb-2 block text-xs font-medium text-slate-500";

export default function RezervasyonFilters({ filters, onChange, onReset }) {
  const update = (key, value) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="border-b border-slate-100 p-5 sm:p-6">
      {/* Başlık */}
      <div className="mb-5 flex items-center gap-2">
        <SlidersHorizontal size={18} className="text-blue-600" />

        <h3 className="text-sm font-bold text-slate-800">
          Arama ve Filtreleme
        </h3>
      </div>

      {/* Filtre alanları */}
      <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_190px_165px_165px_44px]">
        {/* ARAMA */}
        <div className="min-w-0">
          <label htmlFor="rez-search" className={labelClass}>
            Rezervasyon Ara
          </label>

          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="rez-search"
              type="search"
              value={filters.search}
              onChange={(e) => update("search", e.target.value)}
              placeholder="Müşteri, emlak veya rezervasyon no..."
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        {/* DURUM */}
        <div className="min-w-0">
          <label htmlFor="rez-status" className={labelClass}>
            Rezervasyon Durumu
          </label>

          <select
            id="rez-status"
            value={filters.durum}
            onChange={(e) => update("durum", e.target.value)}
            className={inputClass}
          >
            <option value="">Tüm Durumlar</option>

            {REZERVASYON_DURUMLARI.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* GİRİŞ TARİHİ BAŞLANGIÇ */}
        <div className="min-w-0">
          <label htmlFor="rez-start" className={labelClass}>
            Giriş - Başlangıç
          </label>

          <input
            id="rez-start"
            type="date"
            value={filters.startDate}
            onChange={(e) => update("startDate", e.target.value)}
            className={inputClass}
          />
        </div>

        {/* GİRİŞ TARİHİ BİTİŞ */}
        <div className="min-w-0">
          <label htmlFor="rez-end" className={labelClass}>
            Giriş - Bitiş
          </label>

          <input
            id="rez-end"
            type="date"
            value={filters.endDate}
            min={filters.startDate || undefined}
            onChange={(e) => update("endDate", e.target.value)}
            className={inputClass}
          />
        </div>

        {/* FİLTRELERİ TEMİZLE */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={onReset}
            aria-label="Filtreleri temizle"
            title="Filtreleri temizle"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
