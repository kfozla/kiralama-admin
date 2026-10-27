"use client";

import { MapPinned } from "lucide-react";
import BolgeTreeRow from "./bolgeTreeRow";

export default function BolgeTreeTable({
  tree,
  expandedIds,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead className="bg-slate-50">
          <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <th className="px-5 py-4 sm:px-6">Bölge</th>
            <th className="px-5 py-4 sm:px-6">Üst Bölge</th>
            <th className="px-5 py-4 text-center sm:px-6">Alt Bölge Sayısı</th>
            <th className="w-28 px-5 py-4 text-center sm:px-6">İşlemler</th>
          </tr>
        </thead>

        <tbody>
          {tree.map((node) => (
            <BolgeTreeRow
              key={node.id}
              node={node}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>

      {tree.length === 0 && (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <MapPinned size={28} />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Bölge bulunamadı
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Arama kriterini değiştirebilir veya yeni bölge ekleyebilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
}
