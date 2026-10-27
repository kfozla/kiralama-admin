"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { FormProvider, useForm, useWatch, Controller } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import RichTextEditor from "@/components/ayarlar/richTextEditor";

import BolgeSearch from "@/components/bolge/bolgeSearch";

import {
  House,
  UsersRound,
  FileText,
  Clock3,
  ListChecks,
  Waves,
  MapPin,
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";

import FormSection from "./formSection";

import EmlakOzellikSecimi from "./emlakOzellikSecimi";

import HavuzBilgileri from "./havuzBilgileri";

import { emlakSchema } from "@/schemas/emlak.schema";

import { EMLAK_TIPLERI } from "@/constants/emlak";

import { getBolgeler } from "@/app/services/bolge.service";

import { getEmlakOzellikler } from "@/app/services/emlakOzellik.service";

import EmlakSahibiSearch from "../emlakSahibiSearch";

import {
  getEmlakById,
  createEmlak,
  updateEmlak,
} from "@/app/services/emlak.service";

import {
  EMLAK_DEFAULT_VALUES,
  emlakToFormValues,
  buildEmlakPayload,
} from "@/utils/emlakFormMapper";

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

function FieldError({ error }) {
  if (!error) return null;

  return <p className="mt-1.5 text-xs text-red-500">{error.message}</p>;
}

function extractList(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.items)) return data.items;

  if (Array.isArray(data?.data)) return data.data;

  return [];
}

