"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  X,
  ListChecks,
  Save,
  Loader2,
  AlertCircle,
  Upload,
  Trash2,
  ImageIcon,
} from "lucide-react";

import { emlakOzellikSchema } from "@/schemas/emlakOzellik.shcema";
import { OZELLIK_KATEGORILERI } from "@/constants/emlakOzellik";

import {
  createEmlakOzellik,
  updateEmlakOzellik,
  uploadEmlakOzellikLogo,
  deleteEmlakOzellikLogo,
} from "@/app/services/emlakOzellik.service";

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

const defaultValues = {
  ozellikAdi: "",
  kategori: undefined,
};

function getErrorMessage(error) {
  const data = error.response?.data;

  if (typeof data === "string") return data;

  if (data?.errors) {
    return Object.entries(data.errors)
      .flatMap(([field, messages]) =>
        (Array.isArray(messages) ? messages : [messages]).map(
          (message) => `${field}: ${message}`,
        ),
      )
      .join(" | ");
  }

  return data?.message || data?.title || "İşlem sırasında bir hata oluştu.";
}

export default function EmlakOzellikFormModal({
  open,
  feature,
  onClose,
  onSaved,
}) {
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(emlakOzellikSchema),
    defaultValues,
    mode: "onTouched",
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [removingLogo, setRemovingLogo] = useState(false);

  const busy = isSubmitting || removingLogo;

  function getLogoUrl(path) {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return path;

    return `${new URL(apiUrl).origin}/${path.replace(/^\/+/, "")}`;
  }

  function handleLogoChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setApiError("Yalnızca PNG, JPG ve WebP yükleyebilirsiniz.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setApiError("Logo en fazla 5 MB olabilir.");
      event.target.value = "";
      return;
    }

    setApiError("");
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  useEffect(() => {
    if (!open) return;

    reset(
      feature
        ? {
            ozellikAdi: feature.ozellikAdi ?? "",
            kategori: Number(feature.kategori),
          }
        : defaultValues,
    );
    setLogoFile(null);
    setLogoPreview(null);
    setApiError("");
  }, [open, feature, reset]);
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  const onSubmit = async (values) => {
    setApiError("");

    const payload = {
      ozellikAdi: values.ozellikAdi.trim(),
      kategori: values.kategori,
    };

    let savedId = feature?.id;
    let recordSaved = false;

    try {
      if (feature) {
        await updateEmlakOzellik(feature.id, payload);
      } else {
        const created = await createEmlakOzellik(payload);

        savedId = created?.id ?? created?.data?.id;

        if (!savedId && logoFile) {
          throw new Error(
            "Özellik oluşturuldu ancak logo yüklemek için özellik ID'si alınamadı.",
          );
        }
      }

      recordSaved = true;

      if (logoFile) {
        await uploadEmlakOzellikLogo(savedId, logoFile);
      }

      onSaved(
        feature
          ? "Emlak özelliği güncellendi."
          : "Yeni emlak özelliği eklendi.",
      );
    } catch (error) {
      const message =
        error instanceof Error && !error.response
          ? error.message
          : getErrorMessage(error);

      setApiError(
        recordSaved
          ? `Özellik kaydedildi ancak logo yüklenemedi: ${message}`
          : message,
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-form-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ListChecks size={21} />
            </div>

            <div>
              <h2
                id="feature-form-title"
                className="text-lg font-bold text-slate-900"
              >
                {feature ? "Emlak Özelliği Düzenle" : "Yeni Emlak Özelliği"}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Özellik adı ve kategori bilgileri
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Kapat"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-5 p-6">
            <div>
              <label
                htmlFor="ozellikAdi"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Özellik Adı
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                id="ozellikAdi"
                type="text"
                placeholder="Örn. Deniz Manzaralı"
                autoFocus
                {...register("ozellikAdi")}
                aria-invalid={!!errors.ozellikAdi}
                className={inputClass}
              />

              {errors.ozellikAdi && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.ozellikAdi.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="kategori"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Kategori
                <span className="ml-1 text-red-500">*</span>
              </label>

              <select
                id="kategori"
                {...register("kategori", {
                  valueAsNumber: true,
                })}
                aria-invalid={!!errors.kategori}
                className={inputClass}
              >
                <option value="">Kategori seçiniz</option>

                {OZELLIK_KATEGORILERI.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              {errors.kategori && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.kategori.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Özellik Logosu
              </label>

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {logoPreview || feature?.logoUrl ? (
                      <img
                        src={logoPreview || getLogoUrl(feature.logoUrl)}
                        alt="Özellik logosu"
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <ImageIcon size={28} className="text-slate-300" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-xs text-slate-500">
                      PNG, JPG veya WebP · Maksimum 5 MB
                    </p>

                    <label
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 ${
                        busy ? "pointer-events-none opacity-50" : ""
                      }`}
                    >
                      <Upload size={15} />
                      {feature?.logoUrl || logoFile
                        ? "Logo Değiştir"
                        : "Logo Seç"}

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        disabled={busy}
                        onChange={handleLogoChange}
                      />
                    </label>

                    {logoFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview(null);
                        }}
                        disabled={busy}
                        className="ml-2 text-xs text-slate-500 hover:text-red-600"
                      >
                        Seçimi temizle
                      </button>
                    )}
                  </div>
                </div>

                {feature?.logoUrl && !logoFile && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      if (!window.confirm("Mevcut logo kaldırılsın mı?"))
                        return;

                      setRemovingLogo(true);
                      setApiError("");

                      try {
                        await deleteEmlakOzellikLogo(feature.id);
                        onSaved("Özellik logosu kaldırıldı.");
                      } catch (error) {
                        setApiError(getErrorMessage(error));
                      } finally {
                        setRemovingLogo(false);
                      }
                    }}
                    className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {removingLogo ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                    Mevcut Logoyu Kaldır
                  </button>
                )}
              </div>
            </div>

            <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">
              Bu özellik, emlak ekleme ve düzenleme formlarında seçilebilir
              olacak.
            </p>

            {apiError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
              >
                <AlertCircle size={18} className="shrink-0" />
                <p>{apiError}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 p-5 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Vazgeç
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}

              {isSubmitting
                ? "Kaydediliyor..."
                : feature
                  ? "Güncelle"
                  : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
