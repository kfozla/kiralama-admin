"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  UploadCloud,
  Images,
  ImagePlus,
  Star,
  Trash2,
  GripVertical,
  ArrowLeft,
  ArrowRight,
  X,
  Check,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import {
  getEmlakFotograflar,
  uploadEmlakFotograflar,
  deleteEmlakFotograf,
  setEmlakKapakFotograf,
  reorderEmlakFotograflar,
} from "@/app/services/emlakFotograf.service";

const MAX_FILES = 99;
const MAX_SIZE = 10 * 1024 * 1024;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Backend dosya yolları: /uploads/emlaklar/12/abc.jpg
// NEXT_PUBLIC_API_URL örneğin:
// http://localhost:5007/api
function getPhotoUrl(path) {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) return path;

  try {
    const url = new URL(baseUrl);
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    return `${url.origin}${normalizedPath}`;
  } catch {
    return path;
  }
}

function moveItem(items, from, to) {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  ) {
    return items;
  }

  const result = [...items];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);

  return result;
}

export default function EmlakFotografGalerisi({ emlakId }) {
  const fileInputRef = useRef(null);
  const dragItemRef = useRef(null);

  const [photos, setPhotos] = useState([]);
  const [savedIds, setSavedIds] = useState([]);

  const [pendingFiles, setPendingFiles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [progress, setProgress] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [dragOverId, setDragOverId] = useState(null);

  const busy = loading || uploading || savingOrder || actionId !== null;

  const changedOrder = useMemo(() => {
    const current = photos.map((p) => p.id);

    return (
      current.length === savedIds.length &&
      current.some((id, index) => id !== savedIds[index])
    );
  }, [photos, savedIds]);

  const coverPhoto = useMemo(
    () => photos.find((photo) => photo.kapakMi),
    [photos],
  );

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getEmlakFotograflar(emlakId);

      const ordered = Array.isArray(result)
        ? [...result].sort((a, b) => a.sira - b.sira || a.id - b.id)
        : [];

      setPhotos(ordered);
      setSavedIds(ordered.map((photo) => photo.id));
    } catch (err) {
      console.error(err);
      setError("Fotoğraflar yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [emlakId]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const previewUrlsRef = useRef(new Set());

  useEffect(() => {
    const urls = previewUrlsRef.current;

    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
      urls.clear();
    };
  }, []);

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);

    if (incoming.length === 0) return;

    setError("");
    setSuccess("");

    if (incoming.length + pendingFiles.length > MAX_FILES) {
      setError(`Tek seferde en fazla ${MAX_FILES} fotoğraf seçebilirsin.`);
      return;
    }

    const invalid = incoming.find(
      (file) =>
        !ACCEPTED_TYPES.includes(file.type) ||
        file.size === 0 ||
        file.size > MAX_SIZE,
    );

    if (invalid) {
      setError(
        "Yalnızca JPEG, PNG ve WebP dosyaları yüklenebilir. Fotoğraf başına maksimum 10 MB.",
      );
      return;
    }

    const newItems = incoming.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);

      return {
        id: crypto.randomUUID(),
        file,
        previewUrl,
      };
    });

    setPendingFiles((prev) => [...prev, ...newItems]);
  };

  const removePending = (id) => {
    setPendingFiles((prev) => {
      const selected = prev.find((item) => item.id === id);

      if (selected) {
        URL.revokeObjectURL(selected.previewUrl);
        previewUrlsRef.current.delete(selected.previewUrl);
      }

      return prev.filter((item) => item.id !== id);
    });
  };

  const clearPending = () => {
    for (const item of pendingFiles) {
      URL.revokeObjectURL(item.previewUrl);
      previewUrlsRef.current.delete(item.previewUrl);
    }

    setPendingFiles([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0 || busy) return;

    setUploading(true);
    setProgress(0);
    setError("");
    setSuccess("");

    try {
      await uploadEmlakFotograflar(
        emlakId,
        pendingFiles.map((item) => item.file),
        (event) => {
          if (event.total) {
            setProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      );

      clearPending();

      setSuccess("Fotoğraflar başarıyla yüklendi.");

      await loadPhotos();
    } catch (err) {
      setError(err.response?.data?.message || "Fotoğraflar yüklenemedi.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleCover = async (photo) => {
    if (busy || photo.kapakMi || changedOrder) return;

    setActionId(photo.id);
    setError("");
    setSuccess("");

    try {
      await setEmlakKapakFotograf(emlakId, photo.id);

      setPhotos((prev) =>
        prev.map((item) => ({
          ...item,
          kapakMi: item.id === photo.id,
        })),
      );

      setSuccess("Kapak fotoğrafı güncellendi.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Kapak fotoğrafı değiştirilemedi.",
      );
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || busy || changedOrder) return;

    const targetId = deleteTarget.id;

    setActionId(targetId);
    setError("");
    setSuccess("");

    try {
      await deleteEmlakFotograf(emlakId, targetId);

      setDeleteTarget(null);

      setSuccess("Fotoğraf silindi.");

      await loadPhotos();
    } catch (err) {
      setError(err.response?.data?.message || "Fotoğraf silinemedi.");
    } finally {
      setActionId(null);
    }
  };

  const reorderLocal = (from, to) => {
    if (busy) return;

    setPhotos((prev) => moveItem(prev, from, to));
    setSuccess("");
  };

  const onDragStart = (event, index) => {
    if (busy) {
      event.preventDefault();
      return;
    }

    dragItemRef.current = index;

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  };

  const onDrop = (event, targetIndex) => {
    event.preventDefault();

    const sourceIndex = dragItemRef.current;

    if (sourceIndex !== null && !busy) {
      reorderLocal(sourceIndex, targetIndex);
    }

    dragItemRef.current = null;
    setDragOverId(null);
  };

  const saveOrder = async () => {
    if (!changedOrder || busy) return;

    setSavingOrder(true);
    setError("");
    setSuccess("");

    try {
      const ids = photos.map((photo) => photo.id);

      await reorderEmlakFotograflar(emlakId, ids);

      setSavedIds(ids);
      setSuccess("Fotoğraf sıralaması kaydedildi.");
    } catch (err) {
      setError(err.response?.data?.message || "Sıralama kaydedilemedi.");
    } finally {
      setSavingOrder(false);
    }
  };

  const cancelOrder = () => {
    const positions = new Map(savedIds.map((id, index) => [id, index]));

    setPhotos((prev) =>
      [...prev].sort(
        (a, b) => (positions.get(a.id) ?? 0) - (positions.get(b.id) ?? 0),
      ),
    );
  };

  return (
    <div className="space-y-6">
      {/* Mesajlar */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={18} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Hatayı kapat"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* Upload Section */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Fotoğraf Yükleme
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              JPEG, PNG veya WebP · Maksimum 10 MB / dosya
            </p>
          </div>

          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
            Tek seferde en fazla 99 fotoğraf
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />

          <div
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }}
            onDrop={(event) => {
              event.preventDefault();

              if (!busy) {
                addFiles(event.dataTransfer.files);
              }
            }}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-5 py-12 text-center transition hover:border-blue-300 hover:bg-blue-50/40"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <UploadCloud size={29} />
            </div>

            <p className="text-base font-bold text-slate-900">
              Fotoğrafları buraya sürükle
            </p>

            <p className="mt-2 text-sm text-slate-500">
              veya bilgisayarından birden fazla fotoğraf seç
            </p>

            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <ImagePlus size={18} />
              Fotoğraf Seç
            </button>
          </div>

          {/* Upload Previews */}
          {pendingFiles.length > 0 && (
            <div className="mt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-800">
                  Yüklenecek Fotoğraflar
                  <span className="ml-2 text-xs font-medium text-slate-400">
                    ({pendingFiles.length})
                  </span>
                </h3>

                <button
                  type="button"
                  onClick={clearPending}
                  disabled={uploading}
                  className="text-xs font-semibold text-slate-500 hover:text-red-600 disabled:opacity-50"
                >
                  Seçimi Temizle
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {pendingFiles.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                  >
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => removePending(item.id)}
                      aria-label="Seçimden kaldır"
                      className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white transition hover:bg-red-600 disabled:opacity-50"
                    >
                      <X size={15} />
                    </button>

                    <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1.5 text-[11px] text-white">
                      {item.file.name}
                    </div>
                  </div>
                ))}
              </div>

              {uploading && (
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs font-medium text-slate-600">
                    <span>Yükleniyor...</span>
                    <span>{progress}%</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleUpload}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <UploadCloud size={18} />
                  )}

                  {uploading
                    ? "Yükleniyor..."
                    : `${pendingFiles.length} Fotoğrafı Yükle`}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Gallery */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Fotoğraf Galerisi
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Fotoğrafları sıralayabilir ve kapak seçebilirsin.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {photos.length} fotoğraf
            </span>

            <button
              type="button"
              onClick={loadPhotos}
              disabled={busy || changedOrder}
              title="Galeriyi yenile"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {loading ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3">
              <Loader2 size={28} className="animate-spin text-blue-600" />
              <p className="text-sm text-slate-500">
                Fotoğraflar yükleniyor...
              </p>
            </div>
          ) : photos.length === 0 ? (
            <div className="flex min-h-60 flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Images size={30} />
              </div>

              <h3 className="text-sm font-bold text-slate-800">
                Henüz fotoğraf eklenmemiş
              </h3>

              <p className="mt-2 max-w-sm text-xs text-slate-500">
                Yukarıdaki yükleme alanından ilk fotoğrafları ekleyebilirsin.
              </p>
            </div>
          ) : (
            <>
              {changedOrder && (
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-800">
                    Fotoğraf sıralaması değiştirildi. Kaydetmeyi unutma.
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={cancelOrder}
                      className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                    >
                      Vazgeç
                    </button>

                    <button
                      type="button"
                      onClick={saveOrder}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {savingOrder && (
                        <Loader2 size={14} className="animate-spin" />
                      )}
                      Sıralamayı Kaydet
                    </button>
                  </div>
                </div>
              )}

              {coverPhoto && (
                <div className="mb-5 flex items-center gap-2 text-xs text-slate-500">
                  <Star size={15} className="fill-amber-400 text-amber-400" />
                  Kapak:
                  <span className="font-semibold text-slate-700">
                    #{coverPhoto.id}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    draggable={!busy}
                    onDragStart={(event) => onDragStart(event, index)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOverId(photo.id);
                    }}
                    onDragLeave={() => setDragOverId(null)}
                    onDrop={(event) => onDrop(event, index)}
                    onDragEnd={() => {
                      dragItemRef.current = null;
                      setDragOverId(null);
                    }}
                    className={`group overflow-hidden rounded-2xl border bg-white transition ${
                      dragOverId === photo.id
                        ? "border-blue-500 ring-2 ring-blue-100"
                        : photo.kapakMi
                          ? "border-amber-300"
                          : "border-slate-200"
                    }`}
                  >
                    <div className="relative aspect-[4/3] bg-slate-100">
                      <img
                        src={getPhotoUrl(photo.dosyaYolu)}
                        alt={`Emlak fotoğrafı ${index + 1}`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute left-2 top-2 flex items-center gap-2">
                        <span className="rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white">
                          #{index + 1}
                        </span>

                        {photo.kapakMi && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400 px-2 py-1 text-[11px] font-bold text-amber-950">
                            <Star size={12} fill="currentColor" />
                            Kapak
                          </span>
                        )}
                      </div>

                      <div className="absolute right-2 top-2 rounded-lg bg-black/50 p-1.5 text-white">
                        <GripVertical size={16} />
                      </div>
                    </div>

                    <div className="space-y-3 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-500">
                          Fotoğraf #{photo.id}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCover(photo)}
                          disabled={busy || changedOrder || photo.kapakMi}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
                            photo.kapakMi
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                          }`}
                        >
                          <Star size={13} />
                          {photo.kapakMi ? "Kapak" : "Kapak Yap"}
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={busy || index === 0}
                            onClick={() => reorderLocal(index, index - 1)}
                            title="Sola taşı"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                          >
                            <ArrowLeft size={15} />
                          </button>

                          <button
                            type="button"
                            disabled={busy || index === photos.length - 1}
                            onClick={() => reorderLocal(index, index + 1)}
                            title="Sağa taşı"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                          >
                            <ArrowRight size={15} />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={busy || changedOrder}
                          onClick={() => setDeleteTarget(photo)}
                          title="Fotoğrafı sil"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Fotoğrafı sil"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={23} />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Fotoğraf silinsin mi?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Bu fotoğraf kalıcı olarak silinecek. İşlem geri alınamaz.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={actionId !== null}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionId !== null && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Fotoğrafı Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
