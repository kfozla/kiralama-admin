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
} from "lucide-react";

import {
  updateIsletmeAyarlari,
  isletmeApiError,
} from "@/app/services/isletmeAyarlari.service";

const initialForm = {
  isletmeAdi: "",
  yetkiliKisi: "",
  telefon: "",
  email: "",
  adres: "",
  webSitesi: "",
  tursabUyeligiVar: false,
  tursabBelgeNo: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

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

export default function IsletmeBilgileriForm({ settings, onUpdated }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    });
  }, [settings]);

  function update(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.isletmeAdi.trim() || saving) return;

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
      });

      onUpdated(result);
      setSuccess("İşletme bilgileri kaydedildi.");
    } catch (err) {
      setError(isletmeApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Building2 size={21} />
        </div>

        <div>
          <h2 className="font-bold text-slate-900">İşletme Bilgileri</h2>
          <p className="mt-1 text-xs text-slate-500">
            Kurumsal ve iletişim bilgilerinizi düzenleyin.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
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

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"
          >
            {success}
          </p>
        )}

        <div className="flex justify-end border-t border-slate-100 pt-5">
          <button
            type="submit"
            disabled={saving || !form.isletmeAdi.trim()}
            className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
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
