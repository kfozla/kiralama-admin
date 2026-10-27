import { Check, Star, ListChecks, AlertCircle } from "lucide-react";

import { OZELLIK_KATEGORILERI } from "@/constants/emlakOzellik";

import { getOzellikIds, getOneCikanIds } from "@/utils/emlakDetail";

export default function EmlakFeatures({ emlak, allFeatures, loading, error }) {
  const selectedIds = getOzellikIds(emlak);
  const featuredIds = new Set(getOneCikanIds(emlak));

  if (loading) {
    return (
      <p className="py-8 text-sm text-slate-500">Özellikler yükleniyor...</p>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600"
      >
        <AlertCircle size={18} />
        {error}
      </div>
    );
  }

  if (
    !Array.isArray(emlak.ozellikIds) &&
    !Array.isArray(emlak.emlakOzellikleri) &&
    !Array.isArray(emlak.ozellikler) &&
    !Array.isArray(emlak.oneCikanOzellikIds) &&
    !Array.isArray(emlak.oneCikanOzellikler)
  ) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Bu emlak için özellik bilgileri API yanıtında bulunmuyor. GET /Emlak/
        {emlak.id} response'unu kontrol etmeliyiz.
      </p>
    );
  }

  const selected = allFeatures.filter((feature) =>
    selectedIds.includes(Number(feature.id)),
  );

  const unknownIds = selectedIds.filter(
    (id) => !allFeatures.some((feature) => Number(feature.id) === id),
  );

  if (selectedIds.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
        <ListChecks size={28} className="mx-auto text-slate-300" />

        <p className="mt-3 text-sm font-semibold text-slate-800">
          Henüz özellik eklenmemiş
        </p>
      </div>
    );
  }

  const categories = OZELLIK_KATEGORILERI.map((category) => ({
    ...category,
    items: selected.filter(
      (feature) => Number(feature.kategori) === category.value,
    ),
  })).filter((category) => category.items.length > 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Emlak Özellikleri
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Bu emlak için seçilmiş {selectedIds.length} özellik
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          <Star size={15} />
          {featuredIds.size} öne çıkan
        </span>
      </div>

      {categories.map((category) => (
        <div
          key={category.value}
          className="rounded-xl border border-slate-200 p-5"
        >
          <h4 className="mb-4 text-sm font-bold text-slate-800">
            {category.label}
          </h4>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {category.items.map((feature) => {
              const highlighted = featuredIds.has(Number(feature.id));

              return (
                <div
                  key={feature.id}
                  className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${
                    highlighted ? "bg-amber-50" : "bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Check size={17} className="shrink-0 text-emerald-600" />

                    <span className="text-sm font-medium text-slate-700">
                      {feature.ozellikAdi}
                    </span>
                  </div>

                  {highlighted && (
                    <Star
                      size={17}
                      className="shrink-0 fill-amber-400 text-amber-400"
                      aria-label="Öne çıkan özellik"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {unknownIds.length > 0 && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
          {unknownIds.length} özellik ID'si mevcut özellik listesinde
          bulunamadı: {unknownIds.join(", ")}
        </p>
      )}
    </div>
  );
}
