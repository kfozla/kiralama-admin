"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2, Waves } from "lucide-react";
import { HAVUZ_TIPLERI, HAVUZ_MAHREMIYET } from "@/constants/emlak";

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

export default function HavuzBilgileri() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "havuzBilgileri",
  });

  const addPool = () => {
    append({
      havuzTipi: "Özel Havuz",
      uzunluk: "",
      genislik: "",
      derinlik: "",
      mahremiyet: 0,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Emlakta bulunan havuzları tanımlayın.
        </p>

        <button
          type="button"
          onClick={addPool}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-100"
        >
          <Plus size={17} />
          Havuz Ekle
        </button>
      </div>

      {fields.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-10 text-center">
          <Waves size={29} className="mb-3 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">
            Havuz eklenmedi
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Havuz bilgisi eklemek isteğe bağlıdır.
          </p>
        </div>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5"
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Waves size={19} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Havuz {index + 1}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`${index + 1}. havuzu sil`}
              className="rounded-lg p-2 text-red-500 hover:bg-red-50"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Havuz Tipi
              </label>
              <select
                {...register(`havuzBilgileri.${index}.havuzTipi`)}
                className={inputClass}
              >
                {HAVUZ_TIPLERI.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Mahremiyet
              </label>
              <select
                {...register(`havuzBilgileri.${index}.mahremiyet`, {
                  valueAsNumber: true,
                })}
                className={inputClass}
              >
                {HAVUZ_MAHREMIYET.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {[
              ["uzunluk", "Uzunluk (m)"],
              ["genislik", "Genişlik (m)"],
              ["derinlik", "Derinlik (m)"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  {label}
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  {...register(`havuzBilgileri.${index}.${key}`, {
                    valueAsNumber: true,
                  })}
                  className={inputClass}
                />

                {errors.havuzBilgileri?.[index]?.[key] && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.havuzBilgileri[index][key].message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
