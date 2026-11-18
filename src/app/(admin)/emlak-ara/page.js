"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import {
  AlertCircle,
  Bath,
  BedDouble,
  Check,
  CheckSquare2,
  ChevronLeft,
  ChevronsLeft,
  Copy,
  ExternalLink,
  House,
  Link2,
  Loader2,
  MapPin,
  ChevronDown,
  ChevronRight,
  ChevronsRight,
  X,
  Waves,
  ListChecks,
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
  { value: "2", label: "Korunaklı" },

  { value: "1", label: "Yarı Korunaklı" },

  { value: "0", label: "Korunaksız" },
];

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

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

  if (/^https?:\/\//i.test(path)) return path;

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

// Arama ekranında backend tek bir bolgeId kabul ediyor.
// Bu nedenle çoklu bölge yerine hiyerarşik, aramalı tek seçim kullanıyoruz.
function createRegionRows(regions) {
  const all = new Map();
  for (const r of regions) {
    const id = Number(r.id);
    if (!Number.isInteger(id)) continue;
    all.set(id, {
      id,
      name: r.ad ?? r.name ?? `Bölge #${id}`,
      parentId: r.parentBolgeId == null ? null : Number(r.parentBolgeId),
      children: [],
    });
  }
  const roots = [];
  for (const node of all.values()) {
    const parent = all.get(node.parentId);
    if (parent && parent.id !== node.id) parent.children.push(node);
    else roots.push(node);
  }
  const sort = (nodes) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name, "tr"));
    nodes.forEach((n) => sort(n.children));
  };
  // Bölge verisinde döngü olmaması bekleniyor.
  sort(roots);
  return roots;
}

