"use client";

import Link from "next/link";

import { ChevronRight, CalendarPlus } from "lucide-react";

import RezervasyonForm from "@/components/rezervasyon/rezervasyonForm";

export default function YeniRezervasyonPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/rezervasyonlar" className="transition hover:text-blue-600">
          Rezervasyonlar
        </Link>

        <ChevronRight size={15} />

        <span className="font-semibold text-slate-800">Yeni Rezervasyon</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <CalendarPlus size={24} />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Yeni Rezervasyon
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Konaklama ve müşteri bilgilerini girerek yeni rezervasyon oluşturun.
          </p>
        </div>
      </div>

      <RezervasyonForm />
    </div>
  );
}
