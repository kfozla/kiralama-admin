"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bath,
  BedDouble,
  Check,
  CheckSquare2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  ExternalLink,
  House,
  Link2,
  Loader2,
  MapPin,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";

import { EMLAK_TIPLERI } from "@/constants/emlak";
import { getBolgeler } from "@/app/services/bolge.service";
import { getEmlakOzellikler } from "@/app/services/emlakOzellik.service";
import {
  advancedSearch,
  createEmlakPaylasim,
} from "@/app/services/emlak.service";

// -------------------------------------------
// Constants
// -------------------------------------------

const createInitialFilters = () => ({
  giris: "",
  cikis: "",
  bolgeId: "",
  emlakTipi: "",
  minKapasite: "",
  minYatakOdasi: "",
  minBanyo: "",
  ozellikIds: [],
  havuzKorunakTipi: "",
});

const HAVUZ_KORUNAK_TIPLERI = [
  { value: "0", label: "Korunaklı" },
  { value: "1", label: "Yarı Korunaklı" },
  { value: "2", label: "Korunaksız" },
];

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

// -------------------------------------------
// Helpers
// -------------------------------------------

function normalizeEmlak(item) {
  return {
    ...item,
    id: Number(item.id),
    emlakAdi: item.emlakAdi ?? item.emlakAdı ?? "İsimsiz emlak",
    bolgeId: item.bolgeId ?? null,
    bolgeAdi: item.bolgeAdi ?? item.bolge?.ad ?? "",
    emlakTipiAdi:
      EMLAK_TIPLERI[item.emlakTipi] ?? String(item.emlakTipi ?? "-"),
    yatakOdasiSayisi: item.yatakOdasiSayisi ?? item.yatakOdasıSayısı ?? 0,
    banyoSayisi: item.banyoSayisi ?? item.banyoSayısı ?? 0,
    kapakFotografUrl: item.kapakFotografUrl ?? null,
  };
}

