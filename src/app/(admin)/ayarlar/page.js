"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Settings,
  Building2,
  RefreshCw,
  Loader2,
  AlertCircle,
  ShieldCheck,
  FileText,
  CircleHelp,
  Landmark,
  PanelsTopLeft,
} from "lucide-react";

import {
  getIsletmeAyarlari,
  isletmeApiError,
} from "@/app/services/isletmeAyarlari.service";

import IsletmeBilgileriForm from "@/components/ayarlar/isletmeBilgileriForm";
import LogoUpload from "@/components/ayarlar/logoUpload";
import TursabBelgeUpload from "@/components/ayarlar/tursabBelgeUpload";
import SayfaIcerikleri from "@/components/ayarlar/sayfaIcerikleri";
import SikcaSorulanSorular from "@/components/ayarlar/sikcaSorulanSorular";
import BankaHesaplari from "@/components/ayarlar/bankaHesaplari";
import AnasayfaYonetimi from "@/components/ayarlar/anasayfaYonetimi";

const tabs = [
  { id: "isletme", label: "İşletme", Icon: Building2 },
  { id: "anasayfa", label: "Anasayfa Yönetimi", Icon: PanelsTopLeft },
  { id: "icerikler", label: "Sayfa İçerikleri", Icon: FileText },
  { id: "sss", label: "Sıkça Sorulan Sorular", Icon: CircleHelp },
  { id: "banka", label: "Banka Hesapları", Icon: Landmark },
];

export default function AyarlarPage() {
  const [tab, setTab] = useState("isletme");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setSettings(await getIsletmeAyarlari());
    } catch (err) {
      setError(isletmeApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Settings size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Ayarlar
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              İşletme bilgileri, anasayfa bölümleri, web sitesi içerikleri,
              sıkça sorulan sorular ve banka hesapları.
            </p>
          </div>
        </div>

        {tab === "isletme" && (
          <button
            type="button"
            onClick={loadSettings}
            disabled={loading}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Yenile
          </button>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Ayar sekmeleri"
        className="flex flex-wrap gap-2 border-b border-slate-200 pb-3"
      >
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              tab === id
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>

      {tab === "isletme" && (
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <Building2 size={19} className="mt-0.5 shrink-0 text-blue-600" />

            <div>
              <p className="text-sm font-semibold text-blue-900">
                İşletme Profili
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-700">
                Bu bilgiler tek işletme kaydı üzerinde saklanır. Logo ve TÜRSAB
                belgesi ayrı yönetilir.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <p className="text-sm text-slate-500">
                İşletme bilgileri yükleniyor...
              </p>
            </div>
          ) : settings ? (
            <>
              <IsletmeBilgileriForm
                settings={settings}
                onUpdated={setSettings}
              />

              <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
                <LogoUpload settings={settings} onUpdated={setSettings} />

                <TursabBelgeUpload
                  settings={settings}
                  onUpdated={setSettings}
                />
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <ShieldCheck size={19} className="mt-0.5 text-slate-500" />
                <p className="text-xs leading-5 text-slate-500">
                  İşletme bilgilerini değiştirme ve belge yükleme işlemleri
                  admin yetkisi gerektirir. Özel belgeler korumalı alanda
                  saklanmalıdır.
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              İşletme bilgileri alınamadı.
            </div>
          )}
        </div>
      )}

      {tab === "anasayfa" && <AnasayfaYonetimi />}

      {tab === "icerikler" && <SayfaIcerikleri />}

      {tab === "sss" && <SikcaSorulanSorular />}

      {tab === "banka" && <BankaHesaplari />}
    </div>
  );
}
