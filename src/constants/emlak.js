// Buradaki tip değerleri C# EmlakTipi enum'una
// birebir karşılık gelmeli.
export const EMLAK_TIPLERI = {
  0: "Villa",
  1: "Daire",
  2: "Bungalov",
  3: "Müstakil Ev",
};

// Bunlar örnek havuz seçenekleridir.
// Backend enum değerlerini doğrulayınca güncelle.
export const HAVUZ_TIPLERI = [
  { value: "Özel Havuz", label: "Özel Havuz" },
  { value: "Ortak Havuz", label: "Ortak Havuz" },
  { value: "Kapalı Havuz", label: "Kapalı Havuz" },
  { value: "Çocuk Havuzu", label: "Çocuk Havuzu" },
];

export const HAVUZ_MAHREMIYET = [
  { value: 0, label: "Korunaklı Değil" },
  { value: 1, label: "Yarı Korunaklı" },
  { value: 2, label: "Tam Korunaklı" },
];
