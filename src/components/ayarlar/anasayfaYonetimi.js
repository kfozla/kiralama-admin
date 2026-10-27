"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  Layers,
  Search,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Save,
  House,
} from "lucide-react";

import {
  getAnasayfaBolumler,
  createAnasayfaBolum,
  updateAnasayfaBolum,
  deleteAnasayfaBolum,
  saveAnasayfaBolumEmlaklar,
  anasayfaApiError,
} from "@/app/services/anasayfaBolum.service";

import { searchEmlaklar } from "@/app/services/emlak.service";

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

const initialForm = {
  baslik: "",
  aciklama: "",
  slug: "",
  gosterimTipi: 0,
  secimTipi: 0,
  maksimumVillaSayisi: 10,
  sira: 0,
  aktif: true,
};

function extractList(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.items)) return value.data.items;
  return [];
}

function getEmlakName(item) {
  return (
    item?.["emlakAdı"] ?? item?.emlakAdi ?? item?.ad ?? `Villa #${item?.id}`
  );
}

function makeSlug(value) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AnasayfaYonetimi() {
  const [bolumler, setBolumler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedNames, setSelectedNames] = useState({});

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const loadBolumler = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAnasayfaBolumler();
      setBolumler(extractList(data));
    } catch (err) {
      setError(anasayfaApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBolumler();
  }, [loadBolumler]);

  // Arama sonuçları
  useEffect(() => {
    if (!editing || Number(form.secimTipi) !== 0) return;

    const text = query.trim();

    if (text.length < 2) {
      setSearchResults([]);
      setSearchError("");
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setSearching(true);
      setSearchError("");

      try {
        const result = await searchEmlaklar(text, controller.signal);

        if (!controller.signal.aborted) {
          setSearchResults(extractList(result));
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setSearchError(anasayfaApiError(err));
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, editing, form.secimTipi]);

  function updateForm(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openCreate() {
    setEditingId(null);
    setForm({
      ...initialForm,
      sira: bolumler.length,
    });

    setSelectedIds([]);
    setSelectedNames({});
    setQuery("");
    setSearchResults([]);
    setEditing(true);
    setError("");
  }

  function openEdit(bolum) {
    setEditingId(bolum.id);

    setForm({
      baslik: bolum.baslik ?? "",
      aciklama: bolum.aciklama ?? "",
      slug: bolum.slug ?? "",
      gosterimTipi: Number(bolum.gosterimTipi ?? 0),
      secimTipi: Number(bolum.secimTipi ?? 0),
      maksimumVillaSayisi: Number(bolum.maksimumVillaSayisi ?? 10),
      sira: Number(bolum.sira ?? 0),
      aktif: Boolean(bolum.aktif),
    });

    setSelectedIds((bolum.emlakIds ?? []).map(Number));

    setSelectedNames({});
    setQuery("");
    setSearchResults([]);
    setEditing(true);
    setError("");
  }

  function closeEditor() {
    if (saving) return;
    setEditing(false);
    setEditingId(null);
  }

  function addVilla(villa) {
    const id = Number(villa.id);

    if (!Number.isInteger(id) || id <= 0) return;
    if (selectedIds.includes(id)) return;

    if (selectedIds.length >= Number(form.maksimumVillaSayisi)) {
      setError(`En fazla ${form.maksimumVillaSayisi} villa seçebilirsiniz.`);
      return;
    }

    setSelectedIds((current) => [...current, id]);
    setSelectedNames((current) => ({
      ...current,
      [id]: getEmlakName(villa),
    }));

    setQuery("");
    setSearchResults([]);
    setError("");
  }

  function removeVilla(id) {
    setSelectedIds((current) => current.filter((value) => value !== id));
  }

  function moveVilla(index, direction) {
    const target = index + direction;

    if (target < 0 || target >= selectedIds.length) return;

    setSelectedIds((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave(event) {
    event.preventDefault();

    const payload = {
      ...form,
      baslik: form.baslik.trim(),
      aciklama: form.aciklama.trim() || null,
      slug: form.slug.trim(),
      gosterimTipi: Number(form.gosterimTipi),
      secimTipi: Number(form.secimTipi),
      maksimumVillaSayisi: Number(form.maksimumVillaSayisi),
      sira: Number(form.sira),
    };

    if (!payload.baslik || !payload.slug) {
      setError("Başlık ve slug zorunludur.");
      return;
    }

    if (
      payload.secimTipi === 0 &&
      selectedIds.length > payload.maksimumVillaSayisi
    ) {
      setError("Seçilen villa sayısı maksimum sınırı aşıyor.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let id = editingId;

      if (editingId) {
        await updateAnasayfaBolum(editingId, payload);
      } else {
        const created = await createAnasayfaBolum(payload);
        id = created.id;
      }

      // Manuel moddaki villaları sırayla kaydet.
      if (payload.secimTipi === 0) {
        await saveAnasayfaBolumEmlaklar(id, selectedIds);
      }

      setEditing(false);
      setEditingId(null);
      await loadBolumler();
    } catch (err) {
      setError(anasayfaApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(bolum) {
    const confirmed = window.confirm(
      `"${bolum.baslik}" bölümünü silmek istiyor musunuz?`,
    );

    if (!confirmed) return;

    setError("");

    try {
      await deleteAnasayfaBolum(bolum.id);
      await loadBolumler();
    } catch (err) {
      setError(anasayfaApiError(err));
    }
  }

  async function changeOrder(bolum, direction) {
    const ordered = [...bolumler].sort(
      (a, b) => a.sira - b.sira || a.id - b.id,
    );

    const index = ordered.findIndex((x) => x.id === bolum.id);
    const target = index + direction;

    if (target < 0 || target >= ordered.length) return;

    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];

    try {
      setSaving(true);
      setError("");

      // Mevcut backend'de toplu sıralama endpoint'i yok.
      // Sıralamayı mevcut PUT endpoint'iyle kaydediyoruz.
      for (let i = 0; i < next.length; i++) {
        const item = next[i];

        if (item.sira === i) continue;

        await updateAnasayfaBolum(item.id, {
          baslik: item.baslik,
          aciklama: item.aciklama,
          slug: item.slug,
          gosterimTipi: item.gosterimTipi,
          secimTipi: item.secimTipi,
          maksimumVillaSayisi: item.maksimumVillaSayisi,
          sira: i,
          aktif: item.aktif,
        });
      }

      await loadBolumler();
    } catch (err) {
      setError(anasayfaApiError(err));
      await loadBolumler();
    } finally {
      setSaving(false);
    }
  }

  const ordered = [...bolumler].sort((a, b) => a.sira - b.sira || a.id - b.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Layers size={21} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Anasayfa Yönetimi
            </h2>

            <p className="mt-1 max-w-lg text-sm text-slate-500">
              Anasayfada gösterilen villa sliderlarını, bölüm sıralamalarını ve
              seçilen villaları yönetin.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadBolumler}
            disabled={loading || saving}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Yenile
          </button>

          <button
            type="button"
            onClick={openCreate}
            disabled={saving}
            className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={17} />
            Yeni Bölüm
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
          <Loader2 size={21} className="animate-spin text-blue-600" />
          Bölümler yükleniyor...
        </div>
      ) : ordered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Layers size={35} className="mx-auto text-slate-300" />

          <h3 className="mt-4 font-semibold text-slate-800">
            Henüz anasayfa bölümü yok
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            İlk slider bölümünü oluşturabilirsiniz.
          </p>

          <button
            type="button"
            onClick={openCreate}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            İlk Bölümü Oluştur
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {ordered.map((bolum, index) => (
            <div
              key={bolum.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="text-slate-400">
                <GripVertical size={20} />
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-blue-600">
                <House size={21} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">{bolum.baslik}</p>

                <p className="mt-1 text-xs text-slate-500">
                  {Number(bolum.secimTipi) === 1
                    ? "Otomatik · Son Eklenenler"
                    : `Manuel · ${bolum.emlakIds?.length ?? 0} villa`}
                  {" · "}
                  {Number(bolum.gosterimTipi) === 0 ? "Slider" : "Grid"}
                  {" · "}Sıra {bolum.sira}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  bolum.aktif
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {bolum.aktif ? "Aktif" : "Pasif"}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Yukarı taşı"
                  disabled={index === 0 || saving}
                  onClick={() => changeOrder(bolum, -1)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronUp size={18} />
                </button>

                <button
                  type="button"
                  title="Aşağı taşı"
                  disabled={index === ordered.length - 1 || saving}
                  onClick={() => changeOrder(bolum, 1)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronDown size={18} />
                </button>

                <button
                  type="button"
                  title="Düzenle"
                  onClick={() => openEdit(bolum)}
                  disabled={saving}
                  className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                >
                  <Pencil size={18} />
                </button>

                <button
                  type="button"
                  title="Sil"
                  onClick={() => handleDelete(bolum)}
                  disabled={saving}
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BÖLÜM OLUŞTUR / DÜZENLE */}
      {editing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingId ? "Bölümü Düzenle" : "Yeni Bölüm"}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Anasayfa bölümü ayarları
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              id="anasayfa-bolum-form"
              onSubmit={handleSave}
              className="space-y-5 overflow-y-auto p-5"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Bölüm Başlığı *
                </label>

                <input
                  required
                  value={form.baslik}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateForm("baslik", value);

                    if (!editingId) {
                      updateForm("slug", makeSlug(value));
                    }
                  }}
                  className={inputClass}
                  placeholder="Örn. Sizin İçin Seçtiklerimiz"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Slug *
                </label>

                <input
                  required
                  value={form.slug}
                  onChange={(e) => updateForm("slug", makeSlug(e.target.value))}
                  className={inputClass}
                  placeholder="sizin-icin-sectiklerimiz"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Açıklama
                </label>

                <textarea
                  rows={3}
                  value={form.aciklama}
                  onChange={(e) => updateForm("aciklama", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
                  placeholder="Bölüm açıklaması..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Gösterim Tipi
                  </label>

                  <select
                    value={form.gosterimTipi}
                    onChange={(e) =>
                      updateForm("gosterimTipi", Number(e.target.value))
                    }
                    className={inputClass}
                  >
                    <option value={0}>Slider</option>
                    <option value={1}>Grid</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Villa Seçim Tipi
                  </label>

                  <select
                    value={form.secimTipi}
                    onChange={(e) =>
                      updateForm("secimTipi", Number(e.target.value))
                    }
                    className={inputClass}
                  >
                    <option value={0}>Manuel</option>
                    <option value={1}>Son Eklenenler (Otomatik)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Maksimum Villa Sayısı
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={form.maksimumVillaSayisi}
                    onChange={(e) =>
                      updateForm("maksimumVillaSayisi", Number(e.target.value))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Bölüm Sırası
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.sira}
                    onChange={(e) => updateForm("sira", Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={form.aktif}
                  onChange={(e) => updateForm("aktif", e.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />

                <span className="text-sm font-semibold text-slate-700">
                  Bölüm anasayfada aktif olsun
                </span>
              </label>

              {/* MANUEL VİLLA SEÇİMİ */}
              {Number(form.secimTipi) === 0 && (
                <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800">
                      Seçilen Villalar
                    </h4>

                    <span className="text-xs text-slate-500">
                      {selectedIds.length} / {form.maksimumVillaSayisi}
                    </span>
                  </div>

                  <div className="relative">
                    <Search
                      size={17}
                      className="absolute left-3 top-3.5 text-slate-400"
                    />

                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Villa adıyla ara..."
                      className={`${inputClass} pl-10`}
                    />
                  </div>

                  {searching && (
                    <p className="flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 size={14} className="animate-spin" />
                      Villalar aranıyor...
                    </p>
                  )}

                  {searchError && (
                    <p className="text-xs text-red-600">{searchError}</p>
                  )}

                  {query.trim().length >= 2 && !searching && (
                    <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                      {searchResults.length === 0 ? (
                        <p className="p-3 text-center text-xs text-slate-500">
                          Villa bulunamadı.
                        </p>
                      ) : (
                        searchResults.map((villa) => {
                          const selected = selectedIds.includes(
                            Number(villa.id),
                          );

                          return (
                            <button
                              key={villa.id}
                              type="button"
                              onClick={() => addVilla(villa)}
                              disabled={selected}
                              className="flex w-full items-center justify-between rounded-lg p-3 text-left text-sm hover:bg-blue-50 disabled:opacity-50"
                            >
                              <span>{getEmlakName(villa)}</span>

                              {selected ? (
                                <Check size={17} className="text-emerald-600" />
                              ) : (
                                <Plus size={17} />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    {selectedIds.map((id, index) => (
                      <div
                        key={id}
                        className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                      >
                        <span className="text-xs font-bold text-slate-400">
                          {index + 1}.
                        </span>

                        <House size={17} className="text-slate-400" />

                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
                          {selectedNames[id] ?? `Villa #${id}`}
                        </span>

                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveVilla(index, -1)}
                          className="p-1 text-slate-500 disabled:opacity-30"
                          title="Yukarı taşı"
                        >
                          <ChevronUp size={17} />
                        </button>

                        <button
                          type="button"
                          disabled={index === selectedIds.length - 1}
                          onClick={() => moveVilla(index, 1)}
                          className="p-1 text-slate-500 disabled:opacity-30"
                          title="Aşağı taşı"
                        >
                          <ChevronDown size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeVilla(id)}
                          className="p-1 text-red-500"
                          title="Villayı kaldır"
                        >
                          <X size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>

            <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600"
              >
                Vazgeç
              </button>

              <button
                type="submit"
                form="anasayfa-bolum-form"
                disabled={saving}
                className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}

                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
