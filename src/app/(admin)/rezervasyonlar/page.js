"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import {
  Plus,
  RefreshCw,
  CalendarDays,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

import {
  changeRezervasyonStatus,
  deleteRezervasyon,
  getPagedRezervasyonlar,
  getRezervasyonStats,
} from "@/app/services/rezervasyon.service";

import RezervasyonStats from "@/components/rezervasyon/rezervasyonStats";

import { normalizeRezervasyon, getApiError } from "@/utils/rezervasyon";

import RezervasyonFilters from "@/components/rezervasyon/rezervasyonFilters";
import RezervasyonTable from "@/components/rezervasyon/rezervasyonTable";
import RezervasyonDetailDrawer from "@/components/rezervasyon/rezervasyonDetailDrawer";
import RezervasyonActionModal from "@/components/rezervasyon/rezervasyonActionModal";

const EMPTY_FILTERS = {
  search: "",
  durum: "",
  startDate: "",
  endDate: "",
};

export default function RezervasyonlarPage() {
  // Liste
  const [reservations, setReservations] = useState([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filtreler
  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    ...EMPTY_FILTERS,
  });

  const [filtersPending, setFiltersPending] = useState(false);

  // Sayfa durumları
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Detay
  const [selectedReservation, setSelectedReservation] = useState(null);

  // Rezervasyon işlemleri
  const [selectedAction, setSelectedAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  //stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  //stats useeffect
  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const loadStats = async () => {
      setStatsLoading(true);
      setStatsError("");

      try {
        const data = await getRezervasyonStats(controller.signal);

        if (!active) return;

        setStats(data);
      } catch (err) {
        if (
          !active ||
          controller.signal.aborted ||
          err?.code === "ERR_CANCELED"
        ) {
          return;
        }

        setStatsError(
          getApiError(err, "Rezervasyon istatistikleri yüklenemedi."),
        );
      } finally {
        if (active) {
          setStatsLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  // Filtreler değiştikten 350 ms sonra uygula.
  // Böylece arama yazarken her karakter için
  // yeni API isteği gönderilmez.
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedFilters({
        search: filters.search.trim(),
        durum: filters.durum,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      setFiltersPending(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [filters]);

  // Server-side rezervasyon listesi
  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const loadReservations = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {
          page,
          pageSize,
        };

        // Genel arama
        if (appliedFilters.search) {
          params.search = appliedFilters.search;
        }

        // Durum filtresi
        // 0 geçerli bir durum olduğu için truthy
        // kontrolü kullanmıyoruz.
        if (
          appliedFilters.durum !== "" &&
          appliedFilters.durum !== null &&
          appliedFilters.durum !== undefined
        ) {
          params.durum = Number(appliedFilters.durum);
        }

        // Giriş tarihi filtreleri
        if (appliedFilters.startDate) {
          params.girisBaslangic = appliedFilters.startDate;
        }

        if (appliedFilters.endDate) {
          params.girisBitis = appliedFilters.endDate;
        }

        const data = await getPagedRezervasyonlar(params, controller.signal);

        if (!active) return;

        const records = Array.isArray(data?.items) ? data.items : [];

        const countValue = Number(data?.totalCount ?? 0);

        const nextTotalCount = Number.isFinite(countValue)
          ? Math.max(0, countValue)
          : 0;

        const nextTotalPages = Math.max(
          1,
          Math.ceil(nextTotalCount / pageSize),
        );

        // Son sayfadaki son rezervasyon silinirse
        // bir önceki sayfaya geç.
        if (page > nextTotalPages) {
          setTotalCount(nextTotalCount);
          setPage(nextTotalPages);
          return;
        }

        const normalized = records.map((item) => {
          const base = normalizeRezervasyon(item);

          return {
            ...base,

            // Yeni DTO alanlarının korunması
            id: item.id,
            emlakId: item.emlakId,
            emlakAdi: item.emlakAdi,

            musteriAd: item.musteriAd,
            musteriSoyad: item.musteriSoyad,

            musteriAdSoyad:
              [item.musteriAd, item.musteriSoyad]
                .filter(Boolean)
                .join(" ")
                .trim() ||
              base.musteriAdSoyad ||
              "-",

            telefon: item.telefon,
            email: item.email,

            girisTarihi: item.girisTarihi,
            cikisTarihi: item.cikisTarihi,

            kisiSayisi: item.kisiSayisi,
            toplamFiyat: item.toplamFiyat,

            durum: Number(item.durum),

            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };
        });

        // Sıralama backend'de:
        // CreatedAt DESC, Id DESC
        setReservations(normalized);
        setTotalCount(nextTotalCount);
      } catch (err) {
        if (
          !active ||
          controller.signal.aborted ||
          err?.code === "ERR_CANCELED"
        ) {
          return;
        }

        setReservations([]);
        setTotalCount(0);

        setError(getApiError(err, "Rezervasyonlar yüklenemedi."));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadReservations();

    return () => {
      active = false;
      controller.abort();
    };
  }, [page, pageSize, appliedFilters, reloadKey]);

  // Filtreleri güncelle
  const updateFilters = useCallback((nextFilters) => {
    setFilters((prev) => {
      const updated =
        typeof nextFilters === "function" ? nextFilters(prev) : nextFilters;

      return {
        ...EMPTY_FILTERS,
        ...updated,
      };
    });

    setPage(1);
    setFiltersPending(true);
  }, []);

  const resetFilters = useCallback(() => {
    updateFilters({ ...EMPTY_FILTERS });
  }, [updateFilters]);

  // Listeyi yenile
  const refresh = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  // İşlem modalını aç
  function openReservationAction(type, reservation) {
    setActionError("");
    setSelectedAction({
      type,
      reservation,
    });
  }

  // Onayla / İptal / Sil
  async function confirmReservationAction() {
    if (!selectedAction || actionLoading) return;

    const { type, reservation } = selectedAction;

    setActionLoading(true);
    setActionError("");
    setActionNotice("");

    try {
      if (type === "approve") {
        await changeRezervasyonStatus(reservation.id, 1);
      } else if (type === "cancel") {
        await changeRezervasyonStatus(reservation.id, 2);
      } else if (type === "delete") {
        await deleteRezervasyon(reservation.id);
      } else {
        return;
      }

      const messages = {
        approve: "Rezervasyon onaylandı. Villa takvimi bloke edildi.",
        cancel: "Rezervasyon iptal edildi. Otomatik bloke kaldırıldı.",
        delete: "Rezervasyon silindi.",
      };

      setSelectedAction(null);
      setSelectedReservation(null);
      setActionNotice(messages[type] || "İşlem tamamlandı.");

      // Sadece mevcut sayfayı yeniden çek.
      refresh();
    } catch (err) {
      setActionError(
        err?.response?.data?.message ||
          err?.response?.data?.title ||
          err?.message ||
          "Rezervasyon işlemi gerçekleştirilemedi.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Sayfa başlığı */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            Rezervasyonlar
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Villa rezervasyonlarını, konaklama tarihlerini ve rezervasyon
            durumlarını takip edin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading || filtersPending}
            aria-label="Listeyi yenile"
            title="Listeyi yenile"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <Link
            href="/rezervasyonlar/yeni"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Yeni Rezervasyon
          </Link>
        </div>
      </div>

      {/* Rezervasyon İstatistikleri */}
      <div>
        {statsLoading && !stats ? (
          <div className="flex min-h-28 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <Loader2 size={24} className="animate-spin text-blue-600" />

            <span className="ml-3 text-sm text-slate-500">
              İstatistikler yükleniyor...
            </span>
          </div>
        ) : statsError && !stats ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle size={18} />
            {statsError}
          </div>
        ) : (
          <RezervasyonStats stats={stats} />
        )}
      </div>

      {/* Başarılı işlem bildirimi */}
      {actionNotice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={19} />
            <span>{actionNotice}</span>
          </div>

          <button
            type="button"
            onClick={() => setActionNotice("")}
            aria-label="Bildirimi kapat"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Rezervasyon listesi */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Liste başlığı */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CalendarDays size={20} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Tüm Rezervasyonlar
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {loading || filtersPending
                  ? "Yükleniyor..."
                  : `${totalCount} kayıt bulundu`}
              </p>
            </div>
          </div>

          {/* Sayfa boyutu */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="reservationPageSize"
              className="text-sm font-medium text-slate-500"
            >
              Göster:
            </label>

            <select
              id="reservationPageSize"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} kayıt
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mevcut filtre componenti */}
        <RezervasyonFilters
          filters={filters}
          onChange={updateFilters}
          onReset={resetFilters}
        />

        {/* Liste içeriği */}
        {loading || filtersPending ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
            <Loader2 size={30} className="animate-spin text-blue-600" />

            <p className="text-sm text-slate-500">
              Rezervasyonlar yükleniyor...
            </p>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="m-5 flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={19} />
              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={refresh}
              className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100"
            >
              Tekrar Dene
            </button>
          </div>
        ) : (
          <RezervasyonTable
            reservations={reservations}
            page={page}
            pageSize={pageSize}
            totalItems={totalCount}
            onPageChange={setPage}
            onDetail={setSelectedReservation}
            onAction={openReservationAction}
            actionLoading={actionLoading}
          />
        )}
      </section>

      {/* Sağ detay paneli */}
      <RezervasyonDetailDrawer
        reservation={selectedReservation}
        emlakName={selectedReservation?.emlakAdi ?? null}
        onClose={() => setSelectedReservation(null)}
      />

      {/* Rezervasyon işlem modalı */}
      <RezervasyonActionModal
        action={selectedAction}
        loading={actionLoading}
        error={actionError}
        onClose={() => {
          if (!actionLoading) {
            setSelectedAction(null);
            setActionError("");
          }
        }}
        onConfirm={confirmReservationAction}
      />
    </div>
  );
}
