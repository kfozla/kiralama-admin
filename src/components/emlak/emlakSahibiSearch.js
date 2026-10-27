"use client";

import { useEffect, useRef, useState } from "react";

import { useController } from "react-hook-form";

import {
  Search,
  UserRound,
  Check,
  ChevronDown,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

import {
  searchEmlakSahipleri,
  getEmlakSahibiById,
} from "@/app/services/emlakSahibi.service";

function extractList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getFullName(sahip) {
  return [sahip?.ad, sahip?.soyad].filter(Boolean).join(" ");
}

export default function EmlakSahibiSearch({
  control,
  name = "emlakSahibiId",
  error,
  disabled = false,
}) {
  const { field } = useController({
    name,
    control,
  });

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [results, setResults] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingSelected, setLoadingSelected] = useState(false);
  const [searchError, setSearchError] = useState("");

  const selectedId =
    field.value === "" || field.value === null || field.value === undefined
      ? null
      : Number(field.value);

  // Düzenleme sayfasında mevcut sahibin adını yükle.
  // ID'yi formdan okuduğumuz için reset() ile de çalışır.
  useEffect(() => {
    if (!selectedId || !Number.isFinite(selectedId)) {
      setSelectedOwner(null);
      return;
    }

    if (selectedOwner?.id === selectedId) return;

    let active = true;

    const loadSelected = async () => {
      setLoadingSelected(true);

      try {
        const data = await getEmlakSahibiById(selectedId);

        if (active) {
          setSelectedOwner({
            id: data.id,
            ad: data.ad,
            soyad: data.soyad,
          });
        }
      } catch (err) {
        if (active) {
          console.error("Emlak sahibi yüklenemedi:", err);
          setSelectedOwner(null);
        }
      } finally {
        if (active) setLoadingSelected(false);
      }
    };

    loadSelected();

    return () => {
      active = false;
    };
  }, [selectedId, selectedOwner?.id]);

  // Dropdown dışına tıklanırsa kapat.
  useEffect(() => {
    if (!open) return;

    const handleOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutside);

    return () => {
      document.removeEventListener("pointerdown", handleOutside);
    };
  }, [open]);

  // Debounced server-side arama.
  useEffect(() => {
    const term = search.trim();

    if (!open || selectedId || term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setSearchError("");

      try {
        const data = await searchEmlakSahipleri(term, 10, controller.signal);

        if (!controller.signal.aborted) {
          setResults(extractList(data));
        }
      } catch (err) {
        if (controller.signal.aborted || err.code === "ERR_CANCELED") {
          return;
        }

        setResults([]);
        setSearchError("Arama sırasında hata oluştu.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [search, open, selectedId]);

  const handleSelect = (owner) => {
    setSelectedOwner(owner);

    field.onChange(Number(owner.id));
    field.onBlur();

    setSearch("");
    setResults([]);
    setSearchError("");
    setOpen(false);
  };

  const handleClear = () => {
    field.onChange(null);
    field.onBlur();

    setSelectedOwner(null);
    setSearch("");
    setResults([]);
    setSearchError("");

    setOpen(true);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleOpen = () => {
    if (disabled) return;

    setOpen(true);

    // Mevcut seçim varken dropdown açılabilir,
    // ancak yeni arama için önce seçim temizlenir.
    if (selectedId) return;

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Seçili Emlak Sahibi */}
      {selectedId ? (
        <div
          className={`flex h-11 items-center gap-3 rounded-xl border bg-white px-3.5 ${
            error ? "border-red-300" : "border-slate-200"
          }`}
        >
          <UserRound size={18} className="shrink-0 text-blue-600" />

          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
            {loadingSelected
              ? "Emlak sahibi yükleniyor..."
              : selectedOwner
                ? getFullName(selectedOwner)
                : `Emlak sahibi #${selectedId}`}
          </span>

          <Check size={16} className="shrink-0 text-emerald-600" />

          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Emlak sahibini değiştir"
              title="Seçimi kaldır ve yeni kişi ara"
              className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-red-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <div
          className={`flex h-11 items-center gap-2 rounded-xl border bg-white px-3.5 transition focus-within:ring-4 ${
            error
              ? "border-red-300 focus-within:ring-red-50"
              : "border-slate-200 focus-within:border-blue-500 focus-within:ring-blue-50"
          }`}
        >
          <Search size={18} className="shrink-0 text-slate-400" />

          <input
            ref={inputRef}
            type="text"
            value={search}
            disabled={disabled}
            onFocus={handleOpen}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpen(true);
            }}
            onBlur={field.onBlur}
            autoComplete="off"
            placeholder="Ad veya soyad ile ara..."
            aria-label="Emlak sahibi ara"
            aria-expanded={open}
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />

          {loading && (
            <Loader2 size={16} className="animate-spin text-blue-600" />
          )}

          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setResults([]);
                inputRef.current?.focus();
              }}
              aria-label="Aramayı temizle"
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}

          <ChevronDown size={16} className="shrink-0 text-slate-400" />
        </div>
      )}

      {/* Dropdown */}
      {open && !selectedId && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Emlak Sahibi Ara
          </div>

          {search.trim().length < 2 ? (
            <p className="px-4 py-5 text-center text-xs text-slate-500">
              Aramak için en az 2 karakter yaz.
            </p>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-slate-500">
              <Loader2 size={17} className="animate-spin text-blue-600" />
              Aranıyor...
            </div>
          ) : searchError ? (
            <div className="flex items-center gap-2 px-4 py-4 text-xs text-red-600">
              <AlertCircle size={16} />
              {searchError}
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <UserRound size={26} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">
                Emlak sahibi bulunamadı
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Farklı bir isim deneyebilirsin.
              </p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto p-1.5">
              {results.map((owner) => (
                <button
                  key={owner.id}
                  type="button"
                  onClick={() => handleSelect(owner)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-blue-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <UserRound size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {getFullName(owner)}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Emlak sahibi #{owner.id}
                    </p>
                  </div>

                  <Check size={16} className="text-transparent" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-500">
          {error.message}
        </p>
      )}
    </div>
  );
}
