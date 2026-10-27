export const OZELLIK_KATEGORILERI = [
  { value: 0, label: "Genel" },
  { value: 1, label: "Mutfak" },
  { value: 2, label: "Salon" },
  { value: 3, label: "Havuz ve Bahçe" },
];

export const getKategoriAdi = (value) => {
  const category = OZELLIK_KATEGORILERI.find(
    (item) => item.value === Number(value),
  );

  return category?.label ?? `Kategori ${value}`;
};

export const getKategoriClass = (value) => {
  const classes = {
    0: "bg-blue-50 text-blue-700 ring-blue-200",
    1: "bg-amber-50 text-amber-700 ring-amber-200",
    2: "bg-violet-50 text-violet-700 ring-violet-200",
    3: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  return classes[Number(value)] ?? "bg-slate-50 text-slate-700 ring-slate-200";
};
