"use client";

import { CalendarRange, Plus, Pencil, Trash2, Wallet } from "lucide-react";

import {
  formatCalendarDate,
  formatPrice,
  addDays,
} from "@/utils/emlakCalendar";

export default function EmlakFiyatTable({
  prices = [],
  onAdd,
  onEdit,
  onDelete,
  disabled = false,
}) {
  const sortedPrices = [...prices].sort((a, b) =>
    a.baslangicTarihi.localeCompare(b.baslangicTarihi),
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Başlık */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Wallet size={21} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Fiyat Dönemleri
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Emlağın gecelik fiyatlarını yönetin.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus size={17} />
          Yeni Fiyat Ekle
        </button>
      </div>

      {sortedPrices.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <CalendarRange size={26} />
          </div>

          <h3 className="text-sm font-bold text-slate-800">
            Henüz fiyat tanımlanmamış
          </h3>

          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Bu emlak için tarih aralıklarına göre gecelik fiyatlar
            oluşturabilirsiniz.
          </p>

          <button
            type="button"
            disabled={disabled}
            onClick={onAdd}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            <Plus size={16} />
            İlk Fiyatı Ekle
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4">Başlangıç Tarihi</th>

                <th className="px-6 py-4">Bitiş Tarihi</th>

                <th className="px-6 py-4">Gecelik Fiyat</th>

                <th className="px-6 py-4 text-center">Gece Sayısı</th>

                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {sortedPrices.map((item) => {
                const start = item.baslangicTarihi.slice(0, 10);
                const end = item.bitisTarihi.slice(0, 10);

                const nights = Math.round(
                  (Date.parse(`${end}T00:00:00Z`) -
                    Date.parse(`${start}T00:00:00Z`)) /
                    86400000,
                );

                return (
                  <tr key={item.id} className="transition hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-800">
                        {formatCalendarDate(start)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-700">
                        {formatCalendarDate(end)}
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        Son gece: {formatCalendarDate(addDays(end, -1))}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                        {formatPrice(item.gecelikFiyat)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-slate-600">
                        {nights > 0 ? nights : "—"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onEdit(item)}
                          title="Fiyatı düzenle"
                          aria-label="Fiyatı düzenle"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onDelete(item)}
                          title="Fiyatı sil"
                          aria-label="Fiyatı sil"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
        <p className="text-xs leading-5 text-slate-500">
          Bitiş tarihi fiyatlandırmaya dahil değildir. Aynı emlak için fiyat
          dönemleri birbiriyle çakışmamalıdır.
        </p>
      </div>
    </div>
  );
}
