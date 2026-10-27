"use client";

import { useMemo } from "react";
import { Check, Star } from "lucide-react";

const categoryNames = {
  0: "Genel Özellikler",
  1: "Mutfak",
  2: "Salon",
  3: "Havuz ve Bahçe",
};

export default function EmlakOzellikSecimi({
  features,
  selectedIds,
  featuredIds,
  onSelectedChange,
  onFeaturedChange,
}) {
  const grouped = useMemo(() => {
    const groups = {};

    features.forEach((feature) => {
      const category = feature.kategori;
      const key = String(category);

      if (!groups[key]) groups[key] = [];
      groups[key].push(feature);
    });

    return groups;
  }, [features]);

  const toggleFeature = (id) => {
    if (selectedIds.includes(id)) {
      onSelectedChange(selectedIds.filter((value) => value !== id));

      onFeaturedChange(featuredIds.filter((value) => value !== id));
    } else {
      onSelectedChange([...selectedIds, id]);
    }
  };

  const toggleFeatured = (id) => {
    if (!selectedIds.includes(id)) return;

    onFeaturedChange(
      featuredIds.includes(id)
        ? featuredIds.filter((value) => value !== id)
        : [...featuredIds, id],
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-5 text-blue-700">
        Emlağın sahip olduğu özellikleri seçin. Yıldız simgesine tıklayarak
        seçtiğiniz özellikleri öne çıkarabilirsiniz.
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">
              {categoryNames[category] || `Kategori ${category}`}
            </h3>

            <span className="text-xs text-slate-400">
              {items.filter((item) => selectedIds.includes(item.id)).length} /{" "}
              {items.length} seçili
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((feature) => {
              const selected = selectedIds.includes(feature.id);
              const featured = featuredIds.includes(feature.id);

              return (
                <div
                  key={feature.id}
                  className={`flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3 transition ${
                    selected
                      ? "border-blue-200 bg-blue-50/40"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleFeature(feature.id)}
                      className="h-4 w-4 shrink-0 accent-blue-600"
                    />

                    <span className="truncate text-sm text-slate-700">
                      {feature.ozellikAdi}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => toggleFeatured(feature.id)}
                    disabled={!selected}
                    title={featured ? "Öne çıkanlardan kaldır" : "Öne çıkar"}
                    aria-label={`${feature.ozellikAdi} öne çıkar`}
                    aria-pressed={featured}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                      featured
                        ? "bg-amber-100 text-amber-600"
                        : "text-slate-300 hover:bg-amber-50 hover:text-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
                    }`}
                  >
                    <Star size={18} fill={featured ? "currentColor" : "none"} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {features.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-400">
          Henüz tanımlanmış emlak özelliği bulunmuyor.
        </p>
      )}

      <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Check size={15} className="text-blue-600" />
          {selectedIds.length} özellik seçildi
        </span>

        <span className="flex items-center gap-1.5">
          <Star size={15} className="text-amber-500" />
          {featuredIds.length} özellik öne çıkarıldı
        </span>
      </div>
    </div>
  );
}
