"use client";

import { useEffect, useState } from "react";

import {
  UserRound,
  Phone,
  Mail,
  House,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import EmlakSahibiActions from "./emlakSahibiActions";

export default function EmlakSahibiTable({
  owners,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onDetail,
  onEdit,
  onDelete,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;

  const end = Math.min(page * pageSize, totalItems);

  // Manuel sayfa numarası
  const [pageInput, setPageInput] = useState(String(page));

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Sayfa numarasını doğrula ve yönlendir
  const goToPage = (value) => {
    const input = String(value).trim();

    if (!/^\d+$/.test(input)) {
      setPageInput(String(page));
      return;
    }

    const requestedPage = Number(input);

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
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-slate-50">
            <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-6 py-4">Emlak Sahibi</th>

              <th className="px-6 py-4">Telefon</th>

              <th className="px-6 py-4">E-posta</th>

              <th className="px-6 py-4 text-center">Emlak Sayısı</th>

              <th className="px-6 py-4">Kayıt Tarihi</th>

              <th className="w-28 px-6 py-4 text-center">İşlemler</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {owners.map((owner) => {
              const registrationDate = owner.kayitTarihi
                ? new Date(owner.kayitTarihi)
                : null;

              return (
                <tr
                  key={owner.id}
                  className="transition-colors hover:bg-slate-50/70"
                >
                  {/* Emlak Sahibi */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <UserRound size={21} />
                      </div>

                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate text-sm font-bold text-slate-900">
                          {owner.ad} {owner.soyad}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          #{owner.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Telefon */}
                  <td className="px-6 py-4">
                    {owner.telefon ? (
                      <a
                        href={`tel:${owner.telefon.replace(/[^+\d]/g, "")}`}
                        className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-blue-600"
                      >
                        <Phone size={15} className="shrink-0 text-slate-400" />

                        {owner.telefon}
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>

                  {/* E-posta */}
                  <td className="px-6 py-4">
                    {owner.email ? (
                      <a
                        href={`mailto:${owner.email}`}
                        className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-blue-600"
                      >
                        <Mail size={15} className="shrink-0 text-slate-400" />

                        <span className="block max-w-48 truncate">
                          {owner.email}
                        </span>
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>

                  {/* Emlak Sayısı */}
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                      <House size={14} />

                      {owner.emlakSayisi ?? 0}
                    </span>
                  </td>

                  {/* Kayıt Tarihi */}
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {registrationDate &&
                    !Number.isNaN(registrationDate.getTime())
                      ? dateFormatter.format(registrationDate)
                      : "-"}
                  </td>

                  {/* İşlemler */}
                  <td className="w-28 px-6 py-4">
                    <div className="flex justify-center">
                      <EmlakSahibiActions
                        owner={owner}
                        onDetail={onDetail}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty State */}
        {owners.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <UserRound size={26} />
            </div>

            <p className="text-sm font-semibold text-slate-800">
              Emlak sahibi bulunamadı
            </p>

            <p className="max-w-sm text-xs leading-5 text-slate-500">
              Arama kriterini değiştirebilir veya yeni emlak sahibi
              ekleyebilirsiniz.
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

        {/* Sayfalama Kontrolleri */}
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
