"use client";

import { ListChecks, ChevronLeft, ChevronRight } from "lucide-react";

import { getKategoriAdi, getKategoriClass } from "@/constants/emlakOzellik";

import EmlakOzellikActions from "./emlakOzellikActions";

export default function EmlakOzellikTable({
  features,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onEdit,
  onDelete,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;

  const end = Math.min(page * pageSize, totalItems);

  function getLogoUrl(path) {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return path;

    return `${new URL(apiUrl).origin}/${path.replace(/^\/+/, "")}`;
  }

  return (
    <>
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[650px] text-left">
          <thead className="bg-slate-50">
            <tr className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              <th className="w-24 px-6 py-4">ID</th>
              <th className="px-6 py-4">Özellik Adı</th>
              <th className="px-6 py-4">Kategori</th>
              <th className="w-28 px-6 py-4 text-center">İşlemler</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {features.map((feature) => (
              <tr
                key={feature.id}
                className="transition-colors hover:bg-slate-50/70"
              >
                <td className="px-6 py-4">
                  <span className="text-xs font-medium text-slate-400">
                    #{feature.id}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-blue-50 text-blue-600">
                      {feature.logoUrl ? (
                        <img
                          src={getLogoUrl(feature.logoUrl)}
                          alt={`${feature.ozellikAdi} logosu`}
                          loading="lazy"
                          className="h-full w-full object-contain p-2"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                            event.currentTarget.nextElementSibling?.classList.remove(
                              "hidden",
                            );
                          }}
                        />
                      ) : null}

                      <ListChecks
                        size={19}
                        className={
                          feature.logoUrl ? "hidden shrink-0" : "shrink-0"
                        }
                      />
                    </div>

                    <span className="text-sm font-semibold text-slate-900">
                      {feature.ozellikAdi}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getKategoriClass(
                      feature.kategori,
                    )}`}
                  >
                    {getKategoriAdi(feature.kategori)}
                  </span>
                </td>

                <td className="w-28 px-6 py-4">
                  <div className="flex justify-center">
                    <EmlakOzellikActions
                      feature={feature}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {features.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ListChecks size={27} />
            </div>

            <p className="text-sm font-semibold text-slate-800">
              Özellik bulunamadı
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Filtrelerinizi değiştirebilir veya yeni özellik ekleyebilirsiniz.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:px-6">
        <p className="text-xs text-slate-500">
          Toplam {totalItems} kayıttan {start}–{end} arası gösteriliyor
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Önceki sayfa"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="px-2 text-xs font-semibold text-slate-600">
            {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Sonraki sayfa"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
