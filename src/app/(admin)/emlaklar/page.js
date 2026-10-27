"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Plus,
  House,
  RefreshCw,
  AlertCircle,
  Loader2,
  Search,
} from "lucide-react";

import { EMLAK_TIPLERI } from "@/constants/emlak";

import { getPagedEmlaklar, deleteEmlak } from "@/app/services/emlak.service";

import { getBolgeler } from "@/app/services/bolge.service";
import { getEmlakOzellikler } from "@/app/services/emlakOzellik.service";

import EmlakFilters from "@/components/emlak/emlakFilters";
import EmlakTable from "@/components/emlak/emlakTable";
import DeleteEmlakModal from "@/components/emlak/deleteEmlakModal";

const createInitialFilters = () => ({
  bolgeIds: [],
  emlakTipi: "",
  minKapasite: "",
  ozellikIds: [],
});

function normalizeEmlak(item) {
  return {
    ...item,
    id: item.id,
    emlakAdi: item.emlakAdi ?? item.emlakAdı ?? "",
    bolgeId: item.bolgeId ?? null,
    bolgeAdi: item.bolgeAdi ?? item.bolge?.ad ?? "",
    emlakTipi: item.emlakTipi,
    emlakTipiAdi:
      EMLAK_TIPLERI[item.emlakTipi] ?? String(item.emlakTipi ?? "-"),
    kapasite: item.kapasite,
    yatakOdasiSayisi: item.yatakOdasiSayisi ?? item.yatakOdasıSayısı,
    banyoSayisi: item.banyoSayisi ?? item.banyoSayısı,
  };
}

// Backend'e gönderilecek query parametreleri
function buildQueryParams(query, page, pageSize) {
  const { search, filters } = query;

  return {
    page,
    pageSize,

    ...(search.trim() && {
      search: search.trim(),
    }),

    ...(filters.bolgeIds.length > 0 && {
      bolgeIds: filters.bolgeIds.map(Number),
    }),

    ...(filters.emlakTipi !== "" && {
      emlakTipi: Number(filters.emlakTipi),
    }),

    ...(filters.minKapasite !== "" && {
      minKapasite: Number(filters.minKapasite),
    }),

    ...(filters.ozellikIds.length > 0 && {
      ozellikIds: filters.ozellikIds.map(Number),
    }),
  };
}

