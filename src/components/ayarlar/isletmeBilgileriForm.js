"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Save,
  Loader2,
  Phone,
  Mail,
  Globe,
  MapPin,
  UserRound,
  Percent,
  Wallet,
  Info,
} from "lucide-react";

import {
  updateIsletmeAyarlari,
  isletmeApiError,
} from "@/app/services/isletmeAyarlari.service";

// ---------------------------------------------
// Initial Form
// ---------------------------------------------

const initialForm = {
  isletmeAdi: "",
  yetkiliKisi: "",
  telefon: "",
  email: "",
  adres: "",
  webSitesi: "",
  tursabUyeligiVar: false,
  tursabBelgeNo: "",
  onOdemeOrani: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

const formatMoney = (value) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

// ---------------------------------------------
// Field Component
// ---------------------------------------------

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        {Icon && <Icon size={15} className="text-slate-400" />}
        {label}
      </label>

      {children}
    </div>
  );
}

// ---------------------------------------------
// Main Component
// ---------------------------------------------

export default function IsletmeBilgileriForm({ settings, onUpdated }) {
  const [form, setForm] = useState(initialForm);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ---------------------------------------------
  // Load Settings
  // ---------------------------------------------

  useEffect(() => {
    if (!settings) return;

    setForm({
      isletmeAdi: settings.isletmeAdi ?? "",
      yetkiliKisi: settings.yetkiliKisi ?? "",
      telefon: settings.telefon ?? "",
      email: settings.email ?? "",
      adres: settings.adres ?? "",
      webSitesi: settings.webSitesi ?? "",
      tursabUyeligiVar: settings.tursabUyeligiVar ?? false,
      tursabBelgeNo: settings.tursabBelgeNo ?? "",
      onOdemeOrani:
        settings.onOdemeOrani != null ? String(settings.onOdemeOrani) : "",
    });

    setError("");
    setSuccess("");
  }, [settings]);

  // ---------------------------------------------
  // Update Form
  // ---------------------------------------------

  function update(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  // ---------------------------------------------
  // Calculations
  // ---------------------------------------------

  const onOdemeOrani = Number(form.onOdemeOrani);

  const validOnOdemeOrani =
    form.onOdemeOrani !== "" &&
    Number.isFinite(onOdemeOrani) &&
    onOdemeOrani >= 0 &&
    onOdemeOrani <= 100;

  const ornekRezervasyonTutari = 50000;

  const ornekOnOdeme = validOnOdemeOrani
    ? (ornekRezervasyonTutari * onOdemeOrani) / 100
    : 0;

  const ornekKalanOdeme = ornekRezervasyonTutari - ornekOnOdeme;

  // ---------------------------------------------
  // Submit
  // ---------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.isletmeAdi.trim() || saving) return;

    if (!validOnOdemeOrani) {
      setError("Ön ödeme oranı 0 ile 100 arasında olmalıdır.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await updateIsletmeAyarlari({
        ...form,

        isletmeAdi: form.isletmeAdi.trim(),

        tursabBelgeNo: form.tursabUyeligiVar
          ? form.tursabBelgeNo.trim() || null
          : null,

        // Backend decimal alanına JSON number gider.
        onOdemeOrani: onOdemeOrani,
      });

      onUpdated(result);

      setSuccess("İşletme bilgileri ve ön ödeme oranı kaydedildi.");
    } catch (err) {
      setError(isletmeApiError(err));
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------
  // JSX
  // ---------------------------------------------

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* HEADER */}
      <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Building2 size={21} />
        </div>

        <div>
          <h2 className="font-bold text-slate-900">İşletme Bilgileri</h2>

          <p className="mt-1 text-xs text-slate-500">
            Kurumsal bilgiler, iletişim bilgileri ve rezervasyon ön ödeme
            ayarlarını yönetin.
          </p>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-6">
        {/* GENERAL INFORMATION */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="İşletme Adı *" icon={Building2}>
            <input
              required
              maxLength={200}
              value={form.isletmeAdi}
              onChange={(e) => update("isletmeAdi", e.target.value)}
              placeholder="İşletme adını giriniz"
              className={inputClass}
            />
          </Field>

          <Field label="Yetkili Kişi" icon={UserRound}>
            <input
              maxLength={150}
              value={form.yetkiliKisi}
              onChange={(e) => update("yetkiliKisi", e.target.value)}
              placeholder="Ad Soyad"
              className={inputClass}
            />
          </Field>

          <Field label="Telefon" icon={Phone}>
            <input
              type="tel"
              maxLength={30}
              value={form.telefon}
              onChange={(e) => update("telefon", e.target.value)}
              placeholder="+90 5XX XXX XX XX"
              className={inputClass}
            />
          </Field>

          <Field label="E-posta" icon={Mail}>
            <input
              type="email"
              maxLength={200}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="info@isletme.com"
              className={inputClass}
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Web Sitesi" icon={Globe}>
              <input
                type="url"
                maxLength={500}
                value={form.webSitesi}
                onChange={(e) => update("webSitesi", e.target.value)}
                placeholder="https://www.isletme.com"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="İşletme Adresi" icon={MapPin}>
              <textarea
                rows={3}
                maxLength={1000}
                value={form.adres}
                onChange={(e) => update("adres", e.target.value)}
                placeholder="İşletmenin açık adresi"
                className={`${inputClass} resize-y`}
              />
            </Field>
          </div>
        </div>

        {/* ------------------------------------- */}
        {/* PAYMENT SETTINGS */}
        {/* ------------------------------------- */}

        <div className="border-t border-slate-100 pt-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet size={20} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Rezervasyon Ödeme Ayarları
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Yeni rezervasyonlarda kullanılacak varsayılan ön ödeme oranını
                belirleyin.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* DEPOSIT RATE */}
            <div>
              <Field label="Ön Ödeme Oranı (%)" icon={Percent}>
                <div className="relative">
                  <input
                    id="onOdemeOrani"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={form.onOdemeOrani}
                    onChange={(e) => update("onOdemeOrani", e.target.value)}
                    placeholder="Örn: 20"
                    className={`${inputClass} pr-12`}
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    %
                  </span>
                </div>
              </Field>

              <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-500">
                <Info size={15} className="mt-0.5 shrink-0 text-slate-400" />
                Bu oran işletmedeki bütün yeni rezervasyonlar için geçerlidir.
                Mevcut rezervasyonların ön ödeme tutarlarını değiştirmez.
              </p>

              {!validOnOdemeOrani && form.onOdemeOrani !== "" && (
                <p className="mt-2 text-xs font-medium text-red-600">
                  Oran 0 ile 100 arasında olmalıdır.
                </p>
              )}
            </div>

            {/* EXAMPLE CALCULATION */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">
                  Örnek Hesaplama
                </p>

                <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-blue-600 ring-1 ring-slate-200">
                  {validOnOdemeOrani ? `%${onOdemeOrani}` : "—"}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Rezervasyon toplamı
                  </span>

                  <span className="text-sm font-semibold text-slate-800">
                    {formatMoney(ornekRezervasyonTutari)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">Ön ödeme</span>

                  <span className="text-sm font-bold text-emerald-600">
                    {validOnOdemeOrani ? formatMoney(ornekOnOdeme) : "—"}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-600">
                      Kalan ödeme
                    </span>

                    <span className="text-sm font-bold text-slate-900">
                      {validOnOdemeOrani ? formatMoney(ornekKalanOdeme) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-[11px] leading-5 text-slate-400">
                Bu hesaplama örnektir. Gerçek tutarlar rezervasyon
                oluşturulurken backend tarafından hesaplanır.
              </p>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {/* SUCCESS */}
        {success && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"
          >
            {success}
          </p>
        )}

        {/* SAVE BUTTON */}
        <div className="flex justify-end border-t border-slate-100 pt-5">
          <button
            type="submit"
            disabled={saving || !form.isletmeAdi.trim() || !validOnOdemeOrani}
            className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}

            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </form>
    </section>
  );
}
