"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  ListChecks,
  SlidersHorizontal,
  RotateCcw,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";

import {
  getEmlakOzellikler,
  deleteEmlakOzellik,
} from "@/app/services/emlakOzellik.service";

import { OZELLIK_KATEGORILERI } from "@/constants/emlakOzellik";

import EmlakOzellikTable from "@/components/emlak-ozellik/emlakOzellikTable";
import EmlakOzellikFormModal from "@/components/emlak-ozellik/emlakOzellikFormModal";
import DeleteEmlakOzellikModal from "@/components/emlak-ozellik/deleteEmlakOzellikModal";

const PAGE_SIZE = 10;

function extractList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getErrorMessage(error, fallback) {
  const response = error.response?.data;

  if (typeof response === "string" && response) {
    return response;
  }

  if (response?.errors) {
    return Object.entries(response.errors)
      .flatMap(([field, messages]) =>
        (Array.isArray(messages) ? messages : [messages]).map(
          (message) => `${field}: ${message}`,
        ),
      )
      .join(" | ");
  }

  return response?.message || response?.title || fallback;
}

export default function EmlakOzelliklerPage() {
  const [features, setFeatures] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);

  const [deletingFeature, setDeletingFeature] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // API'den özellikleri yükle
  useEffect(() => {
    let active = true;

    const loadFeatures = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getEmlakOzellikler();

        if (!active) return;

        setFeatures(extractList(data));
      } catch (err) {
        if (!active) return;

        setError(getErrorMessage(err, "Emlak özellikleri yüklenemedi."));

        setFeatures([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadFeatures();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  // Arama + kategori filtresi
  const filteredFeatures = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    return features.filter((feature) => {
      const matchesSearch =
        !query ||
        String(feature.ozellikAdi || "")
          .toLocaleLowerCase("tr-TR")
          .includes(query);

      const matchesCategory =
        category === "" || Number(feature.kategori) === Number(category);

      return matchesSearch && matchesCategory;
    });
  }, [features, search, category]);

  // Sayfalama
  const totalPages = Math.max(
    1,
    Math.ceil(filteredFeatures.length / PAGE_SIZE),
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedFeatures = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredFeatures.slice(start, start + PAGE_SIZE);
  }, [filteredFeatures, currentPage]);

  const refresh = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setPage(1);
  };

  const openCreate = () => {
    setEditingFeature(null);
    setFormOpen(true);
  };

  const openEdit = (feature) => {
    setEditingFeature(feature);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingFeature(null);
  };

  const handleSaved = (message) => {
    closeForm();
    setNotice(message);
    refresh();
  };

  const openDelete = (feature) => {
    setDeleteError("");
    setDeletingFeature(feature);
  };

  const closeDelete = () => {
    if (deleting) return;

    setDeletingFeature(null);
    setDeleteError("");
  };

  const handleDelete = async () => {
    if (!deletingFeature || deleting) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await deleteEmlakOzellik(deletingFeature.id);

      setDeletingFeature(null);
      setNotice("Emlak özelliği başarıyla silindi.");

      refresh();
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Emlak özelliği silinemedi."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sayfa başlığı */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            Emlak Özellikleri
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Villalarınızda kullanılan özellikleri ve kategorilerini yönetin.
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
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Yeni Özellik Ekle
          </button>
        </div>
      </div>

      {/* Başarı mesajı */}
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

      {/* İçerik kartı */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Kart başlığı */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ListChecks size={20} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Tüm Emlak Özellikleri
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {loading
                  ? "Yükleniyor..."
                  : `${filteredFeatures.length} kayıt bulundu`}
              </p>
            </div>
          </div>
        </div>

        {/* Filtreler */}
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-blue-600" />

            <h3 className="text-sm font-bold text-slate-800">
              Arama ve Filtreleme
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_260px_44px]">
            {/* Arama */}
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Özellik adına göre ara..."
                aria-label="Özellik ara"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            {/* Kategori */}
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              aria-label="Kategori filtresi"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            >
              <option value="">Tüm Kategoriler</option>

              {OZELLIK_KATEGORILERI.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            {/* Filtreleri sıfırla */}
            <button
              type="button"
              onClick={resetFilters}
              title="Filtreleri temizle"
              aria-label="Filtreleri temizle"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-blue-600"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* API hatası */}
        {error && (
          <div
            role="alert"
            className="mx-5 mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
          >
            <AlertCircle size={19} />
            {error}
          </div>
        )}

        {/* Tablo */}
        {loading ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
            <Loader2 size={30} className="animate-spin text-blue-600" />

            <p className="text-sm text-slate-500">
              Emlak özellikleri yükleniyor...
            </p>
          </div>
        ) : !error ? (
          <EmlakOzellikTable
            features={paginatedFeatures}
            page={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={filteredFeatures.length}
            onPageChange={setPage}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        ) : null}
      </section>

      {/* Ekle / Düzenle */}
      <EmlakOzellikFormModal
        open={formOpen}
        feature={editingFeature}
        onClose={closeForm}
        onSaved={handleSaved}
      />

      {/* Silme onayı */}
      <DeleteEmlakOzellikModal
        feature={deletingFeature}
        loading={deleting}
        error={deleteError}
        onClose={closeDelete}
        onConfirm={handleDelete}
      />
    </div>
  );
}
