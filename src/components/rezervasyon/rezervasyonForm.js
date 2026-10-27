"use client";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  House,
  CalendarDays,
  Users,
  UserRound,
  Phone,
  Mail,
  Wallet,
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { createRezervasyon } from "@/app/services/rezervasyon.service";
import {
  getTakvimBlokeleri,
  getTakvimFiyatlari,
  takvimApiError,
} from "@/app/services/emlakTakvim.service";
import EmlakSearch from "@/components/emlak/emlakSearch";
import { getEmlakById } from "@/app/services/emlak.service";
import {
  todayISO,
  addDays,
  formatPrice,
  normalizePriceRanges,
  getDailyPriceInfo,
  rangesOverlap,
} from "@/utils/emlakCalendar";
const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400";
const labelClass = "mb-2 block text-sm font-semibold text-slate-700";
const initialForm = {
  girisTarihi: "",
  cikisTarihi: "",
  kisiSayisi: "2",
  musteriAd: "",
  musteriSoyad: "",
  telefon: "",
  email: "",
};
function getVillaName(villa) {
  return (
    villa?.["emlakAdı"] ?? villa?.emlakAdi ?? villa?.ad ?? `Emlak #${villa.id}`
  );
}
function getNights(start, end) {
  if (!start || !end || start >= end) return 0;
  const from = Date.parse(`${start}T00:00:00Z`);
  const to = Date.parse(`${end}T00:00:00Z`);
  return Math.round((to - from) / 86400000);
}
export default function rezervasyonForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  // EmlakSearch React Hook Form üzerinden sadece villa ID'sini yönetir.
  const { control: emlakControl } = useForm({
    defaultValues: { emlakId: null },
  });
  const selectedEmlakId = useWatch({ control: emlakControl, name: "emlakId" });
  const [selectedVilla, setSelectedVilla] = useState(null);
  const [blokeler, setBlokeler] = useState([]);
  const [fiyatlar, setFiyatlar] = useState([]);
  const [loadingEmlak, setLoadingEmlak] = useState(false);
  const [loadingTakvim, setLoadingTakvim] = useState(false);
  const [takvimLoaded, setTakvimLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const today = todayISO();
  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setError("");
  };
  // Bütün emlakları çekmek yerine sadece seçilen emlağın detayını al.
  // Kapasite kontrolü ve fiyat özetindeki villa adı için gerekli.
  useEffect(() => {
    if (!selectedEmlakId) {
      setSelectedVilla(null);
      setLoadingEmlak(false);
      return;
    }
    let active = true;
    setLoadingEmlak(true);
    setSelectedVilla(null);
    setError("");
    getEmlakById(selectedEmlakId)
      .then((villa) => {
        if (!active) return;
        if (villa?.isDeleted) {
          throw new Error("Seçilen villa artık kullanılamıyor.");
        }
        setSelectedVilla(villa);
      })
      .catch((err) => {
        if (!active) return;
        setSelectedVilla(null);
        setError(err?.message || "Seçilen villa yüklenemedi.");
      })
      .finally(() => {
        if (active) setLoadingEmlak(false);
      });
    return () => {
      active = false;
    };
  }, [selectedEmlakId]);
  // Seçilen emlağın fiyat ve bloke kayıtlarını yükle.
  useEffect(() => {
    if (!selectedEmlakId) {
      setBlokeler([]);
      setFiyatlar([]);
      setTakvimLoaded(false);
      setLoadingTakvim(false);
      return;
    }
    let active = true;
    async function loadTakvim() {
      setLoadingTakvim(true);
      setTakvimLoaded(false);
      setBlokeler([]);
      setFiyatlar([]);
      setError("");
      try {
        const [blocks, prices] = await Promise.all([
          getTakvimBlokeleri(selectedEmlakId),
          getTakvimFiyatlari(selectedEmlakId),
        ]);
        if (!active) return;
        setBlokeler(blocks);
        setFiyatlar(prices);
        setTakvimLoaded(true);
      } catch (err) {
        if (active) setError(takvimApiError(err));
      } finally {
        if (active) setLoadingTakvim(false);
      }
    }
    loadTakvim();
    return () => {
      active = false;
    };
  }, [selectedEmlakId]);
  // Önceki villanın kapasitesini yeni seçimde kullanmayalım.
  const currentVilla =
    selectedVilla && Number(selectedVilla.id) === Number(selectedEmlakId)
      ? selectedVilla
      : null;
  const nights = getNights(form.girisTarihi, form.cikisTarihi);
  const minimumKonaklama = Number(currentVilla?.minimumKonaklamaSuresi ?? 1);
  const minimumTemizlik = Number(currentVilla?.minimumKonaklamaTemizlik ?? 0);
  const temizlikUcreti = Number(currentVilla?.temizlikUcreti ?? 0);
  const uygulanacakTemizlikUcreti =
    currentVilla &&
    minimumTemizlik > 0 &&
    nights > 0 &&
    nights < minimumTemizlik
      ? temizlikUcreti
      : 0;
  const minimumKonaklamaUygun = nights >= minimumKonaklama;
  const priceRanges = useMemo(() => normalizePriceRanges(fiyatlar), [fiyatlar]);
  const dateConflict = useMemo(() => {
    if (
      !takvimLoaded ||
      !form.girisTarihi ||
      !form.cikisTarihi ||
      nights <= 0
    ) {
      return false;
    }
    return blokeler.some((block) =>
      rangesOverlap(
        form.girisTarihi,
        form.cikisTarihi,
        String(block.baslangicTarihi).slice(0, 10),
        String(block.bitisTarihi).slice(0, 10),
      ),
    );
  }, [blokeler, form.girisTarihi, form.cikisTarihi, nights, takvimLoaded]);
  const priceSummary = useMemo(() => {
    if (!takvimLoaded || nights <= 0) {
      return { total: null, valid: false, missing: [] };
    }
    let total = 0;
    const missing = [];
    for (
      let day = form.girisTarihi;
      day < form.cikisTarihi;
      day = addDays(day, 1)
    ) {
      const info = getDailyPriceInfo(day, priceRanges);
      if (info.conflict || info.price == null) {
        missing.push(day);
      } else {
        total += info.price;
      }
    }
    return {
      total: missing.length === 0 ? total : null,
      valid: missing.length === 0,
      missing,
    };
  }, [takvimLoaded, nights, form.girisTarihi, form.cikisTarihi, priceRanges]);
  const hasarDepozitosu = Number(currentVilla?.hasarDepozitosu ?? 0);

  // Toplam = konaklama + koşullu temizlik; hasar depozitosu hariç.
  const toplamRezervasyonTutari = priceSummary.valid
    ? priceSummary.total + uygulanacakTemizlikUcreti
    : null;

  const capacity = Number(currentVilla?.kapasite ?? currentVilla?.Kapasite);
  const capacityExceeded =
    currentVilla &&
    Number.isFinite(capacity) &&
    Number(form.kisiSayisi) > capacity;
  const invalidDates =
    !form.girisTarihi ||
    !form.cikisTarihi ||
    form.girisTarihi < today ||
    nights <= 0;
  const canSave =
    minimumKonaklamaUygun &&
    !saving &&
    !loadingEmlak &&
    !loadingTakvim &&
    takvimLoaded &&
    selectedEmlakId &&
    currentVilla &&
    !invalidDates &&
    !dateConflict &&
    priceSummary.valid &&
    !capacityExceeded &&
    Number.isInteger(Number(form.kisiSayisi)) &&
    Number(form.kisiSayisi) > 0 &&
    form.musteriAd.trim() &&
    form.musteriSoyad.trim() &&
    form.telefon.trim();
  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      await createRezervasyon({
        emlakId: Number(selectedEmlakId),
        girisTarihi: form.girisTarihi,
        cikisTarihi: form.cikisTarihi,
        kisiSayisi: Number(form.kisiSayisi),
        musteriAd: form.musteriAd.trim(),
        musteriSoyad: form.musteriSoyad.trim(),
        telefon: form.telefon.trim(),
        email: form.email.trim() || null,
      });
      router.push("/rezervasyonlar");
      router.refresh();
    } catch (err) {
      setError(takvimApiError(err));
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <House size={21} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Konaklama Bilgileri
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Emlak, konaklama tarihleri ve misafir sayısı
            </p>
          </div>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <label className={labelClass}>
              Emlak <span className="text-red-500">*</span>
            </label>
            <EmlakSearch
              control={emlakControl}
              name="emlakId"
              disabled={saving}
            />
            {currentVilla && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <Users size={14} />
                Kapasite: {capacity || "Belirtilmemiş"} kişi
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rez-giris" className={labelClass}>
                Giriş Tarihi <span className="text-red-500">*</span>
              </label>
              <input
                id="rez-giris"
                type="date"
                required
                min={today}
                value={form.girisTarihi}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((current) => ({
                    ...current,
                    girisTarihi: value,
                    cikisTarihi:
                      current.cikisTarihi && current.cikisTarihi > value
                        ? current.cikisTarihi
                        : "",
                  }));
                  setError("");
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="rez-cikis" className={labelClass}>
                Çıkış Tarihi <span className="text-red-500">*</span>
              </label>
              <input
                id="rez-cikis"
                type="date"
                required
                min={form.girisTarihi ? addDays(form.girisTarihi, 1) : today}
                value={form.cikisTarihi}
                onChange={(e) => update("cikisTarihi", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="rez-kisi" className={labelClass}>
                Kişi Sayısı <span className="text-red-500">*</span>
              </label>
              <input
                id="rez-kisi"
                type="number"
                min="1"
                max={
                  Number.isFinite(capacity) && capacity > 0
                    ? capacity
                    : undefined
                }
                step="1"
                required
                value={form.kisiSayisi}
                onChange={(e) => update("kisiSayisi", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Konaklama Süresi</label>
              <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700">
                <CalendarDays size={17} className="text-blue-600" />
                {nights > 0 ? `${nights} gece` : "—"}
              </div>
            </div>
          </div>
          {selectedEmlakId && (
            <div
              className={`flex items-start gap-3 rounded-xl p-4 ${
                loadingTakvim || !takvimLoaded
                  ? "bg-slate-50 text-slate-600"
                  : dateConflict
                    ? "bg-red-50 text-red-700"
                    : !invalidDates
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-blue-50 text-blue-700"
              }`}
            >
              {loadingTakvim ? (
                <Loader2 size={18} className="mt-0.5 animate-spin" />
              ) : dateConflict ? (
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
              ) : !invalidDates && takvimLoaded ? (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              ) : (
                <Info size={18} className="mt-0.5 shrink-0" />
              )}
              <div>
                <p className="text-sm font-bold">
                  {loadingTakvim
                    ? "Takvim kontrol ediliyor..."
                    : !takvimLoaded
                      ? "Takvim bilgileri alınamadı"
                      : invalidDates
                        ? "Konaklama tarihlerini seçiniz"
                        : dateConflict
                          ? "Seçilen tarihler bloke edilmiş"
                          : "Seçilen tarihler müsait görünüyor"}
                </p>
                <p className="mt-1 text-xs leading-5">
                  {dateConflict
                    ? "Bu aralıkta manuel veya rezervasyon kaynaklı bloke bulunuyor."
                    : "Kesin müsaitlik kontrolü rezervasyon kaydedilirken backend tarafından yapılır."}
                </p>
              </div>
            </div>
          )}
          {capacityExceeded && (
            <p className="text-xs font-medium text-red-600">
              Kişi sayısı emlak kapasitesini aşıyor.
            </p>
          )}

          {currentVilla && nights > 0 && !minimumKonaklamaUygun && (
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Bu emlak için minimum konaklama süresi {minimumKonaklama} gecedir.
              Seçtiğiniz süre {nights} gece.
            </p>
          )}
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <UserRound size={21} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Müşteri Bilgileri
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Rezervasyon sahibinin iletişim bilgileri
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <label htmlFor="rez-ad" className={labelClass}>
              Ad <span className="text-red-500">*</span>
            </label>
            <input
              id="rez-ad"
              required
              value={form.musteriAd}
              onChange={(e) => update("musteriAd", e.target.value)}
              placeholder="Müşteri adı"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="rez-soyad" className={labelClass}>
              Soyad <span className="text-red-500">*</span>
            </label>
            <input
              id="rez-soyad"
              required
              value={form.musteriSoyad}
              onChange={(e) => update("musteriSoyad", e.target.value)}
              placeholder="Müşteri soyadı"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="rez-tel" className={labelClass}>
              <Phone size={14} className="mr-1 inline text-slate-400" />
              Telefon <span className="text-red-500">*</span>
            </label>
            <input
              id="rez-tel"
              type="tel"
              required
              value={form.telefon}
              onChange={(e) => update("telefon", e.target.value)}
              placeholder="05xx xxx xx xx"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="rez-email" className={labelClass}>
              <Mail size={14} className="mr-1 inline text-slate-400" />
              E-posta
            </label>
            <input
              id="rez-email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="ornek@mail.com"
              className={inputClass}
            />
          </div>
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Wallet size={21} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Fiyat ve Rezervasyon Özeti
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Gecelik fiyatlardan hesaplanan tahmini tutar
            </p>
          </div>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-slate-500">Seçilen emlak</span>
            <span className="font-semibold text-slate-800">
              {currentVilla ? getVillaName(currentVilla) : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-slate-500">Gece sayısı</span>
            <span className="font-semibold text-slate-800">
              {nights > 0 ? `${nights} gece` : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-slate-500">Kişi sayısı</span>
            <span className="font-semibold text-slate-800">
              {form.kisiSayisi || "—"}
            </span>
          </div>
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-600">Konaklama Bedeli</span>
              <span className="text-sm font-semibold text-slate-800">
                {priceSummary.valid ? formatPrice(priceSummary.total) : "—"}
              </span>
            </div>

            {priceSummary.valid && uygulanacakTemizlikUcreti > 0 && (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-sm text-slate-600">
                    Temizlik Ücreti
                  </span>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {minimumTemizlik} geceden kısa konaklamalara uygulanır.
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  {formatPrice(uygulanacakTemizlikUcreti)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="text-sm font-bold text-slate-800">
                Toplam Rezervasyon Tutarı
              </span>
              <span className="text-2xl font-bold text-blue-600">
                {toplamRezervasyonTutari !== null
                  ? formatPrice(toplamRezervasyonTutari)
                  : "—"}
              </span>
            </div>

            {nights > 0 && takvimLoaded && !priceSummary.valid && (
              <p className="mt-3 text-xs text-red-600">
                Seçilen tarihlerde fiyatı eksik veya çakışan günler var. Fiyat
                Yönetimi sekmesinden ilgili günlerin fiyatlarını
                tanımlamalısınız.
              </p>
            )}

            {/* HASAR DEPOZİTOSU */}
            {hasarDepozitosu > 0 && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Wallet size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-amber-900">
                        Hasar Depozitosu
                      </span>
                      <span className="text-lg font-bold text-amber-900">
                        {formatPrice(hasarDepozitosu)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-amber-800">
                      Bu tutar konaklama ücretine dahil değildir. Misafirden
                      giriş sırasında nakit olarak tahsil edilir. Çıkışta
                      yapılan hasar kontrolünün ardından, herhangi bir hasar
                      veya eksik bulunmaması durumunda iade edilir.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-amber-800">
                        Girişte nakit tahsilat
                      </span>
                      <span className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-amber-800">
                        Konaklama toplamına dahil değil
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs leading-5 text-slate-500">
              Rezervasyon <strong>Beklemede</strong> durumuyla oluşturulacaktır.
              Onaylandığında backend otomatik bloke kaydı oluşturacak ve takvim
              ilgili geceleri kapatacaktır. Toplam fiyatın kesin değeri backend
              tarafından hesaplanır.
            </p>
          </div>
        </div>
      </section>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/rezervasyonlar")}
          disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <ArrowLeft size={17} />
          Vazgeç
        </button>
        <button
          type="submit"
          disabled={!canSave}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {saving ? "Kaydediliyor..." : "Rezervasyon Oluştur"}
        </button>
      </div>
    </form>
  );
}
