export const REZERVASYON_DURUMLARI = [
  { value: 0, label: "Beklemede" },
  { value: 1, label: "Onaylandı" },
  { value: 2, label: "İptal Edildi" },
  { value: 3, label: "Tamamlandı" },
];

export function getRezervasyonDurumu(value) {
  const key =
    value === null || value === undefined || value === ""
      ? null
      : Number(value);

  const labels = {
    0: "Beklemede",
    1: "Onaylandı",
    2: "İptal Edildi",
    3: "Tamamlandı",
  };

  return labels[key] ?? "Bilinmiyor";
}

export function getDurumClass(value) {
  const classes = {
    0: "bg-amber-50 text-amber-700 ring-amber-200",
    1: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    2: "bg-red-50 text-red-700 ring-red-200",
    3: "bg-blue-50 text-blue-700 ring-blue-200",
  };

  return classes[value] ?? "bg-slate-50 text-slate-600 ring-slate-200";
}
