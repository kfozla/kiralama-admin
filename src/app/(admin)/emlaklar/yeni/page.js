"use client";

import Link from "next/link";
import { ChevronRight, House, Plus } from "lucide-react";
import EmlakForm from "@/components/emlak/form/emlakForm";

export default function YeniEmlakPage() {
  return (
    <div className="space-y-6 pb-10">
      {/* Breadcrumb */}
      <nav
        aria-label="Sayfa yolu"
        className="flex items-center gap-2 text-xs text-slate-500"
      >
        <Link href="/dashboard" className="transition hover:text-blue-600">
          Dashboard
        </Link>

        <ChevronRight size={14} />

        <Link href="/emlaklar" className="transition hover:text-blue-600">
          Emlaklar
        </Link>

        <ChevronRight size={14} />

        <span className="font-semibold text-slate-800">Yeni Emlak</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-blue-50 p-3 text-blue-600">
          <House size={25} />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            Yeni Emlak Ekle
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Portföyünüze yeni bir emlak eklemek için aşağıdaki bilgileri
            doldurun.
          </p>
        </div>
      </div>

      <EmlakForm />
    </div>
  );
}
