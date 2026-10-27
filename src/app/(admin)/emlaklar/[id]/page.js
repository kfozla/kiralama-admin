"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from "lucide-react";

import { getEmlakById } from "@/app/services/emlak.service";
import { getBolgeler } from "@/app/services/bolge.service";
import { getEmlakSahipleri } from "@/app/services/emlakSahibi.service";
import { getEmlakOzellikler } from "@/app/services/emlakOzellik.service";

import { unwrapData, extractList, getErrorMessage } from "@/utils/emlakDetail";

import EmlakDetailHeader from "@/components/emlak/detail/emlakDetailHeader";
import EmlakDetailTabs from "@/components/emlak/detail/emlakDetailTabs";
import EmlakOverview from "@/components/emlak/detail/emlakOverview";
import EmlakFeatures from "@/components/emlak/detail/emlakFeatures";
import EmlakPools from "@/components/emlak/detail/emlakPools";
import EmlakLocation from "@/components/emlak/detail/emlakLocation";

export default function EmlakDetailPage() {
  const { id } = useParams();

  const [emlak, setEmlak] = useState(null);
  const [bolgeler, setBolgeler] = useState([]);
  const [sahipler, setSahipler] = useState([]);
  const [features, setFeatures] = useState([]);

  const [activeTab, setActiveTab] = useState("overview");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [featuresError, setFeaturesError] = useState("");
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setFeaturesLoading(true);
      setError("");
      setFeaturesError("");

      try {
        // Önce asıl emlak kaydını getir.
        const emlakResponse = await getEmlakById(id);

        if (!active) return;

        const item = unwrapData(emlakResponse);

        if (!item || typeof item !== "object" || Array.isArray(item)) {
          throw new Error("Geçersiz emlak yanıtı.");
        }

        setEmlak(item);
        setLoading(false);

        // Yardımcı kayıtlar birbirinden bağımsız yüklensin.
        // Bir tanesi başarısız olursa bütün sayfa kapanmasın.
        const [bolgeResult, sahipResult, featureResult] =
          await Promise.allSettled([
            getBolgeler(),
            getEmlakSahipleri(),
            getEmlakOzellikler(),
          ]);

        if (!active) return;

        if (bolgeResult.status === "fulfilled") {
          setBolgeler(extractList(bolgeResult.value));
        } else {
          setBolgeler([]);
        }

        if (sahipResult.status === "fulfilled") {
          setSahipler(extractList(sahipResult.value));
        } else {
          setSahipler([]);
        }

        if (featureResult.status === "fulfilled") {
          setFeatures(extractList(featureResult.value));
        } else {
          setFeatures([]);
          setFeaturesError("Emlak özellikleri listesi yüklenemedi.");
        }
      } catch (err) {
        if (!active) return;

        setEmlak(null);
        setError(
          getErrorMessage(err, err.message || "Emlak detayları alınamadı."),
        );
      } finally {
        if (active) {
          setLoading(false);
          setFeaturesLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  // ID'den bölge bilgisine ulaş.
  const selectedBolge = useMemo(() => {
    return bolgeler.find(
      (bolge) => Number(bolge.id) === Number(emlak?.bolgeId),
    );
  }, [bolgeler, emlak?.bolgeId]);

  // Bölgenin üstlerini de bul:
  // Antalya > Kaş > Kalkan
  const bolgeAdi = useMemo(() => {
    if (!selectedBolge) return null;

    const byId = new Map(bolgeler.map((bolge) => [Number(bolge.id), bolge]));

    const names = [];
    const visited = new Set();

    let current = selectedBolge;

    while (current && !visited.has(Number(current.id))) {
      visited.add(Number(current.id));
      names.unshift(current.ad);

      current =
        current.parentBolgeId == null
          ? null
          : byId.get(Number(current.parentBolgeId));
    }

    return names.join(" > ");
  }, [bolgeler, selectedBolge]);

  const sahip = useMemo(() => {
    if (emlak?.emlakSahibiId == null) return null;

    return (
      sahipler.find(
        (item) => Number(item.id) === Number(emlak.emlakSahibiId),
      ) ?? null
    );
  }, [sahipler, emlak?.emlakSahibiId]);

  if (loading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white">
        <Loader2 size={32} className="animate-spin text-blue-600" />

        <p className="text-sm text-slate-500">Emlak detayları yükleniyor...</p>
      </div>
    );
  }

  if (error || !emlak) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle size={23} />

          <h2 className="text-lg font-bold">Emlak detayları görüntülenemedi</h2>
        </div>

        <p className="mt-3 text-sm text-slate-500">
          {error || "Emlak bulunamadı."}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setReloadKey((prev) => prev + 1)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <RefreshCw size={17} />
            Tekrar Dene
          </button>

          <Link
            href="/emlaklar"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Emlak Listesi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EmlakDetailHeader emlak={emlak} bolgeAdi={bolgeAdi} />

      <EmlakDetailTabs activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === "overview" && (
          <EmlakOverview emlak={emlak} bolgeAdi={bolgeAdi} sahip={sahip} />
        )}

        {activeTab === "features" && (
          <EmlakFeatures
            emlak={emlak}
            allFeatures={features}
            loading={featuresLoading}
            error={featuresError}
          />
        )}

        {activeTab === "pools" && <EmlakPools emlak={emlak} />}

        {activeTab === "location" && (
          <EmlakLocation emlak={emlak} bolgeAdi={bolgeAdi} />
        )}
      </EmlakDetailTabs>
    </div>
  );
}