function getImageUrl(path) {
  if (!path) return null;

  // Backend presigned S3 URL döndürüyor.
  if (/^https?:\/\//i.test(path)) return path;

  // Bir object key döndüyse bunu yanlışlıkla
  // public URL olarak kullanmayalım.
  return null;
}

function makeRegionOptions(regions) {
  const byParent = new Map();
  const allIds = new Set(regions.map((b) => Number(b.id)));

  regions.forEach((region) => {
    const parent = Number(region.parentBolgeId);
    const key =
      region.parentBolgeId == null || !allIds.has(parent) ? null : parent;

    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(region);
  });

  const result = [];
  const visited = new Set();

  const walk = (parent, depth) => {
    for (const region of byParent.get(parent) ?? []) {
      const id = Number(region.id);
      if (visited.has(id)) continue;

      visited.add(id);

      result.push({
        value: String(id),
        label: `${"— ".repeat(depth)}${region.ad}`,
      });

      walk(id, depth + 1);
    }
  };

  walk(null, 0);

  for (const region of regions) {
    if (!visited.has(Number(region.id))) {
      result.push({
        value: String(region.id),
        label: region.ad,
      });
    }
  }

  return result;
}

function buildQuery(filters) {
  const result = {};

  for (const key of [
    "giris",
    "cikis",
    "bolgeId",
    "emlakTipi",
    "minKapasite",
    "minYatakOdasi",
    "minBanyo",
    "havuzKorunakTipi",
  ]) {
    if (filters[key] !== "" && filters[key] != null) {
      result[key] = filters[key];
    }
  }

  if (filters.ozellikIds.length) {
    result.ozellikIds = filters.ozellikIds;
  }

  return result;
}

// -------------------------------------------
// Reusable input
// -------------------------------------------

function FilterField({ label, id, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-semibold text-slate-600"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// -------------------------------------------
// Page
// -------------------------------------------

export default function EmlakAraPage() {
  // Filters
  const [filters, setFilters] = useState(createInitialFilters);
  const [appliedFilters, setAppliedFilters] = useState(createInitialFilters);

  // Options
  const [bolgeler, setBolgeler] = useState([]);
  const [features, setFeatures] = useState([]);
  const [optionsError, setOptionsError] = useState("");

  // Results
  const [emlaklar, setEmlaklar] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  // Server-side pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // API state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Sharing
  const [creatingLink, setCreatingLink] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareError, setShareError] = useState("");
  const [copied, setCopied] = useState(false);

  // -------------------------------------------
  // Load filter options
  // -------------------------------------------

  useEffect(() => {
    let active = true;

    Promise.allSettled([getBolgeler(), getEmlakOzellikler()]).then(
      (results) => {
        if (!active) return;

        const [regionResult, featureResult] = results;

        if (regionResult.status === "fulfilled") {
          setBolgeler(
            Array.isArray(regionResult.value) ? regionResult.value : [],
          );
        }

        if (featureResult.status === "fulfilled") {
          setFeatures(
            Array.isArray(featureResult.value) ? featureResult.value : [],
          );
        }

        if (results.some((r) => r.status === "rejected")) {
          setOptionsError("Bazı filtre seçenekleri yüklenemedi.");
        }
      },
    );

    return () => {
      active = false;
    };
  }, []);

  // -------------------------------------------
  // Load paged results from backend
  // -------------------------------------------

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");
      setEmlaklar([]);

      try {
        const result = await advancedSearch({
          ...buildQuery(appliedFilters),
          page,
          pageSize,
        });

        if (!active) return;

        if (!result || !Array.isArray(result.items)) {
          throw new Error("API geçerli bir PagedResponse döndürmedi.");
        }

        setEmlaklar(result.items.map(normalizeEmlak));
        setTotalCount(Number(result.totalCount ?? 0));
      } catch (err) {
        if (!active) return;

        console.error("Advanced Search hatası:", err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Emlaklar aranırken hata oluştu.",
        );

        setEmlaklar([]);
        setTotalCount(0);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [appliedFilters, page, pageSize, reloadKey]);

  // -------------------------------------------
  // Computed values
  // -------------------------------------------

  const regionOptions = useMemo(() => makeRegionOptions(bolgeler), [bolgeler]);

  const regionMap = useMemo(
    () => new Map(bolgeler.map((b) => [Number(b.id), b.ad])),
    [bolgeler],
  );

  const typeOptions = useMemo(
    () =>
      Object.entries(EMLAK_TIPLERI).map(([value, label]) => ({ value, label })),
    [],
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Backend zaten sadece ilgili sayfayı gönderiyor.
  const visibleEmlaklar = emlaklar;

  const visibleIds = visibleEmlaklar.map((e) => e.id);

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  // -------------------------------------------
  // Filters
  // -------------------------------------------

  const changeFilter = useCallback((key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  }, []);

  const toggleFeature = (id) => {
    setFilters((previous) => ({
      ...previous,
      ozellikIds: previous.ozellikIds.includes(id)
        ? previous.ozellikIds.filter((x) => x !== id)
        : [...previous.ozellikIds, id],
    }));
  };

  const clearShare = () => {
    setShareUrl("");
    setShareError("");
    setCopied(false);
  };

  const handleSearch = (event) => {
    event.preventDefault();

    if (Boolean(filters.giris) !== Boolean(filters.cikis)) {
      setError("Giriş ve çıkış tarihlerini birlikte seçmelisiniz.");
      return;
    }

    if (filters.giris && filters.cikis <= filters.giris) {
      setError("Çıkış tarihi giriş tarihinden sonra olmalı.");
      return;
    }

    setError("");
    setPage(1);
    setSelectedIds([]);
    clearShare();

    setAppliedFilters({
      ...filters,
      ozellikIds: [...filters.ozellikIds],
    });

    setReloadKey((value) => value + 1);
  };

  const handleReset = () => {
    setFilters(createInitialFilters());
    setAppliedFilters(createInitialFilters());
    setSelectedIds([]);
    setPage(1);
    setError("");
    clearShare();
    setReloadKey((value) => value + 1);
  };

  // -------------------------------------------
  // Selections
  // -------------------------------------------

  const toggleSelected = (id) => {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((x) => x !== id)
        : [...previous, id],
    );

    clearShare();
  };

  const toggleVisible = () => {
    setSelectedIds((previous) => {
      if (allVisibleSelected) {
        return previous.filter((id) => !visibleIds.includes(id));
      }

      return [...new Set([...previous, ...visibleIds])];
    });

    clearShare();
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
    clearShare();
  };

  // -------------------------------------------
  // Create link
  // -------------------------------------------

  const handleCreateLink = async () => {
    if (selectedIds.length === 0 || selectedIds.length > 50 || creatingLink) {
      return;
    }

    setCreatingLink(true);
    setShareError("");
    setShareUrl("");
    setCopied(false);

    try {
      const response = await createEmlakPaylasim({
        baslik: "Size Özel Villa Önerileri",
        girisTarihi: appliedFilters.giris || null,
        cikisTarihi: appliedFilters.cikis || null,
        emlakIds: selectedIds,
      });

      if (!response?.token) {
        throw new Error("API token döndürmedi.");
      }

      const customerSite = (
        process.env.NEXT_PUBLIC_CUSTOMER_SITE_URL || window.location.origin
      ).replace(/\/$/, "");

      setShareUrl(
        `${customerSite}/teklif/${encodeURIComponent(response.token)}`,
      );
    } catch (err) {
      console.error("Link oluşturma hatası:", err);

      setShareError(
        err?.response?.data?.message ||
          err?.message ||
          "Link oluşturulurken hata oluştu.",
      );
    } finally {
      setCreatingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setShareError("");
    } catch {
      setShareError("Link kopyalanamadı. Manuel olarak kopyalayabilirsiniz.");
    }
  };

  // -------------------------------------------
  // JSX
  // -------------------------------------------

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            Emlak Ara
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Müşteriniz için uygun villaları arayın ve teklif listenizi
            oluşturun.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setReloadKey((v) => v + 1)}
          disabled={loading}
          title="Listeyi yenile"
          aria-label="Listeyi yenile"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* FILTER CARD */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <SlidersHorizontal size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Gelişmiş Filtreler
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Boş bırakılan filtreler uygulanmaz.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="space-y-5 px-5 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FilterField label="Giriş tarihi" id="giris">
              <input
                id="giris"
                type="date"
                value={filters.giris}
                onChange={(e) => changeFilter("giris", e.target.value)}
                className={inputClass}
              />
            </FilterField>

            <FilterField label="Çıkış tarihi" id="cikis">
              <input
                id="cikis"
                type="date"
                min={filters.giris || undefined}
                value={filters.cikis}
                onChange={(e) => changeFilter("cikis", e.target.value)}
                className={inputClass}
              />
            </FilterField>

            <FilterField label="Bölge" id="bolgeId">
              <select
                id="bolgeId"
                value={filters.bolgeId}
                onChange={(e) => changeFilter("bolgeId", e.target.value)}
                className={inputClass}
              >
                <option value="">Tüm bölgeler</option>
                {regionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-400">
                Alt bölgeler de aranır.
              </p>
            </FilterField>

            <FilterField label="Emlak tipi" id="emlakTipi">
              <select
                id="emlakTipi"
                value={filters.emlakTipi}
                onChange={(e) => changeFilter("emlakTipi", e.target.value)}
                className={inputClass}
              >
                <option value="">Tüm tipler</option>
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Minimum kapasite" id="minKapasite">
              <input
                id="minKapasite"
                type="number"
                min="1"
                placeholder="Örn: 6"
                value={filters.minKapasite}
                onChange={(e) => changeFilter("minKapasite", e.target.value)}
                className={inputClass}
              />
            </FilterField>

            <FilterField label="Minimum yatak odası" id="minYatakOdasi">
              <input
                id="minYatakOdasi"
                type="number"
                min="0"
                placeholder="Örn: 3"
                value={filters.minYatakOdasi}
                onChange={(e) => changeFilter("minYatakOdasi", e.target.value)}
                className={inputClass}
              />
            </FilterField>

            <FilterField label="Minimum banyo" id="minBanyo">
              <input
                id="minBanyo"
                type="number"
                min="0"
                placeholder="Örn: 2"
                value={filters.minBanyo}
                onChange={(e) => changeFilter("minBanyo", e.target.value)}
                className={inputClass}
              />
            </FilterField>

            <FilterField label="Havuz korunak tipi" id="havuzKorunakTipi">
              <select
                id="havuzKorunakTipi"
                value={filters.havuzKorunakTipi}
                onChange={(e) =>
                  changeFilter("havuzKorunakTipi", e.target.value)
                }
                className={inputClass}
              >
                <option value="">Tümü</option>
                {HAVUZ_KORUNAK_TIPLERI.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FilterField>
          </div>

          {/* FEATURES */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700">
                Emlak özellikleri
              </p>

              {filters.ozellikIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => changeFilter("ozellikIds", [])}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Seçimi temizle
                </button>
              )}
            </div>

            <div className="grid max-h-44 grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-4">
              {features.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Henüz özellik bulunamadı.
                </p>
              ) : (
                features.map((feature) => {
                  const id = Number(feature.id);

                  return (
                    <label
                      key={id}
                      className="flex cursor-pointer items-center gap-2 text-xs text-slate-600"
                    >
                      <input
                        type="checkbox"
                        checked={filters.ozellikIds.includes(id)}
                        onChange={() => toggleFeature(id)}
                        className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                      />
                      {feature.ozellikAdi ?? feature.ad ?? `Özellik #${id}`}
                    </label>
                  );
                })
              )}
            </div>

            <p className="mt-3 text-[11px] text-slate-400">
              Seçilen özelliklerin tümüne sahip emlaklar bulunur.
            </p>
          </div>

          {optionsError && (
            <p className="text-xs text-amber-700">{optionsError}</p>
          )}

          {/* FILTER ACTIONS */}
          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RotateCcw size={16} />
              Temizle
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Search size={17} />
              )}
              Ara / Filtrele
            </button>
          </div>
        </form>
      </section>

      {/* RESULTS */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <House size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Arama Sonuçları
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {loading ? "Yükleniyor..." : `${totalCount} emlak bulundu`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="pageSize"
              className="text-xs font-medium text-slate-500"
            >
              Sayfa başına
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mx-5 mt-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
          >
            <AlertCircle size={19} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <Loader2 size={30} className="animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">Emlaklar yükleniyor...</p>
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto pb-3">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="w-14 px-5 py-4">
                      <input
                        type="checkbox"
                        aria-label="Bu sayfadaki tüm emlakları seç"
                        checked={allVisibleSelected}
                        onChange={toggleVisible}
                        disabled={!visibleIds.length}
                        className="h-4 w-4 accent-blue-600"
                      />
                    </th>
                    <th className="px-4 py-4">Emlak</th>
                    <th className="px-4 py-4">Bölge</th>
                    <th className="px-4 py-4">Tip</th>
                    <th className="px-4 py-4">Kapasite</th>
                    <th className="px-4 py-4">Yatak Odası</th>
                    <th className="px-4 py-4">Banyo</th>
                    <th className="px-4 py-4 text-right">Detay</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleEmlaklar.map((emlak) => {
                    const checked = selectedIds.includes(emlak.id);

                    const imageUrl = getImageUrl(emlak.kapakFotografUrl);

                    return (
                      <tr
                        key={emlak.id}
                        className={`transition hover:bg-slate-50/70 ${
                          checked ? "bg-blue-50/40" : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            aria-label={`${emlak.emlakAdi} seç`}
                            checked={checked}
                            onChange={() => toggleSelected(emlak.id)}
                            className="h-4 w-4 accent-blue-600"
                          />
                        </td>

                        {/* PHOTO + NAME */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                              {imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={imageUrl}
                                  alt={emlak.emlakAdi}
                                  loading="lazy"
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.nextElementSibling?.classList.remove(
                                      "hidden",
                                    );
                                  }}
                                />
                              ) : null}

                              <House
                                size={23}
                                className={
                                  imageUrl
                                    ? "hidden text-slate-400"
                                    : "text-slate-400"
                                }
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[200px] truncate text-sm font-bold text-slate-900">
                                {emlak.emlakAdi}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                #{emlak.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* REGION */}
                        <td className="px-4 py-4">
                          <span className="flex items-center gap-1.5 text-sm text-slate-600">
                            <MapPin size={15} className="text-slate-400" />
                            {regionMap.get(Number(emlak.bolgeId)) ||
                              emlak.bolgeAdi ||
                              "-"}
                          </span>
                        </td>

                        {/* TYPE */}
                        <td className="px-4 py-4">
                          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                            {emlak.emlakTipiAdi}
                          </span>
                        </td>

                        {/* CAPACITY */}
                        <td className="px-4 py-4">
                          <span className="flex items-center gap-1.5 text-sm text-slate-600">
                            <UsersRound size={16} className="text-slate-400" />
                            {emlak.kapasite ?? "-"}
                          </span>
                        </td>

                        {/* BEDROOMS */}
                        <td className="px-4 py-4">
                          <span className="flex items-center gap-1.5 text-sm text-slate-600">
                            <BedDouble size={16} className="text-slate-400" />
                            {emlak.yatakOdasiSayisi}
                          </span>
                        </td>

                        {/* BATHROOMS */}
                        <td className="px-4 py-4">
                          <span className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Bath size={16} className="text-slate-400" />
                            {emlak.banyoSayisi}
                          </span>
                        </td>

                        {/* DETAILS */}
                        <td className="px-4 py-4 text-right">
                          <Link
                            href={`/emlaklar/${emlak.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Görüntüle
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!visibleEmlaklar.length && (
                <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
                  <House size={28} className="mb-3 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-800">
                    Emlak bulunamadı
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Filtrelerinizi değiştirip tekrar arayabilirsiniz.
                  </p>
                </div>
              )}
            </div>

            {/* SERVER-SIDE PAGINATION */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:px-6">
              <p className="text-xs text-slate-500">
                Toplam <strong className="text-slate-700">{totalCount}</strong>{" "}
                emlaktan {totalCount ? (page - 1) * pageSize + 1 : 0}–
                {Math.min(page * pageSize, totalCount)} arası gösteriliyor
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  disabled={page === 1 || loading}
                  aria-label="İlk sayfa"
                  className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
                >
                  <ChevronsLeft size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  aria-label="Önceki sayfa"
                  className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                </button>

                <span className="px-2 text-xs font-semibold text-slate-600">
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  aria-label="Sonraki sayfa"
                  className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
                >
                  <ChevronRight size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages || loading}
                  aria-label="Son sayfa"
                  className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
                >
                  <ChevronsRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* SHARE LINK RESULT */}
      {(shareError || shareUrl) && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {shareError && (
            <div
              role="alert"
              className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
            >
              <AlertCircle size={19} />
              {shareError}
            </div>
          )}

          {shareUrl && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Link2 size={21} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Paylaşım Linki Hazır
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Seçtiğiniz emlaklar için özel bağlantı oluşturuldu.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  onFocus={(e) => e.target.select()}
                  aria-label="Paylaşım bağlantısı"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-blue-500"
                />

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition ${
                    copied
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {copied ? <Check size={17} /> : <Copy size={17} />}
                  {copied ? "Kopyalandı" : "Linki Kopyala"}
                </button>

                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ExternalLink size={17} />
                  Önizle
                </a>
              </div>

              <p className="text-xs text-slate-500">
                Bağlantı 30 gün geçerlidir.
              </p>
            </div>
          )}
        </section>
      )}

      {/* SELECTION BAR */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-5 py-4 shadow-lg backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CheckSquare2 size={20} />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              {selectedIds.length} emlak seçildi
            </p>
            <p className="text-xs text-slate-500">
              Seçimler sayfalar arasında korunur.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearSelection}
            disabled={!selectedIds.length || creatingLink}
            className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            Seçimi Temizle
          </button>

          <button
            type="button"
            onClick={handleCreateLink}
            disabled={
              selectedIds.length === 0 ||
              selectedIds.length > 50 ||
              creatingLink ||
              loading
            }
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creatingLink ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Link2 size={17} />
            )}
            {creatingLink ? "Oluşturuluyor..." : "Link Oluştur"}
          </button>
        </div>
      </div>
    </div>
  );
}
