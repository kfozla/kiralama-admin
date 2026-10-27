"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  House,
  MapPin,
  UsersRound,
  BedDouble,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Images,
  Play,
  Pause,
  Loader2,
} from "lucide-react";

import EmlakActions from "./emlakActions";
import { updateEmlakYayinDurumu } from "@/app/services/emlak.service";

export default function EmlakTable({
  emlaklar,

  onDelete,

  page,

  pageSize,

  totalItems,

  onPageChange,

  onEdit,

  onDetail,

  onYayinDurumuChange,
}) {
  const [updatingId, setUpdatingId] = useState(null);
  const [yayinOverrides, setYayinOverrides] = useState({});
  const [yayinError, setYayinError] = useState("");

  async function handleYayinDurumu(emlak) {
    if (updatingId !== null) return;

    const mevcutDurum = yayinOverrides[emlak.id] ?? emlak.yayinda === true;
    const yeniDurum = !mevcutDurum;

    setUpdatingId(emlak.id);
    setYayinError("");

    try {
      await updateEmlakYayinDurumu(emlak.id, yeniDurum);
      setYayinOverrides((prev) => ({
        ...prev,
        [emlak.id]: yeniDurum,
      }));
      // Parent isterse listeyi API'den yenileyebilir.
      // Callback başarısız olsa bile API kaydı başarılıdır.
      if (onYayinDurumuChange) {
        try {
          await onYayinDurumuChange(emlak.id, yeniDurum);
        } catch (refreshError) {
          console.error(
            "Yayın durumu sonrası liste yenilenemedi:",
            refreshError,
          );
        }
      }
    } catch (error) {
      console.error("Yayın durumu güncelleme hatası:", error);
      setYayinError(
        error?.response?.data?.message ||
          error?.response?.data?.title ||
          "Yayın durumu değiştirilemedi. Tekrar deneyin.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;

  const end = Math.min(page * pageSize, totalItems);

  // Kullanıcının yazdığı sayfa numarası

  const [pageInput, setPageInput] = useState(String(page));

  // Sayfa değişince input güncellensin

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  // Sayfaya git

  const goToPage = (value) => {
    const inputValue = String(value).trim();

    // Boş, negatif veya geçersiz değer kontrolü

    if (!/^\d+$/.test(inputValue)) {
      setPageInput(String(page));

      return;
    }

    const requestedPage = Number(inputValue);

    if (!Number.isSafeInteger(requestedPage)) {
      setPageInput(String(page));

      return;
    }

    // Minimum 1, maksimum toplam sayfa

    const targetPage = Math.min(Math.max(requestedPage, 1), totalPages);

    setPageInput(String(targetPage));

    if (targetPage !== page) {
      onPageChange(targetPage);
    }
  };

  // Enter tuşuyla sayfa değiştir

  const handlePageInputKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      goToPage(pageInput);

      event.currentTarget.blur();
    }

    // Escape ile mevcut sayfaya dön

    if (event.key === "Escape") {
      setPageInput(String(page));

      event.currentTarget.blur();
    }
  };

  // Butonlarla sayfa değiştir

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) {
      return;
    }

    setPageInput(String(newPage));

    onPageChange(newPage);
  };

  const paginationButtonClass =
    "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600";

  function getImageUrl(path) {
    if (!path) return null;

    if (/^https?:\/\//i.test(path)) return path;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) return path;

    const origin = new URL(apiUrl).origin;

    return `${origin}/${path.replace(/^\/+/, "")}`;
  }

  return (
    <div>
      {yayinError && (
        <div
          role="alert"
          className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {yayinError}
        </div>
      )}
      {/* Table */}

      <div className="w-full overflow-x-auto pb-3">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-slate-50">
            <tr className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              <th className="px-6 py-4">Emlak</th>

              <th className="px-6 py-4">Bölge</th>

              <th className="px-6 py-4">Tip</th>

              <th className="px-6 py-4">Kapasite</th>

              <th className="px-6 py-4 text-center"> Fotoğraflar</th>

              <th className="px-6 py-4">Takvim</th>

              <th className="w-36 px-6 py-4 text-right">İşlemler</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {emlaklar.map((emlak) => (
              <tr
                key={emlak.id}
                className="transition-colors hover:bg-slate-50/70"
              >
                {/* Emlak */}

                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {/* Kapak Fotoğrafı */}

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                      {emlak.kapakFotografUrl ? (
                        <img
                          src={getImageUrl(emlak.kapakFotografUrl)}
                          alt={`${emlak.emlakAdi} kapak fotoğrafı`}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";

                            e.currentTarget.nextElementSibling?.classList.remove(
                              "hidden",
                            );
                          }}
                        />
                      ) : null}

                      <House
                        size={22}
                        className={
                          emlak.kapakFotografUrl
                            ? "hidden shrink-0 text-slate-400"
                            : "shrink-0 text-slate-400"
                        }
                      />
                    </div>

                    {/* Emlak Bilgileri */}

                    <div className="min-w-0">
                      <Link
                        href={`/emlaklar/${emlak.id}`}
                        className="block max-w-[190px] truncate text-sm font-bold text-slate-900 hover:text-blue-600"
                      >
                        {emlak.emlakAdi}
                      </Link>

                      <p className="mt-1 text-xs text-slate-400">#{emlak.id}</p>
                    </div>
                  </div>
                </td>

                {/* Bölge */}

                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <MapPin size={15} className="shrink-0 text-slate-400" />

                    <span className="max-w-[150px] truncate">
                      {emlak.bolgeAdi || "-"}
                    </span>
                  </div>
                </td>

                {/* Tip */}

                <td className="px-6 py-4">
                  <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {emlak.emlakTipiAdi ?? emlak.emlakTipi ?? "-"}
                  </span>
                </td>

                {/* Kapasite */}

                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <UsersRound size={16} className="text-slate-400" />

                    {emlak.kapasite ?? "-"}
                  </div>
                </td>

                {/* Fotoğraflar */}

                <td className="px-5 py-4">
                  <div className="flex justify-center">
                    <Link
                      href={`/emlaklar/${emlak.id}/fotograflar`}
                      title={`${emlak.emlakAdi || "Emlak"} fotoğraflarını yönet`}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 text-xs font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100"
                    >
                      <Images size={16} />
                      Fotoğraflar
                    </Link>
                  </div>
                </td>

                {/* Takvim */}

                <td className="px-5 py-4">
                  <div className="flex justify-center">
                    <Link
                      href={`/emlaklar/${emlak.id}/takvim`}
                      title={`${emlak.emlakAdi || "Emlak"} takvimini aç`}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      <CalendarDays size={16} />
                      Takvim
                    </Link>
                  </div>
                </td>

                {/* Actions */}
                <td className="w-36 px-6 py-4 text-right">
                  <div className="flex items-center justify-center gap-2">
                    {(() => {
                      const yayinda =
                        yayinOverrides[emlak.id] ?? emlak.yayinda === true;
                      const isUpdating = updatingId === emlak.id;
                      return (
                        <button
                          type="button"
                          onClick={() => handleYayinDurumu(emlak)}
                          disabled={updatingId !== null}
                          title={yayinda ? "Yayından kaldır" : "Yayına al"}
                          aria-label={`${emlak.emlakAdi}: ${yayinda ? "Yayından kaldır" : "Yayına al"}`}
                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            yayinda
                              ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {isUpdating ? (
                            <Loader2 size={17} className="animate-spin" />
                          ) : yayinda ? (
                            <Pause size={17} fill="currentColor" />
                          ) : (
                            <Play size={17} fill="currentColor" />
                          )}
                        </button>
                      );
                    })()}
                    <EmlakActions
                      emlak={emlak}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      onDetail={onDetail}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}

        {emlaklar.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <House size={26} />
            </div>

            <p className="text-sm font-semibold text-slate-800">
              Emlak bulunamadı
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Arama veya filtrelerinizi değiştirebilirsiniz.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}

      <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:px-6">
        {/* Kayıt bilgisi */}

        <p className="text-xs text-slate-500">
          Toplam{" "}
          <span className="font-semibold text-slate-700">{totalItems}</span>{" "}
          emlaktan{" "}
          <span className="font-semibold text-slate-700">
            {start}–{end}
          </span>{" "}
          arası gösteriliyor
        </p>

        {/* Pagination Controls */}

        <div className="flex items-center gap-2">
          {/* İlk Sayfa */}

          <button
            type="button"
            onClick={() => handlePageChange(1)}
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
            onClick={() => handlePageChange(page - 1)}
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
              onChange={(e) => setPageInput(e.target.value)}
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
            onClick={() => handlePageChange(page + 1)}
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
            onClick={() => handlePageChange(totalPages)}
            disabled={page >= totalPages}
            title="Son sayfa"
            aria-label="Son sayfa"
            className={paginationButtonClass}
          >
            <ChevronsRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
