"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { X, MapPin, Save, Loader2, AlertCircle } from "lucide-react";

import { bolgeSchema } from "@/schemas/bolge.schema";
import {
  buildBolgeTree,
  flattenBolgeTree,
  getDescendantIds,
} from "@/utils/bolgeTree";

import { createBolge, updateBolge } from "@/app/services/bolge.service";

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

const defaultValues = {
  ad: "",
  parentBolgeId: null,
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

export default function BolgeFormModal({
  open,
  bolge,
  parentId = null,
  bolgeler,
  onClose,
  onSaved,
}) {
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(bolgeSchema),
    defaultValues,
    mode: "onTouched",
  });

  const unavailableIds = useMemo(() => {
    if (!bolge) return new Set();

    const descendants = getDescendantIds(bolgeler, bolge.id);
    descendants.add(Number(bolge.id));

    return descendants;
  }, [bolge, bolgeler]);

  const parentOptions = useMemo(() => {
    const tree = buildBolgeTree(bolgeler);

    return flattenBolgeTree(tree).filter(
      (item) => !unavailableIds.has(Number(item.id)),
    );
  }, [bolgeler, unavailableIds]);

  useEffect(() => {
    if (!open) return;

    reset(
      bolge
        ? {
            ad: bolge.ad ?? "",
            parentBolgeId: bolge.parentBolgeId ?? null,
          }
        : {
            ad: "",
            parentBolgeId: parentId ?? null,
          },
    );

    setApiError("");
  }, [open, bolge, parentId, reset]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  const onSubmit = async (values) => {
    setApiError("");

    if (
      bolge &&
      values.parentBolgeId !== null &&
      unavailableIds.has(Number(values.parentBolgeId))
    ) {
      setError("parentBolgeId", {
        message: "Bölgenin kendisi veya alt bölgeleri üst bölge seçilemez.",
      });
      return;
    }

    const payload = {
      ad: values.ad.trim(),
      parentBolgeId: values.parentBolgeId,
    };

    try {
      if (bolge) {
        await updateBolge(bolge.id, payload);
        onSaved("Bölge başarıyla güncellendi.");
      } else {
        await createBolge(payload);
        onSaved("Yeni bölge başarıyla eklendi.");
      }
    } catch (error) {
      setApiError(getErrorMessage(error));
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
        aria-labelledby="bolge-form-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <MapPin size={21} />
            </div>

            <div>
              <h2
                id="bolge-form-title"
                className="text-lg font-bold text-slate-900"
              >
                {bolge ? "Bölge Düzenle" : "Yeni Bölge Ekle"}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Bölge adı ve üst bölge bilgileri
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-5 p-6">
            <div>
              <label
                htmlFor="bolge-ad"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Bölge Adı <span className="text-red-500">*</span>
              </label>

              <input
                id="bolge-ad"
                type="text"
                placeholder="Örn. Kalkan"
                autoFocus
                {...register("ad")}
                className={inputClass}
              />

              {errors.ad && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.ad.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="bolge-parent"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Üst Bölge
              </label>

              <select
                id="bolge-parent"
                {...register("parentBolgeId", {
                  setValueAs: (value) => (value === "" ? null : Number(value)),
                })}
                className={inputClass}
              >
                <option value="">Üst bölge yok (Ana Bölge)</option>

                {parentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {"— ".repeat(option.depth)}
                    {option.ad}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Boş bırakırsan ana bölge olarak oluşturulur.
              </p>

              {errors.parentBolgeId && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.parentBolgeId.message}
                </p>
              )}
            </div>

            <div className="rounded-xl bg-blue-50 p-4 text-xs leading-5 text-blue-700">
              Örnek: Antalya ana bölge, Kaş Antalya'nın alt bölgesi, Kalkan ise
              Kaş'ın alt bölgesi olabilir.
            </div>

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

              {isSubmitting ? "Kaydediliyor..." : bolge ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