export default function EmlaklarPage() {
  const router = useRouter();

  const [pageSize, setPageSize] = useState(10);

  // API'den gelen sayfalı emlak listesi
  const [emlaklar, setEmlaklar] = useState([]);

  // Filtre seçenekleri
  const [bolgeler, setBolgeler] = useState([]);
  const [features, setFeatures] = useState([]);

  // Kullanıcının düzenlediği arama/filtre alanları
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(createInitialFilters);

  // API'ye gerçekten uygulanmış arama/filtreler
  const [appliedQuery, setAppliedQuery] = useState({
    search: "",
    filters: createInitialFilters(),
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Liste durumları
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Silme modalı
  const [selectedEmlak, setSelectedEmlak] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Düzenleme sayfasına git
  const handleEdit = (emlak) => {
    router.push(`/emlaklar/${emlak.id}/duzenle`);
  };

  // Detay sayfasına git
  const handleDetail = (emlak) => {
    router.push(`/emlaklar/${emlak.id}`);
  };

  // Bölgeleri getir
  useEffect(() => {
    let active = true;

    const fetchBolgeler = async () => {
      try {
        const data = await getBolgeler();

        if (active) {
          setBolgeler(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Bölgeler alınamadı:", err);
      }
    };

    fetchBolgeler();

    return () => {
      active = false;
    };
  }, []);

  // Emlak özelliklerini getir
  useEffect(() => {
    let active = true;

    const fetchFeatures = async () => {
      try {
        const data = await getEmlakOzellikler();

        if (active) {
          setFeatures(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Emlak özellikleri alınamadı:", err);
      }
    };

    fetchFeatures();

    return () => {
      active = false;
    };
  }, []);

  // Emlak listesini backend pagination ile getir
  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const params = buildQueryParams(appliedQuery, page, pageSize);

        const data = await getPagedEmlaklar(params);

        if (!active) return;

        const items = Array.isArray(data.items) ? data.items : [];

        const count = Number(data.totalCount ?? 0);

        const maxPage = Math.max(1, Math.ceil(count / pageSize));

        // Silme veya veri değişikliği sonrası sayfa
        // artık geçerli değilse son sayfaya dön.
        if (page > maxPage) {
          setPage(maxPage);
          return;
        }

        setEmlaklar(items.map(normalizeEmlak));
        setTotalCount(count);
      } catch (err) {
        if (!active) return;

        console.error("Emlaklar yüklenemedi:", err);

        setError(
          err.response?.data?.message ||
            "Emlaklar yüklenirken bir hata oluştu.",
        );

        setEmlaklar([]);
        setTotalCount(0);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [appliedQuery, page, reloadKey, pageSize]);

  // Bölge seçenekleri
  const regions = useMemo(() => {
    return bolgeler.map((bolge) => ({
      id: bolge.id,
      name: bolge.ad,
      parentBolgeId: bolge.parentBolgeId,
    }));
  }, [bolgeler]);

  // Bölge ID -> Bölge adı
  const bolgeMap = useMemo(() => {
    return new Map(bolgeler.map((bolge) => [Number(bolge.id), bolge.ad]));
  }, [bolgeler]);

  // Emlak tipi seçenekleri
  const types = useMemo(() => {
    return Object.entries(EMLAK_TIPLERI).map(([value, label]) => ({
      value,
      label,
    }));
  }, []);

  // Tabloya gönderilecek liste
  const displayedEmlaklar = useMemo(() => {
    return emlaklar.map((emlak) => ({
      ...emlak,
      bolgeAdi: bolgeMap.get(Number(emlak.bolgeId)) || emlak.bolgeAdi || "-",
    }));
  }, [emlaklar, bolgeMap]);

  // Toplam sayfa
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Arama input'u değiştiğinde yalnızca state değişir
  const handleSearchChange = (value) => {
    setSearch(value);
  };

  // Filtre değiştiğinde yalnızca state değişir
  const handleFiltersChange = (updater) => {
    setFilters(updater);
  };

  // Kullanıcı Ara / Filtrele butonuna bastığında
  const handleSearch = () => {
    setPage(1);

    setAppliedQuery({
      search: search.trim(),
      filters: {
        ...filters,
        bolgeIds: [...filters.bolgeIds],
        ozellikIds: [...filters.ozellikIds],
      },
    });

    setReloadKey((prev) => prev + 1);
  };

  // Filtreleri temizle ve filtresiz listeyi getir
  const handleReset = () => {
    setSearch("");
    setFilters(createInitialFilters());

    setPage(1);

    setAppliedQuery({
      search: "",
      filters: createInitialFilters(),
    });

    setReloadKey((prev) => prev + 1);
  };

  // Aktif sorguyu yeniden yükle
  const handleRefresh = () => {
    setReloadKey((prev) => prev + 1);
  };

  // Sayfa değiştirme
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) {
      return;
    }

    setPage(newPage);
  };

  const handlePageSizeChange = (value) => {
    setPageSize(Number(value));
    setPage(1);
  };

  // Emlak sil
  const handleDelete = async () => {
    if (!selectedEmlak || deleting) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await deleteEmlak(selectedEmlak.id);

      setSelectedEmlak(null);

      // Aynı filtrelerle listeyi yeniden getir
      setReloadKey((prev) => prev + 1);
    } catch (err) {
      const message = err.response?.data?.message;

      setDeleteError(
        typeof message === "string"
          ? message
          : "Emlak silinirken bir hata oluştu.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            Emlak Listesi
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Portföyünüzdeki emlakları görüntüleyin ve yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            title="Listeyi yenile"
            aria-label="Listeyi yenile"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <Link
            href="/emlaklar/yeni"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Yeni Emlak Ekle
          </Link>
        </div>
      </div>

      {/* Content Card */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <House size={20} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">Tüm Emlaklar</h2>

              <p className="mt-1 text-xs text-slate-500">
                {loading ? "Yükleniyor..." : `${totalCount} kayıt bulundu`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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
                onChange={(e) => handlePageSizeChange(e.target.value)}
                disabled={loading}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {!loading && totalCount > 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                Sayfa {page} / {totalPages}
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <EmlakFilters
          search={search}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          regions={regions}
          types={types}
          features={features}
          onReset={handleReset}
        />

        {/* Search Button */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-b border-slate-100 px-5 pb-5 sm:px-6">
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Search size={17} />
            )}
            Ara / Filtrele
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mx-5 mt-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
          >
            <AlertCircle size={19} />
            {error}
          </div>
        )}

        {/* Loading / Table */}
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <Loader2 size={30} className="animate-spin text-blue-600" />

            <p className="text-sm text-slate-500">Emlaklar yükleniyor...</p>
          </div>
        ) : (
          <EmlakTable
            emlaklar={displayedEmlaklar}
            onDelete={(emlak) => {
              setDeleteError("");
              setSelectedEmlak(emlak);
            }}
            page={page}
            pageSize={pageSize}
            totalItems={totalCount}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onDetail={handleDetail}
          />
        )}
      </section>

      {/* Delete Modal */}
      <DeleteEmlakModal
        emlak={selectedEmlak}
        loading={deleting}
        onClose={() => {
          setSelectedEmlak(null);
          setDeleteError("");
        }}
        onConfirm={handleDelete}
      />

      {/* Delete Error */}
      {deleteError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
        >
          {deleteError}
        </div>
      )}
    </div>
  );
}
