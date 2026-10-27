"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  Plus,
  Search,
  RefreshCw,
  UsersRound,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";

import {
  getPagedEmlakSahipleri,
  deleteEmlakSahibi,
} from "@/app/services/emlakSahibi.service";

import EmlakSahibiTable from "@/components/emlak-sahibi/emlakSahibiTable";
import EmlakSahibiFormModal from "@/components/emlak-sahibi/emlakSahibiFormModal";
import EmlakSahibiDetailModal from "@/components/emlak-sahibi/emlakSahibiDetailModal";
import DeleteEmlakSahibiModal from "@/components/emlak-sahibi/deleteEmlakSahibiModal";

function getErrorMessage(error, fallback) {
  const response = error?.response?.data;

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

export default function EmlakSahipleriPage() {
  // Liste ve filtreler
  const [owners, setOwners] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Arama yazılırken önceki sonuçları göstermemek için
  const [searchPending, setSearchPending] = useState(false);
  const debounceTimerRef = useRef(null);

  // Modallar
  const [formOpen, setFormOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState(null);
  const [detailOwner, setDetailOwner] = useState(null);
  const [deletingOwner, setDeletingOwner] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Debounced arama
  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);

    setSearchPending(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value.trim());
      setSearchPending(false);
    }, 350);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Backend'den sayfalı veri çek
  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const loadOwners = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getPagedEmlakSahipleri(
          {
            page,
            pageSize,
            ...(debouncedSearch ? { search: debouncedSearch } : {}),
          },
          controller.signal,
        );

        if (!active) return;

        const items = Array.isArray(data?.items) ? data.items : [];

        const count = Number(data?.totalCount ?? 0);
        const validCount = Number.isFinite(count) ? Math.max(0, count) : 0;

        const lastPage = Math.max(1, Math.ceil(validCount / pageSize));

        // Örneğin son kaydı silince sayfa 5 artık yoksa
        // sayfa 4'e geçerek yeni sorgu çalıştır.
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }

        setOwners(items);
        setTotalCount(validCount);
      } catch (err) {
        if (
          !active ||
          controller.signal.aborted ||
          err?.code === "ERR_CANCELED"
        ) {
          return;
        }

        setOwners([]);
        setTotalCount(0);

        setError(getErrorMessage(err, "Emlak sahipleri yüklenemedi."));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadOwners();

    return () => {
      active = false;
      controller.abort();
    };
  }, [page, pageSize, debouncedSearch, reloadKey]);

  const refresh = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  // Modal işlemleri
  const openCreate = () => {
    setEditingOwner(null);
    setFormOpen(true);
  };

  const openEdit = (owner) => {
    setDetailOwner(null);
    setEditingOwner(owner);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingOwner(null);
  };

  const handleSaved = (message) => {
    closeForm();
    setNotice(message || "Emlak sahibi kaydedildi.");
    refresh();
  };

  const openDelete = (owner) => {
    setDeleteError("");
    setDeletingOwner(owner);
  };

  const closeDelete = () => {
    if (deleting) return;

    setDeletingOwner(null);
    setDeleteError("");
  };

  const handleDelete = async () => {
    if (!deletingOwner || deleting) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await deleteEmlakSahibi(deletingOwner.id);

      setDeletingOwner(null);
      setNotice("Emlak sahibi başarıyla silindi.");
      refresh();
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Emlak sahibi silinemedi."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            Emlak Sahipleri
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Mülk sahiplerini, iletişim bilgilerini ve emlaklarını yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading || searchPending}
            title="Listeyi yenile"
            aria-label="Listeyi yenile"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Yeni Emlak Sahibi
          </button>
        </div>
      </div>

      {/* Başarılı işlem bildirimi */}
      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={19} />
            {notice}
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

      {/* Liste */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Kart başlığı */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UsersRound size={20} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Tüm Emlak Sahipleri
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {loading || searchPending
                  ? "Yükleniyor..."
                  : `${totalCount} kayıt bulundu`}
              </p>
            </div>
          </div>
        </div>

        {/* Arama ve sayfa boyutu */}
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full max-w-lg">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Ad, soyad, telefon veya e-posta ara..."
                aria-label="Emlak sahibi ara"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <label
                htmlFor="ownerPageSize"
                className="text-sm font-medium text-slate-500"
              >
                Göster:
              </label>

              <select
                id="ownerPageSize"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size} kayıt
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

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

        {/* Tablo */}
        {loading || searchPending ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
            <Loader2 size={30} className="animate-spin text-blue-600" />

            <p className="text-sm text-slate-500">
              Emlak sahipleri yükleniyor...
            </p>
          </div>
        ) : !error ? (
          <EmlakSahibiTable
            owners={owners}
            page={page}
            pageSize={pageSize}
            totalItems={totalCount}
            onPageChange={setPage}
            onDetail={setDetailOwner}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        ) : null}
      </section>

      {/* Oluştur / Düzenle */}
      <EmlakSahibiFormModal
        open={formOpen}
        owner={editingOwner}
        onClose={closeForm}
        onSaved={handleSaved}
      />

      {/* Detay */}
      <EmlakSahibiDetailModal
        owner={detailOwner}
        onClose={() => setDetailOwner(null)}
        onEdit={openEdit}
      />

      {/* Silme */}
      <DeleteEmlakSahibiModal
        owner={deletingOwner}
        loading={deleting}
        error={deleteError}
        onClose={closeDelete}
        onConfirm={handleDelete}
      />
    </div>
  );
}
