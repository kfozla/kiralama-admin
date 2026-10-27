"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { createPortal } from "react-dom";

import { useController } from "react-hook-form";

import {
  MapPin,
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  X,
} from "lucide-react";

import {
  buildBolgeTree,
  filterBolgeTree,
  getExpandableIds,
} from "@/utils/bolgeTree";

function getRegionPath(id, nodeMap) {
  const parts = [];

  const visited = new Set();

  let current = nodeMap.get(Number(id));

  while (current && !visited.has(current.id)) {
    parts.unshift(current.ad);

    visited.add(current.id);

    current =
      current.parentBolgeId == null ? null : nodeMap.get(current.parentBolgeId);
  }

  return parts.join(" / ");
}

function BolgeNode({ node, depth, selectedId, expanded, onToggle, onSelect }) {
  const hasChildren = node.children.length > 0;

  const isExpanded = expanded.has(node.id);

  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded-lg transition ${
          isSelected
            ? "bg-blue-50 text-blue-700"
            : "text-slate-700 hover:bg-slate-50"
        }`}
        style={{ paddingLeft: `${depth * 17 + 4}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            aria-label={isExpanded ? "Alt bölgeleri kapat" : "Alt bölgeleri aç"}
            aria-expanded={isExpanded}
            className="flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          >
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        ) : (
          <span className="flex h-9 w-8 shrink-0 items-center justify-center">
            <MapPin size={13} className="text-slate-400" />
          </span>
        )}

        <button
          type="button"
          onClick={() => onSelect(node.id)}
          aria-pressed={isSelected}
          className="flex min-h-10 min-w-0 flex-1 items-center justify-between gap-2 py-2 pr-3 text-left text-sm"
        >
          <span
            className={`truncate ${isSelected ? "font-semibold" : "font-medium"}`}
          >
            {node.ad}
          </span>

          {isSelected && <Check size={17} className="shrink-0 text-blue-600" />}
        </button>
      </div>

      {hasChildren &&
        isExpanded &&
        node.children.map((child) => (
          <BolgeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            expanded={expanded}
            onToggle={onToggle}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

export default function bolgeSearch({
  control,

  name = "bolgeId",

  bolgeler = [],

  disabled = false,

  placeholder = "Bölge seçiniz...",
}) {
  const { field, fieldState } = useController({ control, name });

  const triggerRef = useRef(null);

  const panelRef = useRef(null);

  const searchRef = useRef(null);

  const [mounted, setMounted] = useState(false);

  const [open, setOpen] = useState(false);

  const [search, setSearch] = useState("");

  const [expandedIds, setExpandedIds] = useState(new Set());

  const [position, setPosition] = useState(null);

  const tree = useMemo(() => buildBolgeTree(bolgeler), [bolgeler]);

  const nodeMap = useMemo(
    () =>
      new Map(
        bolgeler.map((bolge) => [
          Number(bolge.id),

          {
            ...bolge,

            id: Number(bolge.id),

            parentBolgeId:
              bolge.parentBolgeId == null ? null : Number(bolge.parentBolgeId),
          },
        ]),
      ),

    [bolgeler],
  );

  const selectedId =
    field.value == null || field.value === "" ? null : Number(field.value);

  const selectedPath =
    selectedId == null ? "" : getRegionPath(selectedId, nodeMap);

  const filteredTree = useMemo(
    () => filterBolgeTree(tree, search),

    [tree, search],
  );

  const visibleExpanded = useMemo(
    () =>
      search.trim()
        ? new Set([...expandedIds, ...getExpandableIds(filteredTree)])
        : expandedIds,

    [expandedIds, filteredTree, search],
  );

  useEffect(() => setMounted(true), []);
  // Portal kullanıldığı için konumu input'un ekrandaki rect'inden hesaplıyoruz.
  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();

      if (!rect) return;

      // Panel her zaman butonun ALTINDA açılır.
      const gap = 8;
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;
      const availableBelow = Math.max(
        0,
        viewportHeight - rect.bottom - gap - 8,
      );
      const maxHeight = Math.min(340, availableBelow);

      setPosition({
        left: Math.max(8, rect.left),
        top: rect.bottom + gap,
        width: Math.min(rect.width, window.innerWidth - 16),
        maxHeight: Math.max(0, maxHeight),
      });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.visualViewport?.addEventListener("resize", updatePosition);

    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.visualViewport?.removeEventListener("resize", updatePosition);

      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (event) => {
      if (
        !triggerRef.current?.contains(event.target) &&
        !panelRef.current?.contains(event.target)
      ) {
        setOpen(false);

        field.onBlur();
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);

        field.onBlur();

        triggerRef.current?.focus();
      }
    };

    // Mobil hamburger dahil, portal dışındaki dokunuşları da yakala.
    document.addEventListener("pointerdown", onMouseDown, true);

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onMouseDown, true);

      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, field]);

  useEffect(() => {
    if (open && mounted) searchRef.current?.focus();
  }, [open, mounted]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  function handleOpen() {
    if (disabled) return;

    if (open) {
      setOpen(false);

      field.onBlur();

      return;
    }

    setSearch("");

    const ancestors = new Set();

    const visited = new Set();

    let current = nodeMap.get(selectedId);

    while (
      current &&
      current.parentBolgeId != null &&
      !visited.has(current.id)
    ) {
      visited.add(current.id);

      ancestors.add(current.parentBolgeId);

      current = nodeMap.get(current.parentBolgeId);
    }

    setExpandedIds(ancestors);

    setOpen(true);
  }

  function handleToggle(id) {
    setExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  }

  function handleSelect(id) {
    field.onChange(Number(id)); // Tekli seçim: yalnızca bir bolgeId

    field.onBlur();

    setOpen(false);

    setSearch("");
  }

  function handleClear(event) {
    event.stopPropagation();

    field.onChange(undefined);

    field.onBlur();

    setOpen(false);

    setSearch("");
  }

  return (
    <div className="w-full">
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={handleOpen}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={`flex min-h-11 w-full items-center gap-3 rounded-xl border bg-white px-4 py-2.5 text-left text-sm transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
            fieldState.error
              ? "border-red-400 focus:ring-red-50"
              : open
                ? "border-blue-500 ring-4 ring-blue-50"
                : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-50"
          }`}
        >
          <MapPin size={18} className="shrink-0 text-slate-400" />

          <span
            className={`min-w-0 flex-1 truncate ${
              selectedPath ? "font-medium text-slate-800" : "text-slate-400"
            }`}
            title={selectedPath}
          >
            {selectedPath || placeholder}
          </span>

          <ChevronDown
            size={17}
            className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          />
        </button>

        {selectedId != null && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Bölge seçimini temizle"
            className="absolute right-9 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {mounted &&
        open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Bölge seçimi"
            className="fixed flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            style={{
              left: position.left,

              top: position.top,

              width: position.width,

              maxHeight: position.maxHeight,
              // Mobil menünün üzerinde kalmaması için düşük katman.
              zIndex: 10,
            }}
          >
            <div className="shrink-0 border-b border-slate-100 p-3">
              <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-400">
                <Search size={16} className="text-slate-400" />

                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Bölge adı ara..."
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Aramayı temizle"
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {filteredTree.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-slate-500">
                  Bölge bulunamadı.
                </p>
              ) : (
                filteredTree.map((node) => (
                  <BolgeNode
                    key={node.id}
                    node={node}
                    depth={0}
                    selectedId={selectedId}
                    expanded={visibleExpanded}
                    onToggle={handleToggle}
                    onSelect={handleSelect}
                  />
                ))
              )}
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-4 py-2">
              <p className="text-xs text-slate-500">
                Alt bölgeleri açmak için ok simgesine tıklayın.
              </p>
            </div>
          </div>,

          document.body,
        )}

      {fieldState.error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">
          {fieldState.error.message}
        </p>
      )}
    </div>
  );
}