export default function emlakForm({ emlakId = null }) {
  const router = useRouter();

  const isEditMode = emlakId !== null && emlakId !== undefined;

  const [emlakLoading, setEmlakLoading] = useState(isEditMode);

  const [emlakError, setEmlakError] = useState("");

  const [submitError, setSubmitError] = useState("");

  const [bolgeler, setBolgeler] = useState([]);

  const [features, setFeatures] = useState([]);

  const [optionsLoading, setOptionsLoading] = useState(true);

  const [optionsError, setOptionsError] = useState("");

  const methods = useForm({
    resolver: zodResolver(emlakSchema),

    defaultValues: EMLAK_DEFAULT_VALUES,

    mode: "onTouched",
  });

  const { reset } = methods;

  useEffect(() => {
    if (!isEditMode) return;

    let active = true;

    const loadEmlak = async () => {
      setEmlakLoading(true);

      setEmlakError("");

      try {
        const data = await getEmlakById(emlakId);

        if (!active) return;

        const formValues = emlakToFormValues(data);

        reset(formValues);
      } catch (error) {
        if (!active) return;

        console.error("Emlak yüklenemedi:", error);

        setEmlakError(
          error.response?.data?.message || "Emlak bilgileri yüklenemedi.",
        );
      } finally {
        if (active) {
          setEmlakLoading(false);
        }
      }
    };

    loadEmlak();

    return () => {
      active = false;
    };
  }, [emlakId, isEditMode, reset]);

  const {
    register,

    control,

    setValue,

    formState: { errors, isSubmitting },
  } = methods;

  const selectedIds = useWatch({ control, name: "ozellikIds" }) || [];

  const featuredIds = useWatch({ control, name: "oneCikanOzellikIds" }) || [];

  useEffect(() => {
    let active = true;

    const loadOptions = async () => {
      try {
        const [bolgeData, ozellikData] = await Promise.all([
          getBolgeler(),

          getEmlakOzellikler(),
        ]);

        if (!active) return;

        setBolgeler(extractList(bolgeData));

        setFeatures(extractList(ozellikData));
      } catch (error) {
        if (!active) return;

        console.error("Form seçenekleri yüklenemedi:", error);

        setOptionsError(
          "Bölge, emlak sahibi veya özellik bilgileri yüklenemedi.",
        );
      } finally {
        if (active) setOptionsLoading(false);
      }
    };

    loadOptions();

    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (values) => {
    setSubmitError("");

    try {
      const payload = buildEmlakPayload(values);
      if (isEditMode) {
        console.log("Güncellenen payload:", payload);

        await updateEmlak(emlakId, payload);
      } else {
        await createEmlak(payload);
      }

      router.push("/emlaklar");
    } catch (error) {
      console.error("Emlak kaydetme hatası:", error);

      const data = error.response?.data;

      if (data?.errors) {
        const messages = Object.entries(data.errors).flatMap(
          ([field, errors]) =>
            (Array.isArray(errors) ? errors : [errors]).map(
              (message) => `${field}: ${message}`,
            ),
        );

        setSubmitError(messages.join(" | "));
      } else {
        setSubmitError(
          data?.message ||
            data?.title ||
            "Emlak kaydedilirken bir hata oluştu.",
        );
      }
    }
  };

  if (optionsLoading) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white">
        <Loader2 size={30} className="animate-spin text-blue-600" />

        <p className="text-sm text-slate-500">Form bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (optionsError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6">
        <p className="text-sm text-red-600">{optionsError}</p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  if (isEditMode && emlakLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white">
        <Loader2 size={30} className="animate-spin text-blue-600" />

        <p className="text-sm text-slate-500">Emlak bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (isEditMode && emlakError) {
    return (
      <div
        role="alert"
        className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600"
      >
        <AlertCircle size={20} />

        {emlakError}
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        noValidate
        className="space-y-6"
      >
        {/* TEMEL BİLGİLER */}

        <FormSection
          icon={House}
          title="Temel Bilgiler"
          description="Emlağın kimlik ve sahiplik bilgileri"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor="emlakAdi"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Emlak Adı <span className="text-red-500">*</span>
              </label>

              <input
                id="emlakAdi"
                type="text"
                placeholder="Örn. Villa Deniz"
                {...register("emlakAdi")}
                className={inputClass}
              />

              <FieldError error={errors.emlakAdi} />
            </div>

            <div>
              <label
                htmlFor="emlakTipi"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Emlak Tipi <span className="text-red-500">*</span>
              </label>

              <select
                id="emlakTipi"
                defaultValue=""
                {...register("emlakTipi", {
                  valueAsNumber: true,
                })}
                className={inputClass}
              >
                <option value="">Emlak tipi seçiniz</option>

                {Object.entries(EMLAK_TIPLERI).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <FieldError error={errors.emlakTipi} />
            </div>

            {/* Emlak Sahibi */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Emlak Sahibi <span className="text-red-500">*</span>
              </label>

              <EmlakSahibiSearch
                control={control}
                name="emlakSahibiId"
                error={errors.emlakSahibiId}
                disabled={isSubmitting}
              />
            </div>

            <div className="relative ">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Bölge <span className="text-red-500">*</span>
              </label>

              <BolgeSearch
                control={control}
                name="bolgeId"
                bolgeler={bolgeler}
                disabled={isSubmitting}
                placeholder="Emlak bölgesini seçiniz..."
              />

              <p className="mt-1.5 text-xs text-slate-500">
                Emlağın bulunduğu il, ilçe veya alt bölgeyi seçiniz.
              </p>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="belgeNo"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Turizm Amaçlı Kiralama İzin Belge Numarası
              </label>
              <input
                id="belgeNo"
                type="text"
                maxLength={100}
                placeholder="İzin belge numarasını giriniz"
                {...register("belgeNo")}
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                İzin belgesindeki numarayı olduğu gibi giriniz.
              </p>
              <FieldError error={errors.belgeNo} />
            </div>
          </div>
        </FormSection>

        {/* KAPASİTE */}

        <FormSection
          icon={UsersRound}
          title="Kapasite ve Oda Bilgileri"
          description="Misafir kapasitesi ve oda sayıları"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["kapasite", "Kişi Kapasitesi", 1],

              ["yatakOdasiSayisi", "Yatak Odası", 0],

              ["banyoSayisi", "Banyo Sayısı", 0],
              ["otoparkSayisi", "Otopark Kapasitesi (Araç)", 0],
            ].map(([name, label, min]) => (
              <div key={name}>
                <label
                  htmlFor={name}
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  {label}
                </label>

                <input
                  id={name}
                  type="number"
                  min={min}
                  step="1"
                  placeholder="0"
                  {...register(name, {
                    valueAsNumber: true,
                  })}
                  className={inputClass}
                />

                <FieldError error={errors[name]} />
              </div>
            ))}
          </div>
        </FormSection>

        {/* AÇIKLAMALAR */}

        <FormSection
          icon={FileText}
          title="Açıklamalar"
          description="Emlak hakkında detaylı ve biçimlendirilmiş bilgiler"
        >
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Emlak Açıklaması
              </label>

              <Controller
                name="aciklama"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />

              <FieldError error={errors.aciklama} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Genel Bilgiler
              </label>

              <Controller
                name="genelBilgiler"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />

              <FieldError error={errors.genelBilgiler} />
            </div>
          </div>
        </FormSection>

        {/* KONAKLAMA KOŞULLARI */}

        <FormSection
          icon={Clock3}
          title="Konaklama Koşulları ve Ek Ücretler"
          description="Giriş/çıkış saatleri, minimum gece ve ek bedeller"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label
                htmlFor="girisSaati"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Giriş Saati
              </label>

              <input
                id="girisSaati"
                type="time"
                step="60"
                {...register("girisSaati")}
                className={inputClass}
              />

              <FieldError error={errors.girisSaati} />
            </div>

            <div>
              <label
                htmlFor="cikisSaati"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Çıkış Saati
              </label>

              <input
                id="cikisSaati"
                type="time"
                step="60"
                {...register("cikisSaati")}
                className={inputClass}
              />

              <FieldError error={errors.cikisSaati} />
            </div>

            <div>
              <label
                htmlFor="minimumKonaklamaSuresi"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Minimum Konaklama (Gece)
              </label>

              <input
                id="minimumKonaklamaSuresi"
                type="number"
                min="1"
                max="365"
                step="1"
                {...register("minimumKonaklamaSuresi", { valueAsNumber: true })}
                className={inputClass}
              />

              <FieldError error={errors.minimumKonaklamaSuresi} />
            </div>

            <div>
              <label
                htmlFor="hasarDepozitosu"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Hasar Depozitosu (TL)
              </label>

              <input
                id="hasarDepozitosu"
                type="number"
                min="0"
                step="0.01"
                {...register("hasarDepozitosu", { valueAsNumber: true })}
                className={inputClass}
              />

              <FieldError error={errors.hasarDepozitosu} />
            </div>

            <div>
              <label
                htmlFor="temizlikUcreti"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Temizlik Ücreti (TL)
              </label>

              <input
                id="temizlikUcreti"
                type="number"
                min="0"
                step="0.01"
                {...register("temizlikUcreti", { valueAsNumber: true })}
                className={inputClass}
              />

              <FieldError error={errors.temizlikUcreti} />
            </div>

            <div>
              <label
                htmlFor="minimumKonaklamaTemizlik"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Temizlik Ücreti Gece Sınırı
              </label>

              <input
                id="minimumKonaklamaTemizlik"
                type="number"
                min="0"
                max="365"
                step="1"
                {...register("minimumKonaklamaTemizlik", {
                  valueAsNumber: true,
                })}
                className={inputClass}
              />

              <p className="mt-1.5 text-xs text-slate-500">
                Bu gece sayısının altındaki konaklamalarda temizlik ücreti
                alınır. 0 girilirse uygulanmaz.
              </p>

              <FieldError error={errors.minimumKonaklamaTemizlik} />
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Hasar depozitosu iade edilebilir teminat olarak
            değerlendirilmelidir. Temizlik ücretinin rezervasyon toplamına
            eklenmesi ayrıca backend rezervasyon kurallarına bağlanmalıdır.
          </p>
        </FormSection>

        {/* ÖZELLİKLER */}

        <FormSection
          icon={ListChecks}
          title="Emlak Özellikleri"
          description="Genel ve öne çıkan emlak özellikleri"
        >
          <EmlakOzellikSecimi
            features={features}
            selectedIds={selectedIds}
            featuredIds={featuredIds}
            onSelectedChange={(ids) =>
              setValue("ozellikIds", ids, {
                shouldValidate: true,

                shouldDirty: true,
              })
            }
            onFeaturedChange={(ids) =>
              setValue("oneCikanOzellikIds", ids, {
                shouldValidate: true,

                shouldDirty: true,
              })
            }
          />

          <FieldError error={errors.oneCikanOzellikIds} />
        </FormSection>

        {/* HAVUZ */}

        <FormSection
          icon={Waves}
          title="Havuz Bilgileri"
          description="Bir veya daha fazla havuz tanımlayın"
        >
          <HavuzBilgileri />
        </FormSection>

        {/* KONUM */}

        <FormSection
          icon={MapPin}
          title="Konum"
          description="Emlağın coğrafi koordinatları"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="latitude"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Enlem (Latitude)
              </label>

              <input
                id="latitude"
                type="number"
                step="any"
                placeholder="36.2667"
                {...register("latitude")}
                className={inputClass}
              />

              <FieldError error={errors.latitude} />
            </div>

            <div>
              <label
                htmlFor="longitude"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Boylam (Longitude)
              </label>

              <input
                id="longitude"
                type="number"
                step="any"
                placeholder="29.4167"
                {...register("longitude")}
                className={inputClass}
              />

              <FieldError error={errors.longitude} />
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Koordinatları Google Maps üzerinden alabilirsiniz. İki alanı da boş
            bırakabilirsiniz.
          </p>
        </FormSection>

        {/* FORM ACTIONS */}

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:px-6">
          <button
            type="button"
            onClick={() => router.push("/emlaklar")}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <ArrowLeft size={18} />
            Vazgeç
          </button>

          {submitError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
            >
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={methods.formState.isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {methods.formState.isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : null}

            {methods.formState.isSubmitting
              ? "Kaydediliyor..."
              : isEditMode
                ? "Değişiklikleri Kaydet"
                : "Emlak Oluştur"}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
