"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  ChevronRight,
  House,
  CalendarDays,
  Wallet,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import {
  getTakvimEmlak,
  getTakvimBlokeleri,
  getTakvimFiyatlari,
  createTakvimBloke,
  deleteTakvimBloke,
  createTakvimFiyat,
  updateTakvimFiyat,
  deleteTakvimFiyat,
  takvimApiError,
} from "@/app/services/emlakTakvim.service";

import {
  todayISO,
  normalizeCalendarEvents,
  normalizePriceRanges,
  isBlockSelectionAvailable,
} from "@/utils/emlakCalendar";

import EmlakCalendar from "@/components/emlak/takvim/emlakCalendar";
import CalendarActionModal from "@/components/emlak/takvim/calendarActionModal";
import CalendarEventModal from "@/components/emlak/takvim/calendarEventModal";
import DeleteBlockModal from "@/components/emlak/takvim/deleteBlockModal";

import EmlakFiyatTable from "@/components/emlak/takvim/fiyat/emlakFiyatTable";
import EmlakFiyatFormModal from "@/components/emlak/takvim/fiyat/emlakFiyatFormModal";
import DeleteFiyatModal from "@/components/emlak/takvim/fiyat/deleteFiyatModal";

function getEmlakName(emlak) {
  return (
    emlak?.["emlakAdı"] ??
    emlak?.["EmlakAdı"] ??
    emlak?.emlakAdi ??
    "Emlak Takvimi"
  );
}

