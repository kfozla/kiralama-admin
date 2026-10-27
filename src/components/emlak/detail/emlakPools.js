import { Waves, Ruler, ShieldCheck } from "lucide-react";

import { formatValue } from "@/utils/emlakDetail";

function PoolField({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>

      <p className="mt-2 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

// Enum adlarını kendi backend HavuzKorunakTipi
// enum'una göre buradan güncelleyebilirsin.
const korunakTipleri = {
  0: "Belirtilmemiş",
};

function getKorunakTipi(value) {
  if (value == null) return "Belirtilmemiş";

  return korunakTipleri[value] ?? `Tip ${value}`;
}

export default function EmlakPools({ emlak }) {
  const pools = Array.isArray(emlak.havuzBilgileri) ? emlak.havuzBilgileri : [];

  if (!Array.isArray(emlak.havuzBilgileri)) {
    return (
      <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
        API yanıtında havuz bilgileri bulunmuyor.
      </p>
    );
  }

  if (pools.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
        <Waves size={30} className="mx-auto text-slate-300" />

        <p className="mt-3 text-sm font-semibold text-slate-800">
          Bu emlak için havuz bilgisi bulunmuyor
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900">Havuz Bilgileri</h3>

        <p className="mt-1 text-sm text-slate-500">
          Toplam {pools.length} havuz kaydı
        </p>
      </div>

      {pools.map((pool, index) => (
        <div key={index} className="rounded-xl border border-slate-200 p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
              <Waves size={22} />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Havuz {index + 1}
              </h4>

              <p className="mt-1 text-xs text-slate-500">
                {pool.havuzTipi || "Havuz tipi belirtilmemiş"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <PoolField label="En" value={formatValue(pool.en, " m")} />

            <PoolField label="Boy" value={formatValue(pool.boy, " m")} />

            <PoolField
              label="Derinlik"
              value={formatValue(pool.derinlik, " m")}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
              <Ruler size={15} />
              Havuz Ölçüleri
            </div>

            <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
              <ShieldCheck size={15} />
              Korunak Tipi: {getKorunakTipi(pool.havuzKorunakTipi)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
