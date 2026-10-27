"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MapPinned,
  Plus,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

import { getBolgeler, deleteBolge } from "@/app/services/bolge.service";

import {
  buildBolgeTree,
  filterBolgeTree,
  getExpandableIds,
} from "@/utils/bolgeTree";

import BolgeTreeTable from "@/components/bolge/bolgeTreeTable";
import BolgeFormModal from "@/components/bolge/bolgeFormModal";
import DeleteBolgeModal from "@/components/bolge/deleteBolgeModal";

function extractList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getErrorMessage(error, fallback) {
  const data = error.response?.data;

  if (typeof data === "string" && data) return data;

  if (data?.errors) {
    return Object.entries(data.errors)
      .flatMap(([field, messages]) =>
        (Array.isArray(messages) ? messages : [messages]).map(
          (message) => `${field}: ${message}`,
        ),
      )
      .join(" | ");
  }

  return data?.message || data?.title || fallback;
}

export default function BolgelerPage() {
  const [bolgeler, setBolgeler] = useState([]);
  const [search, setSearch] = useState("");

  const [expandedIds, setExpandedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingBolge, setEditingBolge] = useState(null);
  const [newParentId, setNewParentId] = useState(null);

  const [deletingBolge, setDeletingBolge] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // API'den bölge listesini çek
  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await getBolgeler();
        if (!active) return;

        const list = extractList(result);
        setBolgeler(list);
      } catch (err) {
        if (!active) return;

        setBolgeler([]);
        setError(getErrorMessage(err, "Bölgeler yüklenemedi."));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  // Düz liste -> ağaç
  const tree = useMemo(() => buildBolgeTree(bolgeler), [bolgeler]);

  const filteredTree = useMemo(
    () => filterBolgeTree(tree, search),
    [tree, search],
  );

  const allExpandableIds = useMemo(() => getExpandableIds(tree), [tree]);

  // Arama sırasında eşleşen dalları görünür kıl
  const visibleExpandedIds = useMemo(() => {
    if (search.trim()) {
      return new Set(getExpandableIds(filteredTree));
    }

    return expandedIds;
  }, [search, filteredTree, expandedIds]);

  // Açık/kapanır satır yönetimi
  const toggleNode = (id) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const expandAll = () => {
    setSearch("");
    setExpandedIds(new Set(allExpandableIds));
  };

  const collapseAll = () => {
    setSearch("");
    setExpandedIds(new Set());
  };

  const clearSearch = () => setSearch("");

  const refresh = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  const openCreate = () => {
    setEditingBolge(null);
    setNewParentId(null);
    setFormOpen(true);
  };

  const openAddChild = (parent) => {
    setEditingBolge(null);
    setNewParentId(parent.id);
    setFormOpen(true);
  };

  const openEdit = (bolge) => {
    setEditingBolge(bolge);
    setNewParentId(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingBolge(null);
    setNewParentId(null);
  };

  const handleSaved = (message) => {
    if (newParentId != null) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.add(Number(newParentId));
        return next;
      });
    }

    closeForm();
    setNotice(message);
    refresh();
  };

  const openDelete = (bolge) => {
    setDeleteError("");
    setDeletingBolge(bolge);
  };

  const closeDelete = () => {
    if (deleting) return;

    setDeletingBolge(null);
    setDeleteError("");
  };

  const handleDelete = async () => {
    if (!deletingBolge || deleting) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await deleteBolge(deletingBolge.id);

      setDeletingBolge(null);
      setNotice("Bölge başarıyla silindi.");
      refresh();
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Bölge silinemedi."));
    } finally {
      setDeleting(false);
    }
  };

  const rootCount = tree.length;
  const totalCount = bolgeler.length;

  return (
    <div className="space-y-6">
      {/* Sayfa başlığı */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            Bölgeler
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Ana bölgeleri, alt bölgeleri ve konum hiyerarşisini yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            title="Listeyi yenile"
            aria-label="Listeyi yenile"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={18} />
            Yeni Bölge Ekle
          </button>
        </div>
      </div>

      {/* Başarı bildirimi */}
      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={19} />
            <span>{notice}</span>
          </div>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Bildirimi kapat"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Ana kart */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Kart üst alanı */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <MapPinned size={20} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Bölge Hiyerarşisi
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {loading
                  ? "Yükleniyor..."
                  : `${totalCount} bölge · ${rootCount} ana bölge`}
              </p>
            </div>
          </div>
        </div>

        {/* Arama ve kontroller */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Bölge adına göre ara..."
              aria-label="Bölge ara"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <button
            type="button"
            onClick={expandAll}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <ChevronDown size={17} />
            Tümünü Aç
          </button>

          <button
            type="button"
            onClick={collapseAll}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <ChevronUp size={17} />
            Tümünü Kapat
          </button>

          <button
            type="button"
            onClick={clearSearch}
            aria-label="Aramayı temizle"
            title="Aramayı temizle"
            disabled={!search}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
          >
            <RotateCcw size={17} />
          </button>
        </div>

        {search.trim() && (
          <p className="border-b border-slate-100 bg-blue-50/40 px-6 py-3 text-xs text-blue-700">
            Arama sonuçlarında eşleşen bölgelerin üst dalları otomatik olarak
            gösterilir.
          </p>
        )}

        {/* Hata */}
        {error && (
          <div
            role="alert"
            className="mx-5 mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
          >
            <AlertCircle size={19} />
            {error}
          </div>
        )}

        {/* Ağaç tablosu */}
        {loading ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
            <Loader2 size={30} className="animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">Bölgeler yükleniyor...</p>
          </div>
        ) : !error ? (
          <BolgeTreeTable
            tree={filteredTree}
            expandedIds={visibleExpandedIds}
            onToggle={toggleNode}
            onAddChild={openAddChild}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        ) : null}
      </section>

      {/* Bölge ekle / düzenle */}
      <BolgeFormModal
        open={formOpen}
        bolge={editingBolge}
        parentId={newParentId}
        bolgeler={bolgeler}
        onClose={closeForm}
        onSaved={handleSaved}
      />

      {/* Silme */}
      <DeleteBolgeModal
        bolge={deletingBolge}
        loading={deleting}
        error={deleteError}
        onClose={closeDelete}
        onConfirm={handleDelete}
      />
    </div>
  );
}
