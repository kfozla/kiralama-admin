"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Trash2, Upload, Loader2, ImageIcon } from "lucide-react";

import {
  getIsletmeLogoBlob,
  uploadIsletmeLogo,
  deleteIsletmeLogo,
  isletmeApiError,
} from "@/app/services/isletmeAyarlari.service";

export default function LogoUpload({ settings, onUpdated }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl = null;

    async function loadLogo() {
      setPreview(null);

      if (!settings?.logoVar) return;

      setLoading(true);

      try {
        const blob = await getIsletmeLogoBlob();
        objectUrl = URL.createObjectURL(blob);

        if (active) {
          setPreview(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      } catch {
        if (active) setError("Logo önizlemesi yüklenemedi.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadLogo();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [settings?.logoVar, settings?.updatedAt]);

  function handleFileChange(event) {
    const selected = event.target.files?.[0];
    event.target.value = "";

    if (!selected) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(selected.type)) {
      setError("PNG, JPG veya WebP dosyası seçin.");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError("Logo en fazla 5 MB olabilir.");
      return;
    }

    setFile(selected);
    setError("");
    setSuccess("");
  }

  async function handleUpload() {
    if (!file || saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await uploadIsletmeLogo(file);
      setFile(null);
      onUpdated(result);
      setSuccess("Logo başarıyla yüklendi.");
    } catch (err) {
      setError(isletmeApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (saving || !settings?.logoVar) return;
    if (!window.confirm("İşletme logosu silinsin mi?")) return;

    setSaving(true);
    setError("");

    try {
      await deleteIsletmeLogo();
      setFile(null);
      setSuccess("Logo kaldırıldı.");
      onUpdated({ ...settings, logoVar: false });
    } catch (err) {
      setError(isletmeApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <ImageIcon size={21} />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">İşletme Logosu</h2>
          <p className="mt-1 text-xs text-slate-500">
            PNG, JPG veya WebP · Maksimum 5 MB
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex min-h-[190px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5">
          {loading ? (
            <Loader2 className="animate-spin text-blue-600" size={26} />
          ) : preview ? (
            <img
              src={preview}
              alt="İşletme logosu"
              className="max-h-[160px] max-w-full object-contain"
            />
          ) : (
            <div className="text-center text-slate-400">
              <ImagePlus size={32} className="mx-auto mb-2" />
              <p className="text-sm">Henüz logo yüklenmemiş.</p>
            </div>
          )}
        </div>

        <input
          id="isletme-logo-file"
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {file && (
          <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
            Seçilen dosya: <strong>{file.name}</strong>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"
          >
            {success}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <label
            htmlFor="isletme-logo-file"
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ImagePlus size={17} />
            Logo Seç
          </label>

          {file && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Upload size={17} />
              )}
              Yükle
            </button>
          )}

          {settings?.logoVar && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 size={17} />
              Kaldır
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
