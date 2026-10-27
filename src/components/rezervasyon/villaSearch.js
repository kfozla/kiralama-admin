"use client";

import { useEffect, useRef, useState } from "react";
import { Search, House, X, Loader2, Check } from "lucide-react";

import { searchEmlaklar } from "@/app/services/emlak.service";

export default function VillaSearch({ value, onChange }) {
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const [results, setResults] = useState([]);
  const [selectedVilla, setSelectedVilla] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const onOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", onOutsideClick);
    };
  }, [open]);

  useEffect(() => {
    if (value || !open || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await searchEmlaklar(query.trim(), controller.signal);

        if (controller.signal.aborted) return;

        setResults(Array.isArray(response) ? response : []);
      } catch (err) {
        if (controller.signal.aborted || err?.code === "ERR_CANCELED") {
          return;
        }

        setResults([]);
        setError("Villalar aranamadı.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, value, open]);

  const selectVilla = (villa) => {
    setSelectedVilla(villa);
    setQuery("");
    setResults([]);
    setOpen(false);

    onChange(String(villa.id));
  };

  const clearSelection = () => {
    setSelectedVilla(null);
    setQuery("");
    setResults([]);
    setOpen(true);

    onChange("");

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  return (
    <div ref={wrapperRef} className="relative w-full min-w-[220px] flex-1">
      {value ? (
        <div className="flex h-11 items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-3.5">
          <House size={18} className="shrink-0 text-blue-600" />

          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
            {selectedVilla?.emlakAdi || `Villa #${value}`}
          </span>

          <Check size={16} className="text-emerald-600" />

          <button
            type="button"
            onClick={clearSelection}
            aria-label="Villa filtresini temizle"
            className="rounded-md p-1 text-slate-500 hover:bg-white hover:text-red-600"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
          <Search size={18} className="shrink-0 text-slate-400" />

          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Tüm Villalar — villa ara..."
            autoComplete="off"
            aria-label="Villa ara"
            aria-expanded={open}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />

          {loading && (
            <Loader2 size={16} className="animate-spin text-blue-600" />
          )}

          {query && (
            <button
              type="button"
              aria-label="Aramayı temizle"
              onClick={() => {
                setQuery("");
                setResults([]);
                inputRef.current?.focus();
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {open && !value && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Villa Seç
          </div>

          <button
            type="button"
            onClick={() => {
              onChange("");
              setQuery("");
              setOpen(false);
            }}
            className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <House size={17} className="text-slate-400" />
            Tüm Villalar
          </button>

          {query.trim().length < 2 ? (
            <p className="border-t border-slate-100 px-4 py-4 text-center text-xs text-slate-500">
              Villa aramak için en az 2 karakter yaz.
            </p>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-5 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin text-blue-600" />
              Aranıyor...
            </div>
          ) : error ? (
            <p className="px-4 py-4 text-xs text-red-600">{error}</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-5 text-center text-xs text-slate-500">
              Villa bulunamadı.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto border-t border-slate-100 p-1.5">
              {results.map((villa) => (
                <button
                  key={villa.id}
                  type="button"
                  onClick={() => selectVilla(villa)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-blue-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <House size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {villa.emlakAdi}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Villa #{villa.id}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
