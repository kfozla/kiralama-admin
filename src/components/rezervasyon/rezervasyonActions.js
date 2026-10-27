"use client";

import { Eye, Check, Trash2, Ban } from "lucide-react";

const baseButton =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

export default function RezervasyonActions({
  item,
  onDetail,
  onAction,
  disabled = false,
}) {
  const durum = Number(item.durum);

  return (
    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
      <button
        type="button"
        onClick={() => onDetail(item)}
        className={`${baseButton} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
      >
        <Eye size={15} />
        Detay
      </button>

      {durum === 0 && (
        <>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAction("approve", item)}
            className={`${baseButton} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
          >
            <Check size={15} />
            Onayla
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onAction("delete", item)}
            className={`${baseButton} bg-red-50 text-red-700 hover:bg-red-100`}
          >
            <Trash2 size={15} />
            Sil
          </button>
        </>
      )}

      {durum === 1 && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAction("cancel", item)}
          className={`${baseButton} bg-red-50 text-red-700 hover:bg-red-100`}
        >
          <Ban size={15} />
          İptal Et
        </button>
      )}
    </div>
  );
}