function FilterDropdown({
  title,
  value,
  placeholder,
  options,
  onChange,
  icon: Icon = House,
  searchable = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const escape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const selected = options.find((o) => String(o.value) === String(value));
  const filtered = options.filter(
    (o) =>
      !query ||
      o.label
        .toLocaleLowerCase("tr-TR")
        .includes(query.toLocaleLowerCase("tr-TR")),
  );
  return (
    <div ref={ref} className="relative min-w-0">
      <p className="mb-2 text-xs font-semibold text-slate-600">{title}</p>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-11 w-full items-center gap-2 rounded-xl border bg-white px-3 text-left text-sm transition hover:border-blue-400 ${value !== "" ? "border-blue-300 text-blue-700" : "border-slate-200 text-slate-700"}`}
      >
        <Icon size={16} className="shrink-0 text-slate-400" />
        <span className="min-w-0 flex-1 truncate">
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {searchable && (
            <div className="border-b border-slate-100 p-2">
              <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-2">
                <Search size={15} className="text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ara..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </div>
          )}
          <div className="max-h-64 overflow-y-auto p-1.5">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
                setQuery("");
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-blue-50"
            >
              {placeholder}
              {value === "" && <Check size={16} className="text-blue-600" />}
            </button>
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(String(option.value));
                  setOpen(false);
                  setQuery("");
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-blue-50 ${String(option.value) === String(value) ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-700"}`}
              >
                <span className="truncate">{option.label}</span>
                {String(option.value) === String(value) && (
                  <Check size={16} className="shrink-0 text-blue-600" />
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-slate-500">
                Sonuç bulunamadı.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RegionDropdown({ regions, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());
  const ref = useRef(null);
  const tree = useMemo(() => createRegionRows(regions), [regions]);
  const selected = regions.find((r) => Number(r.id) === Number(value));
  useEffect(() => {
    if (!open) return;
    const outside = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const escape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const term = query.trim().toLocaleLowerCase("tr-TR");
  // Arama eşleşen alt bölgeleri de gösterecek, üst bölge bağlamını korur.
  const renderNodes = (nodes, depth = 0) =>
    nodes.map((node) => {
      const containsMatch = (n) =>
        n.name.toLocaleLowerCase("tr-TR").includes(term) ||
        n.children.some(containsMatch);
      if (term && !containsMatch(node)) return null;
      const visibleChildren = term
        ? node.children
        : expanded.has(node.id)
          ? node.children
          : [];
      const isSelected = String(value) === String(node.id);
      return (
        <div key={node.id}>
          <div
            className={`flex items-center rounded-lg hover:bg-blue-50 ${isSelected ? "bg-blue-50" : ""}`}
            style={{ paddingLeft: `${6 + depth * 15}px` }}
          >
            {node.children.length > 0 ? (
              <button
                type="button"
                onClick={() => toggle(node.id)}
                aria-label={`${node.name} alt bölgeleri`}
                className="flex h-9 w-7 shrink-0 items-center justify-center text-slate-400"
              >
                {expanded.has(node.id) || term ? (
                  <ChevronDown size={15} />
                ) : (
                  <ChevronRight size={15} />
                )}
              </button>
            ) : (
              <span className="w-7 shrink-0" />
            )}
            <button
              type="button"
              onClick={() => {
                onChange(String(node.id));
                setOpen(false);
                setQuery("");
              }}
              className={`flex min-h-10 min-w-0 flex-1 items-center justify-between gap-2 py-2 pr-3 text-left text-sm ${isSelected ? "font-semibold text-blue-700" : "text-slate-700"}`}
            >
              <span className="truncate">{node.name}</span>
              {isSelected && (
                <Check size={16} className="shrink-0 text-blue-600" />
              )}
            </button>
          </div>
          {visibleChildren.length > 0 && (
            <div>{renderNodes(visibleChildren, depth + 1)}</div>
          )}
        </div>
      );
    });
  return (
    <div ref={ref} className="relative min-w-0">
      <p className="mb-2 text-xs font-semibold text-slate-600">Bölge</p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex h-11 w-full items-center gap-2 rounded-xl border bg-white px-3 text-left text-sm transition hover:border-blue-400 ${value !== "" ? "border-blue-300 text-blue-700" : "border-slate-200 text-slate-700"}`}
      >
        <MapPin size={17} className="shrink-0 text-slate-400" />
        <span className="min-w-0 flex-1 truncate">
          {selected?.ad ?? selected?.name ?? "Tüm bölgeler"}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[60] mt-2 w-[min(350px,calc(100vw-48px))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 p-3">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3">
              <Search size={15} className="text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Bölge ara..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setQuery("");
                setOpen(false);
              }}
              className="mt-2 w-full rounded-lg px-2 py-2 text-left text-xs font-semibold text-blue-600 hover:bg-blue-50"
            >
              Tüm bölgeler
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto p-1.5">
            {renderNodes(tree)}
          </div>
          <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
            Üst bölge seçilirse alt bölgeler de aranır.
          </p>
        </div>
      )}
    </div>
  );
}

function FeaturesDropdown({ features, selectedIds, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const escape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const visible = features.filter((f) =>
    (f.ozellikAdi ?? f.ad ?? "")
      .toLocaleLowerCase("tr-TR")
      .includes(query.toLocaleLowerCase("tr-TR")),
  );
  const toggle = (id) =>
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((v) => v !== id)
        : [...selectedIds, id],
    );
  return (
    <div ref={ref} className="relative min-w-0">
      <p className="mb-2 text-xs font-semibold text-slate-600">
        Emlak özellikleri
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex h-11 w-full items-center gap-2 rounded-xl border bg-white px-3 text-left text-sm hover:border-blue-400 ${selectedIds.length ? "border-blue-300 text-blue-700" : "border-slate-200 text-slate-700"}`}
      >
        <ListChecks size={17} className="shrink-0 text-slate-400" />
        <span className="min-w-0 flex-1 truncate">
          {selectedIds.length
            ? `${selectedIds.length} özellik seçildi`
            : "Tüm özellikler"}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-full min-w-[260px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-3">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-2">
              <Search size={15} className="text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Özellik ara..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-slate-500">
                {selectedIds.length} seçili
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="font-semibold text-blue-600"
              >
                Temizle
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-1.5">
            {visible.map((f) => {
              const id = Number(f.id);
              const checked = selectedIds.includes(id);
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => toggle(id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-blue-50"
                >
                  <span
                    className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border ${checked ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"}`}
                  >
                    {checked && <Check size={13} strokeWidth={3} />}
                  </span>
                  <span className="flex-1 text-slate-700">
                    {f.ozellikAdi ?? f.ad ?? `Özellik #${id}`}
                  </span>
                </button>
              );
            })}
            {!visible.length && (
              <p className="px-3 py-4 text-center text-xs text-slate-500">
                Özellik bulunamadı.
              </p>
            )}
          </div>
          <div className="border-t border-slate-100 p-2 text-right">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmlakAraPage() {
  const [filters, setFilters] = useState(createInitialFilters);

  const [appliedFilters, setAppliedFilters] = useState(createInitialFilters);

  const [bolgeler, setBolgeler] = useState([]);

  const [features, setFeatures] = useState([]);

  const [optionsError, setOptionsError] = useState("");

  const [emlaklar, setEmlaklar] = useState([]);

  const [selectedIds, setSelectedIds] = useState([]);

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);

  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  const [creatingLink, setCreatingLink] = useState(false);

  const [shareUrl, setShareUrl] = useState("");

  const [shareError, setShareError] = useState("");

  const [copied, setCopied] = useState(false);

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

  const visibleEmlaklar = emlaklar;

  const visibleIds = visibleEmlaklar.map((e) => e.id);

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

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

      <section className="relative rounded-2xl border border-slate-200 bg-white shadow-sm">
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

            <RegionDropdown
              regions={bolgeler}
              value={filters.bolgeId}
              onChange={(value) => changeFilter("bolgeId", value)}
            />

            <FilterDropdown
              title="Emlak tipi"
              value={filters.emlakTipi}
              placeholder="Tüm tipler"
              options={typeOptions}
              onChange={(value) => changeFilter("emlakTipi", value)}
              icon={House}
            />

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

            <FilterDropdown
              title="Havuz korunak tipi"
              value={filters.havuzKorunakTipi}
              placeholder="Tüm havuz tipleri"
              options={HAVUZ_KORUNAK_TIPLERI}
              onChange={(value) => changeFilter("havuzKorunakTipi", value)}
              icon={Waves}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeaturesDropdown
              features={features}
              selectedIds={filters.ozellikIds}
              onChange={(value) => changeFilter("ozellikIds", value)}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Seçilen özelliklerin tümüne sahip emlaklar bulunur.
          </p>

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