export default function EmlakTakvimPage() {
  const { id } = useParams();

  const [initialYear, initialMonth] = useState(() =>
    todayISO().split("-").map(Number),
  )[0];

  // SEKME VE TAKVİM
  const [activeTab, setActiveTab] = useState("calendar");
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  // API VERİLERİ
  const [emlak, setEmlak] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [prices, setPrices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // GENEL İŞLEM DURUMLARI
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");

  // BLOKE MODALLARI
  const [selection, setSelection] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [blockToDelete, setBlockToDelete] = useState(null);
  const [blockError, setBlockError] = useState("");
  const [eventError, setEventError] = useState("");

  // FİYAT MODALLARI
  const [priceFormOpen, setPriceFormOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceToDelete, setPriceToDelete] = useState(null);
  const [priceFormError, setPriceFormError] = useState("");
  const [priceDeleteError, setPriceDeleteError] = useState("");

  const refresh = useCallback(() => {
    setRefreshKey((previous) => previous + 1);
  }, []);

  // TAKVİM VERİLERİNİ YÜKLE
  useEffect(() => {
    if (!id) return;

    let active = true;

    async function loadData() {
      setLoading(true);
      setLoadError("");

      const results = await Promise.allSettled([
        getTakvimEmlak(id),
        getTakvimBlokeleri(id),
        getTakvimFiyatlari(id),
      ]);

      if (!active) return;

      const [emlakResult, blockResult, priceResult] = results;

      setEmlak(emlakResult.status === "fulfilled" ? emlakResult.value : null);

      setBlocks(blockResult.status === "fulfilled" ? blockResult.value : []);

      setPrices(priceResult.status === "fulfilled" ? priceResult.value : []);

      const names = ["Emlak", "Bloke", "Fiyat"];

      const errors = results
        .map((result, index) => {
          if (result.status === "fulfilled") {
            return null;
          }

          return `${names[index]}: ` + takvimApiError(result.reason);
        })
        .filter(Boolean);

      if (errors.length > 0) {
        setLoadError(errors.join(" | "));
      }

      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, [id, refreshKey]);

  // ARTIK SADECE BLOKE KAYITLARI
  const events = useMemo(() => normalizeCalendarEvents(blocks), [blocks]);

  const priceRanges = useMemo(() => normalizePriceRanges(prices), [prices]);

  const priceConflicts = useMemo(() => {
    for (let i = 0; i < priceRanges.length; i++) {
      for (let j = i + 1; j < priceRanges.length; j++) {
        const a = priceRanges[i];
        const b = priceRanges[j];

        if (a.start < b.end && b.start < a.end) {
          return true;
        }
      }
    }

    return false;
  }, [priceRanges]);

  const busy = loading || saving || deleting;
  const canSelect = !busy && !loadError;

  const changeTab = (tab) => {
    setActiveTab(tab);
    setNotice("");
    setSelection(null);
    setSelectedEvent(null);
  };

  const handleMonthChange = (newYear, newMonth) => {
    setYear(newYear);
    setMonth(newMonth);
    setSelection(null);
    setSelectedEvent(null);
  };

  // MANUEL BLOKE SEÇİMİ
  const handleRangeSelect = (range) => {
    if (!canSelect || !range) return;

    setNotice("");
    setBlockError("");

    if (!isBlockSelectionAvailable(range, events)) {
      setNotice(
        "Seçilen tarih aralığında bloke bulunuyor. " +
          "Yalnızca müsait geceleri seçebilirsiniz.",
      );
      return;
    }

    setSelection(range);
  };

  // MANUEL BLOKE OLUŞTUR
  const handleCreateBlock = async (values) => {
    if (!selection || busy || loadError) return;

    setSaving(true);
    setBlockError("");

    try {
      await createTakvimBloke(id, {
        baslangicTarihi: selection.start,
        bitisTarihi: selection.end,
        aciklama: values.aciklama ?? "",
      });

      setSelection(null);
      setNotice("Bloke kaydı başarıyla oluşturuldu.");
      refresh();
    } catch (error) {
      setBlockError(takvimApiError(error));
    } finally {
      setSaving(false);
    }
  };

  // MANUEL BLOKEYİ SİL
  const handleDeleteBlock = async () => {
    if (
      !blockToDelete ||
      blockToDelete.isReservationBlock ||
      busy ||
      loadError
    ) {
      return;
    }

    setDeleting(true);
    setBlockError("");

    try {
      await deleteTakvimBloke(blockToDelete.id);

      setBlockToDelete(null);
      setSelectedEvent(null);
      setNotice("Bloke kaydı başarıyla kaldırıldı.");
      refresh();
    } catch (error) {
      setBlockError(takvimApiError(error));
    } finally {
      setDeleting(false);
    }
  };

  // FİYAT MODALLARI
  const openCreatePrice = () => {
    setEditingPrice(null);
    setPriceFormError("");
    setPriceFormOpen(true);
  };

  const openEditPrice = (item) => {
    setEditingPrice(item);
    setPriceFormError("");
    setPriceFormOpen(true);
  };

  // FİYAT EKLE / GÜNCELLE
  const handleSavePrice = async (payload) => {
    if (busy || loadError) return;

    setSaving(true);
    setPriceFormError("");

    try {
      const isEditing = Boolean(editingPrice);

      if (isEditing) {
        await updateTakvimFiyat(editingPrice.id, {
          ...payload,
          emlakId: Number(id),
        });
      } else {
        await createTakvimFiyat(id, payload);
      }

      setPriceFormOpen(false);
      setEditingPrice(null);

      setNotice(
        isEditing
          ? "Fiyat dönemi başarıyla güncellendi."
          : "Yeni fiyat dönemi oluşturuldu.",
      );

      refresh();
    } catch (error) {
      setPriceFormError(takvimApiError(error));
    } finally {
      setSaving(false);
    }
  };

  // FİYAT SİL
  const handleDeletePrice = async () => {
    if (!priceToDelete || busy || loadError) return;

    setDeleting(true);
    setPriceDeleteError("");

    try {
      await deleteTakvimFiyat(priceToDelete.id);

      setPriceToDelete(null);
      setNotice("Fiyat dönemi silindi.");

      refresh();
    } catch (error) {
      setPriceDeleteError(takvimApiError(error));
    } finally {
      setDeleting(false);
    }
  };

  // REZERVASYON BLOKELERİ İÇİN SİLME AÇILMASIN
  const openBlockDelete = (block) => {
    if (block.isReservationBlock) return;

    setSelectedEvent(null);
    setBlockError("");
    setBlockToDelete(block);
  };

  return (
    <div className="space-y-6">
      {/* BREADCRUMB */}
      <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/emlaklar" className="hover:text-blue-600">
          Emlaklar
        </Link>

        <ChevronRight size={15} />

        <Link href={`/emlaklar/${id}`} className="hover:text-blue-600">
          {getEmlakName(emlak)}
        </Link>

        <ChevronRight size={15} />

        <span className="font-semibold text-slate-800">
          Takvim ve Fiyat Yönetimi
        </span>
      </nav>

      {/* SAYFA BAŞLIĞI */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <House size={23} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {getEmlakName(emlak)}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Müsaitlik, bloke ve gecelik fiyat yönetimi
            </p>

            <span className="mt-2 inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              Emlak #{id}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={refresh}
            title="Verileri yenile"
            aria-label="Verileri yenile"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <Link
            href="/emlaklar"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Listeye Dön
          </Link>
        </div>
      </div>

      {/* SEKMELER */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => changeTab("calendar")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "calendar"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          }`}
        >
          <CalendarDays size={18} />
          Takvim
        </button>

        <button
          type="button"
          onClick={() => changeTab("prices")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "prices"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          }`}
        >
          <Wallet size={18} />
          Fiyat Yönetimi
        </button>
      </div>

      {/* BİLGİ MESAJI */}
      {notice && !loading && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800"
        >
          <div className="flex items-start gap-2">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{notice}</span>
          </div>

          <button
            type="button"
            onClick={() => setNotice("")}
            className="text-xs font-bold underline"
          >
            Kapat
          </button>
        </div>
      )}

      {loadError && !loading && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <div className="flex items-start gap-2">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{loadError}</span>
          </div>

          <button
            type="button"
            onClick={refresh}
            className="font-semibold underline"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {priceConflicts && !loading && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          Bu emlakta çakışan fiyat dönemleri var. İlgili günlerin fiyatı
          takvimde "Çakışma" olarak gösterilir. Fiyat Yönetimi sekmesinden
          kayıtları düzeltebilirsiniz.
        </div>
      )}

      {/* İÇERİK */}
      {loading ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white">
          <Loader2 size={32} className="animate-spin text-blue-600" />

          <p className="text-sm text-slate-500">
            Takvim bilgileri yükleniyor...
          </p>
        </div>
      ) : activeTab === "calendar" ? (
        <div className="space-y-4">
          <EmlakCalendar
            year={year}
            month={month}
            events={events}
            priceRanges={priceRanges}
            canSelect={canSelect}
            deleting={deleting}
            onMonthChange={handleMonthChange}
            onRangeSelect={handleRangeSelect}
            onEventClick={(event) => {
              setEventError("");
              setSelectedEvent(event);
            }}
            onBlockDelete={openBlockDelete}
          />

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-sm leading-6 text-slate-600">
              Yeşil günler müsait, kırmızı günler blokelidir. Rezervasyon
              onaylandığında backend otomatik bloke oluşturur. Manuel blokeler
              takvimden kaldırılabilir; rezervasyona bağlı blokeler ise yalnızca
              rezervasyon işlemleriyle yönetilir. Gecelik fiyatları değiştirmek
              için{" "}
              <button
                type="button"
                onClick={() => changeTab("prices")}
                className="font-semibold text-blue-600 hover:underline"
              >
                Fiyat Yönetimi
              </button>{" "}
              sekmesini kullanın.
            </p>
          </div>
        </div>
      ) : (
        <EmlakFiyatTable
          prices={prices}
          disabled={busy || Boolean(loadError)}
          onAdd={openCreatePrice}
          onEdit={openEditPrice}
          onDelete={(item) => {
            setPriceDeleteError("");
            setPriceToDelete(item);
          }}
        />
      )}

      {/* MANUEL BLOKE OLUŞTUR */}
      <CalendarActionModal
        selection={selection}
        mode="block"
        saving={saving}
        error={blockError}
        onSave={handleCreateBlock}
        onClose={() => {
          if (!saving) {
            setSelection(null);
            setBlockError("");
          }
        }}
      />

      {/* BLOKE DETAYI */}
      <CalendarEventModal
        event={selectedEvent}
        deleting={deleting}
        error={eventError}
        onClose={() => {
          if (!deleting) {
            setSelectedEvent(null);
            setEventError("");
          }
        }}
        onDelete={(event) => {
          if (event.type === "block" && !event.isReservationBlock) {
            openBlockDelete(event);
          }
        }}
      />

      {/* MANUEL BLOKE SİL */}
      <DeleteBlockModal
        block={blockToDelete}
        deleting={deleting}
        error={blockError}
        onConfirm={handleDeleteBlock}
        onClose={() => {
          if (!deleting) {
            setBlockToDelete(null);
            setBlockError("");
          }
        }}
      />

      {/* FİYAT EKLE / GÜNCELLE */}
      <EmlakFiyatFormModal
        open={priceFormOpen}
        initialData={editingPrice}
        prices={prices}
        saving={saving}
        error={priceFormError}
        onSave={handleSavePrice}
        onClose={() => {
          if (!saving) {
            setPriceFormOpen(false);
            setEditingPrice(null);
            setPriceFormError("");
          }
        }}
      />

      {/* FİYAT SİL */}
      <DeleteFiyatModal
        price={priceToDelete}
        deleting={deleting}
        error={priceDeleteError}
        onConfirm={handleDeletePrice}
        onClose={() => {
          if (!deleting) {
            setPriceToDelete(null);
            setPriceDeleteError("");
          }
        }}
      />
    </div>
  );
}
