"use client";

import { useEffect, useState } from "react";

import {
  CalendarDays,
  House,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { getRezervasyonDurumu, getDurumClass } from "@/constants/rezervasyon";

import { calculateNights, formatDate, formatMoney } from "@/utils/rezervasyon";

import RezervasyonActions from "./rezervasyonActions";

export default function RezervasyonTable({
  reservations,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onDetail,
  onAction,
  actionLoading = false,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;

  const end = Math.min(page * pageSize, totalItems);

  const [pageInput, setPageInput] = useState(String(page));

  // Mevcut sayfa değişince inputu güncelle
  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  // Girilen sayfa numarasına git
  const goToPage = (value) => {
    const inputValue = String(value).trim();

    if (!/^\d+$/.test(inputValue)) {
      setPageInput(String(page));
      return;
    }

    const requestedPage = Number(inputValue);

    if (!Number.isSafeInteger(requestedPage)) {
      setPageInput(String(page));
      return;
    }

    const targetPage = Math.min(Math.max(requestedPage, 1), totalPages);

    setPageInput(String(targetPage));

    if (targetPage !== page) {
      onPageChange(targetPage);
    }
  };

  // Sayfa numarası inputu
  const handlePageInputKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      goToPage(pageInput);

      event.currentTarget.blur();
    }

    if (event.key === "Escape") {
      setPageInput(String(page));

      event.currentTarget.blur();
    }
  };

  // Pagination butonları
  const changePage = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) {
      return;
    }

    setPageInput(String(newPage));
    onPageChange(newPage);
  };

  const paginationButtonClass =
    "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600";

  return (
    <>
      {/* TABLE */}
      <div className="w-full overflow-x-auto pb-3">
        <table className="w-full min-w-[1200px] text-left">
          <thead className="bg-slate-50">
            <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-4">Müşteri Adı</th>

              <th className="px-5 py-4">Emlak</th>

              <th className="px-5 py-4">Giriş Tarihi</th>

              <th className="px-5 py-4">Çıkış Tarihi</th>

              <th className="px-5 py-4 text-center">Gece</th>

              <th className="px-5 py-4 text-center">Kişi</th>

              <th className="px-5 py-4">Tutar</th>

              <th className="px-5 py-4">Durum</th>

              <th className="w-24 px-5 py-4 text-center">İşlemler</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {reservations.map((item) => {
              const girisTarihi = item.girisTarihi ?? item.baslangicTarihi;

              const cikisTarihi = item.cikisTarihi ?? item.bitisTarihi;

              const nights = calculateNights(girisTarihi, cikisTarihi);

              const emlakName =
                item.emlakAdi || `Emlak #${item.emlakId ?? "-"}`;

              const musteriAdi =
                item.musteriAdSoyad ||
                [item.musteriAd, item.musteriSoyad].filter(Boolean).join(" ") ||
                "-";

              return (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-slate-50/70"
                >
                  {/* Müşteri */}
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => onDetail(item)}
                        className="cursor-pointer text-left text-sm font-semibold text-slate-800 transition hover:text-blue-600"
                      >
                        {musteriAdi}
                      </button>

                      <p className="text-xs text-slate-400">
                        Rezervasyon #{item.id}
                      </p>
                    </div>
                  </td>

                  {/* Emlak */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <House size={18} />
                      </div>

                      <span className="max-w-[190px] truncate text-sm font-semibold text-slate-800">
                        {emlakName}
                      </span>
                    </div>
                  </td>

                  {/* Giriş Tarihi */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap text-sm text-slate-700">
                      <CalendarDays
                        size={16}
                        className="shrink-0 text-emerald-500"
                      />

                      {formatDate(girisTarihi)}
                    </div>
                  </td>

                  {/* Çıkış Tarihi */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap text-sm text-slate-700">
                      <CalendarDays
                        size={16}
                        className="shrink-0 text-orange-500"
                      />

                      {formatDate(cikisTarihi)}
                    </div>
                  </td>

                  {/* Gece Sayısı */}
                  <td className="px-5 py-4 text-center text-sm text-slate-700">
                    {nights ?? "-"}
                  </td>

                  {/* Kişi Sayısı */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1.5 text-sm text-slate-700">
                      <Users size={15} className="text-slate-400" />

                      {item.kisiSayisi ?? "-"}
                    </div>
                  </td>

                  {/* Tutar */}
                  <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                    {formatMoney(item.toplamTutar ?? 0)}
                  </td>

                  {/* Durum */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getDurumClass(
                        item.durum,
                      )}`}
                    >
                      {getRezervasyonDurumu(item.durum)}
                    </span>
                  </td>

                  {/* İşlemler */}
                  <td className="w-24 px-5 py-4">
                    <div className="flex justify-center">
                      <RezervasyonActions
                        item={item}
                        onDetail={onDetail}
                        onAction={onAction}
                        disabled={actionLoading}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Boş Liste */}
        {reservations.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <CalendarDays size={30} />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-800">
              Rezervasyon bulunamadı
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Arama veya filtre kriterlerini değiştirebilirsiniz.
            </p>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:px-6">
        {/* Kayıt bilgisi */}
        <p className="text-xs text-slate-500">
          Toplam{" "}
          <span className="font-semibold text-slate-700">{totalItems}</span>{" "}
          kayıttan{" "}
          <span className="font-semibold text-slate-700">
            {start}–{end}
          </span>{" "}
          arası gösteriliyor
        </p>

        {/* Sayfa Kontrolleri */}
        <div className="flex items-center gap-2">
          {/* İlk Sayfa */}
          <button
            type="button"
            onClick={() => changePage(1)}
            disabled={page <= 1}
            title="İlk sayfa"
            aria-label="İlk sayfa"
            className={paginationButtonClass}
          >
            <ChevronsLeft size={18} />
          </button>

          {/* Önceki Sayfa */}
          <button
            type="button"
            onClick={() => changePage(page - 1)}
            disabled={page <= 1}
            title="Önceki sayfa"
            aria-label="Önceki sayfa"
            className={paginationButtonClass}
          >
            <ChevronLeft size={18} />
          </button>

          {/* Sayfa Numarası */}
          <div className="flex items-center gap-2 px-1">
            <input
              type="number"
              min={1}
              max={totalPages}
              step={1}
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value)}
              onKeyDown={handlePageInputKeyDown}
              onBlur={() => setPageInput(String(page))}
              aria-label="Gitmek istediğiniz sayfa numarası"
              title="Sayfa numarasını yazıp Enter'a basın"
              className="h-9 w-16 rounded-lg border border-slate-200 bg-white px-2 text-center text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />

            <span className="whitespace-nowrap text-xs font-medium text-slate-500">
              / {totalPages}
            </span>
          </div>

          {/* Sonraki Sayfa */}
          <button
            type="button"
            onClick={() => changePage(page + 1)}
            disabled={page >= totalPages}
            title="Sonraki sayfa"
            aria-label="Sonraki sayfa"
            className={paginationButtonClass}
          >
            <ChevronRight size={18} />
          </button>

          {/* Son Sayfa */}
          <button
            type="button"
            onClick={() => changePage(totalPages)}
            disabled={page >= totalPages}
            title="Son sayfa"
            aria-label="Son sayfa"
            className={paginationButtonClass}
          >
            <ChevronsRight size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
