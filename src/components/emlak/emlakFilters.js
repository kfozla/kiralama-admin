"use client";

import {
  Search,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Check,
  Minus,
  MapPin,
  X,
} from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";

// Flat bölge listesini ağaç yapısına dönüştürür.
function buildRegionTree(regions) {
  const map = new Map();

  for (const region of regions) {
    const id = Number(region.id);

    if (!Number.isInteger(id)) continue;

    map.set(id, {
      id,
      name: region.name ?? region.ad ?? "",
      parentId:
        region.parentBolgeId == null ? null : Number(region.parentBolgeId),
      children: [],
    });
  }

  const roots = [];

  for (const node of map.values()) {
    const parent = map.get(node.parentId);

    if (parent && parent.id !== node.id) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (items, visited = new Set()) => {
    items.sort((a, b) => a.name.localeCompare(b.name, "tr"));

    for (const node of items) {
      if (visited.has(node.id)) {
        node.children = [];
        continue;
      }

      visited.add(node.id);

      node.children = node.children.filter((child) => !visited.has(child.id));

      sortNodes(node.children, visited);
    }
  };

  sortNodes(roots);

  return roots;
}

// Bir bölge ve bütün alt bölgelerinin ID'leri
function collectDescendantIds(node) {
  const ids = [];
  const visited = new Set();

  const visit = (current) => {
    if (visited.has(current.id)) return;

    visited.add(current.id);
    ids.push(current.id);

    for (const child of current.children) {
      visit(child);
    }
  };

  visit(node);

  return ids;
}

function RegionNode({
  node,
  selectedIds,
  expandedIds,
  onToggle,
  onExpand,
  depth = 0,
}) {
  const ids = useMemo(
    () => collectDescendantIds(node.sourceNode ?? node),
    [node],
  );

  const selectedCount = ids.filter((id) => selectedIds.has(id)).length;

  const fullySelected = selectedCount === ids.length;
  const partiallySelected = selectedCount > 0 && !fullySelected;

  const hasChildren = node.children.length > 0;
  const expanded = expandedIds.has(node.id);

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded-lg transition-colors ${
          fullySelected ? "bg-blue-50/80" : "hover:bg-slate-50"
        }`}
        style={{
          paddingLeft: `${8 + depth * 18}px`,
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onExpand(node.id)}
            aria-label={`${node.name} alt bölgelerini ${
              expanded ? "kapat" : "aç"
            }`}
            aria-expanded={expanded}
            className="flex h-9 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span className="block w-7 shrink-0" />
        )}

        <button
          type="button"
          role="checkbox"
          aria-checked={partiallySelected ? "mixed" : fullySelected}
          onClick={() => onToggle(node.sourceNode ?? node)}
          className="flex min-h-10 min-w-0 flex-1 items-center gap-2.5 py-1.5 pr-2 text-left"
        >
          <span
            className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors ${
              fullySelected
                ? "border-blue-600 bg-blue-600 text-white"
                : partiallySelected
                  ? "border-blue-600 bg-blue-100 text-blue-600"
                  : "border-slate-300 bg-white"
            }`}
          >
            {fullySelected && <Check size={13} strokeWidth={3} />}
            {partiallySelected && <Minus size={13} strokeWidth={3} />}
          </span>

          <span
            className={`min-w-0 flex-1 truncate text-sm ${
              fullySelected ? "font-semibold text-blue-700" : "text-slate-700"
            }`}
          >
            {node.name}
          </span>

          {hasChildren && (
            <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
              {node.children.length} alt
            </span>
          )}
        </button>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <RegionNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onExpand={onExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function EmlakFilters({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  regions = [],
  types = [],
  features = [],
  onReset,
}) {
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [regionsOpen, setRegionsOpen] = useState(false);
  const [regionSearch, setRegionSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());

  const [typesOpen, setTypesOpen] = useState(false);
  const typesRef = useRef(null);

  const featuresRef = useRef(null);
  const regionsRef = useRef(null);

  const selectedRegionIds = useMemo(
    () => new Set((filters.bolgeIds ?? []).map(Number)),
    [filters.bolgeIds],
  );

  const regionTree = useMemo(() => buildRegionTree(regions), [regions]);

  const allRegionIds = useMemo(
    () => regions.map((region) => Number(region.id)).filter(Number.isInteger),
    [regions],
  );

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    if (!featuresOpen && !regionsOpen) return;

    const handleOutside = (event) => {
      if (featuresOpen && !featuresRef.current?.contains(event.target)) {
        setFeaturesOpen(false);
      }

      if (regionsOpen && !regionsRef.current?.contains(event.target)) {
        setRegionsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setFeaturesOpen(false);
        setRegionsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutside);

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutside);

      document.removeEventListener("keydown", handleEscape);
    };
  }, [featuresOpen, regionsOpen]);

  useEffect(() => {
    if (!typesOpen) return;

    const handleOutside = (event) => {
      if (!typesRef.current?.contains(event.target)) {
        setTypesOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutside);

    return () => {
      document.removeEventListener("pointerdown", handleOutside);
    };
  }, [typesOpen]);

  const updateFilter = (key, value) => {
    onFiltersChange((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleFeature = (id) => {
    onFiltersChange((prev) => {
      const selected = prev.ozellikIds ?? [];

      return {
        ...prev,
        ozellikIds: selected.includes(id)
          ? selected.filter((value) => value !== id)
          : [...selected, id],
      };
    });
  };

  // Üst bölge seçilirse tüm alt bölge ID'leri seçilir.
  // Alt bölge tek tek kaldırılabilir.
  const toggleRegion = (node) => {
    const subtreeIds = collectDescendantIds(node);

    onFiltersChange((prev) => {
      const selected = new Set((prev.bolgeIds ?? []).map(Number));

      const allSelected = subtreeIds.every((id) => selected.has(id));

      for (const id of subtreeIds) {
        if (allSelected) {
          selected.delete(id);
        } else {
          selected.add(id);
        }
      }

      return {
        ...prev,
        bolgeIds: [...selected],
      };
    });
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const selectAllRegions = () => {
    updateFilter("bolgeIds", allRegionIds);
  };

  const clearRegions = () => {
    updateFilter("bolgeIds", []);
  };

  // Bölge araması: eşleşen dalı ve üstlerini göster.
  const visibleTree = useMemo(() => {
    const term = regionSearch.trim().toLocaleLowerCase("tr-TR");

    if (!term) return regionTree;

    const filterTree = (nodes) => {
      const result = [];

      for (const node of nodes) {
        const children = filterTree(node.children);

        const matches = node.name.toLocaleLowerCase("tr-TR").includes(term);

        if (matches || children.length > 0) {
          result.push({
            ...node,
            sourceNode: node.sourceNode ?? node,
            children: matches ? node.children : children,
          });
        }
      }

      return result;
    };

    return filterTree(regionTree);
  }, [regionTree, regionSearch]);

  // Bölge ararken eşleşen alt dalları aç.
  const visibleExpandedIds = useMemo(() => {
    if (!regionSearch.trim()) return expandedIds;

    const next = new Set(expandedIds);

    const visit = (nodes) => {
      for (const node of nodes) {
        if (node.children.length > 0) {
          next.add(node.id);
          visit(node.children);
        }
      }
    };

    visit(visibleTree);
    return next;
  }, [expandedIds, regionSearch, visibleTree]);

  return (
    <div className="border-b border-slate-100 p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal size={18} className="text-blue-600" />
        <h2 className="text-sm font-bold text-slate-800">
          Arama ve Filtreleme
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {/* Özellik filtresi */}
        <div ref={featuresRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setFeaturesOpen((prev) => !prev);
              setRegionsOpen(false);
            }}
            aria-expanded={featuresOpen}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-left text-sm text-slate-700 hover:border-blue-400"
          >
            <span className="truncate">
              {filters.ozellikIds.length > 0
                ? `${filters.ozellikIds.length} özellik seçildi`
                : "Tüm Özellikler"}
            </span>

            <ChevronDown
              size={17}
              className={`shrink-0 text-slate-400 transition-transform ${
                featuresOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {featuresOpen && (
            <div className="absolute left-0 top-full z-40 mt-2 max-h-72 w-full min-w-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              {features.map((feature) => {
                const selected = filters.ozellikIds.includes(feature.id);

                return (
                  <label
                    key={feature.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleFeature(feature.id)}
                      className="h-4 w-4 accent-blue-600"
                    />

                    <span className="flex-1">{feature.ozellikAdi}</span>

                    {selected && <Check size={15} className="text-blue-600" />}
                  </label>
                );
              })}

              {features.length === 0 && (
                <p className="px-3 py-4 text-center text-xs text-slate-400">
                  Özellik bulunamadı.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Emlak adına göre arama */}
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Emlak adına göre ara..."
            aria-label="Emlak ara"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          />
        </div>

        {/* Hiyerarşik çoklu bölge seçimi */}
        <div ref={regionsRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setRegionsOpen((prev) => !prev);
              setFeaturesOpen(false);
            }}
            aria-expanded={regionsOpen}
            aria-label="Bölgeleri seç"
            className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 text-left text-sm transition ${
              selectedRegionIds.size > 0
                ? "border-blue-300 text-blue-700"
                : "border-slate-200 text-slate-700 hover:border-slate-300"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <MapPin size={17} className="shrink-0 text-slate-400" />

              <span className="truncate">
                {selectedRegionIds.size > 0
                  ? `${selectedRegionIds.size} bölge seçildi`
                  : "Tüm Bölgeler"}
              </span>
            </div>

            <ChevronDown
              size={17}
              className={`shrink-0 text-slate-400 transition-transform ${
                regionsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {regionsOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-[min(340px,calc(100vw-40px))] max-w-none overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              {/* Dropdown başlık */}
              <div className="border-b border-slate-100 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">
                    Bölgeleri Seç
                  </span>

                  <button
                    type="button"
                    onClick={() => setRegionsOpen(false)}
                    aria-label="Bölge seçimini kapat"
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="relative">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={regionSearch}
                    onChange={(e) => setRegionSearch(e.target.value)}
                    placeholder="Bölge ara..."
                    aria-label="Bölge ara"
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    {selectedRegionIds.size} seçili
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={selectAllRegions}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Tümünü Seç
                    </button>

                    <button
                      type="button"
                      onClick={clearRegions}
                      className="text-xs font-semibold text-slate-500 hover:text-red-600"
                    >
                      Temizle
                    </button>
                  </div>
                </div>
              </div>

              {/* Bölge ağacı */}
              <div className="max-h-80 overflow-y-auto p-2">
                {visibleTree.map((node) => (
                  <RegionNode
                    key={node.id}
                    node={node}
                    selectedIds={selectedRegionIds}
                    expandedIds={visibleExpandedIds}
                    onToggle={toggleRegion}
                    onExpand={toggleExpand}
                  />
                ))}

                {visibleTree.length === 0 && (
                  <p className="px-3 py-8 text-center text-sm text-slate-400">
                    Bölge bulunamadı.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">
                  Üst bölge tüm alt bölgeleri seçer.
                </p>

                <button
                  type="button"
                  onClick={() => setRegionsOpen(false)}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Tamam
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Emlak Tipi Filtresi */}
        <div ref={typesRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setTypesOpen((prev) => !prev);
              setRegionsOpen(false);
              setFeaturesOpen(false);
            }}
            aria-expanded={typesOpen}
            aria-label="Emlak tipi seç"
            className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 text-left text-sm transition ${
              filters.emlakTipi !== ""
                ? "border-blue-300 text-blue-700"
                : "border-slate-200 text-slate-700 hover:border-slate-300"
            }`}
          >
            <span className="min-w-0 truncate">
              {filters.emlakTipi !== ""
                ? (types.find(
                    (type) => String(type.value) === String(filters.emlakTipi),
                  )?.label ?? "Emlak Tipi")
                : "Tüm Emlak Tipleri"}
            </span>

            <ChevronDown
              size={17}
              className={`shrink-0 text-slate-400 transition-transform ${
                typesOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {typesOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              {/* Tümü seçeneği */}
              <button
                type="button"
                onClick={() => {
                  updateFilter("emlakTipi", "");
                  setTypesOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
                  filters.emlakTipi === ""
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    filters.emlakTipi === ""
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300"
                  }`}
                >
                  {filters.emlakTipi === "" && (
                    <Check size={12} strokeWidth={3} />
                  )}
                </span>

                <span className="flex-1 font-medium">Tüm Emlak Tipleri</span>
              </button>

              <div className="my-2 border-t border-slate-100" />

              {/* Tip seçenekleri */}
              <div className="max-h-64 overflow-y-auto">
                {types.map((type) => {
                  const selected =
                    String(filters.emlakTipi) === String(type.value);

                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        updateFilter("emlakTipi", String(type.value));
                        setTypesOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                        selected
                          ? "bg-blue-50 font-semibold text-blue-700"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                          selected
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {selected && <Check size={12} strokeWidth={3} />}
                      </span>

                      <span className="flex-1 truncate">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Minimum kapasite ve sıfırla */}
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            step="1"
            value={filters.minKapasite}
            onChange={(e) => updateFilter("minKapasite", e.target.value)}
            placeholder="Min. kişi"
            aria-label="Minimum kişi sayısı"
            className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          />

          <button
            type="button"
            onClick={onReset}
            title="Filtreleri temizle"
            aria-label="Filtreleri temizle"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-blue-600"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
