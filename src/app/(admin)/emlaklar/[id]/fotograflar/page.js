"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

import { ArrowLeft, House, Images, ChevronRight } from "lucide-react";

import EmlakFotografGalerisi from "@/components/emlak/emlakFotografGalerisi";
import { getEmlakById } from "@/app/services/emlak.service";

export default function EmlakFotograflarPage({ params }) {
  const { id } = use(params);

  const emlakId = Number(id);

  const [emlakAdi, setEmlakAdi] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isInteger(emlakId) || emlakId <= 0) {
      setLoading(false);
      return;
    }

    let active = true;

    const loadEmlak = async () => {
      try {
        const result = await getEmlakById(emlakId);

        if (active) {
          setEmlakAdi(result.emlakAdi ?? result.emlakAdı ?? "Emlak");
        }
      } catch (err) {
        console.error("Emlak bilgisi alınamadı:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadEmlak();

    return () => {
      active = false;
    };
  }, [emlakId]);

  if (!Number.isInteger(emlakId) || emlakId <= 0) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        Geçersiz emlak ID.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link href="/emlaklar" className="hover:text-blue-600">
          Emlaklar
        </Link>

        <ChevronRight size={14} />

        <Link href={`/emlaklar/${emlakId}`} className="hover:text-blue-600">
          {emlakAdi || `Emlak #${emlakId}`}
        </Link>

        <ChevronRight size={14} />

        <span className="font-semibold text-slate-700">Fotoğraflar</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Images size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Fotoğraf Yönetimi
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? "Emlak bilgisi yükleniyor..."
                  : emlakAdi || `Emlak #${emlakId}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/emlaklar/${emlakId}`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <House size={17} />
            Emlak Detayı
          </Link>

          <Link
            href="/emlaklar"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <ArrowLeft size={17} />
            Emlak Listesi
          </Link>
        </div>
      </div>

      {/* Galeri */}
      <EmlakFotografGalerisi emlakId={emlakId} />
    </div>
  );
}
