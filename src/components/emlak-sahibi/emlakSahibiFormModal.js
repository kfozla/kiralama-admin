"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, UserRound, Save, Loader2, AlertCircle } from "lucide-react";

import { emlakSahibiSchema } from "@/schemas/emlakSahibi.schema";
import {
  createEmlakSahibi,
  updateEmlakSahibi,
} from "@/app/services/emlakSahibi.service";

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

const defaultValues = {
  ad: "",
  soyad: "",
  telefon: "",
  email: "",
  aciklama: "",
};

function FieldError({ error }) {
  return error ? (
    <p className="mt-1.5 text-xs text-red-500">{error.message}</p>
  ) : null;
}

export default function EmlakSahibiFormModal({
  open,
  owner,
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
    resolver: zodResolver(emlakSahibiSchema),
    defaultValues,
    mode: "onTouched",
  });

  useEffect(() => {
    if (!open) return;

    reset(
      owner
        ? {
            ad: owner.ad ?? "",
            soyad: owner.soyad ?? "",
            telefon: owner.telefon ?? "",
            email: owner.email ?? "",
            aciklama: owner.aciklama ?? "",
          }
        : defaultValues,
    );
    setApiError("");
  }, [open, owner, reset]);

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

    const payload = {
      ad: values.ad,
      soyad: values.soyad,
      telefon: values.telefon,
      email: values.email.trim() || null,
      aciklama: values.aciklama.trim() || null,
    };

    try {
      if (owner) {
        await updateEmlakSahibi(owner.id, payload);
      } else {
        await createEmlakSahibi(payload);
      }

      onSaved(owner ? "Emlak sahibi güncellendi." : "Emlak sahibi eklendi.");
    } catch (err) {
      const response = err.response?.data;
      const validationErrors = response?.errors;

      if (validationErrors && typeof validationErrors === "object") {
        setApiError(
          Object.entries(validationErrors)
            .flatMap(([key, values]) =>
              (Array.isArray(values) ? values : [values]).map(
                (value) => `${key}: ${value}`,
              ),
            )
            .join(" | "),
        );
      } else {
        setApiError(
          response?.message ||
            response?.title ||
            "İşlem sırasında bir hata oluştu.",
        );
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-form-title"
        className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserRound size={21} />
            </div>

            <div>
              <h2
                id="owner-form-title"
                className="text-lg font-bold text-slate-900"
              >
                {owner ? "Emlak Sahibi Düzenle" : "Yeni Emlak Sahibi"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                İletişim ve sahiplik bilgileri
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="max-h-[65vh] space-y-5 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ["ad", "Ad", "Ad giriniz"],
                ["soyad", "Soyad", "Soyad giriniz"],
              ].map(([name, label, placeholder]) => (
                <div key={name}>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {label} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register(name)}
                    placeholder={placeholder}
                    className={inputClass}
                  />
                  <FieldError error={errors[name]} />
                </div>
              ))}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Telefon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                autoComplete="tel"
                placeholder="05XX XXX XX XX"
                {...register("telefon")}
                className={inputClass}
              />
              <FieldError error={errors.telefon} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                E-posta
              </label>
              <input
                type="email"
                placeholder="ornek@eposta.com"
                {...register("email")}
                className={inputClass}
              />
              <FieldError error={errors.email} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Açıklama
              </label>
              <textarea
                rows={4}
                placeholder="Emlak sahibi hakkında notlar..."
                {...register("aciklama")}
                className="w-full rounded-xl border border-slate-200 p-3.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
              <FieldError error={errors.aciklama} />
            </div>

            {apiError && (
              <div
                role="alert"
                className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
              >
                <AlertCircle size={18} className="shrink-0" />
                <p>{apiError}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 p-5 sm:px-6">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
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
              {isSubmitting ? "Kaydediliyor..." : owner ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
