"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, House, Pencil } from "lucide-react";
import EmlakForm from "@/components/emlak/form/emlakForm";

export default function EmlakDuzenlePage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/emlaklar" className="hover:text-blue-600">
          Emlaklar
        </Link>
        <ChevronRight size={15} />
        <span className="font-medium text-slate-800">Emlak Düzenle</span>
      </nav>

      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Pencil size={22} />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Emlak Düzenle
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Emlak bilgilerini ve özelliklerini güncelleyin.
          </p>
        </div>
      </div>

      <EmlakForm key={String(id)} emlakId={id} />
    </div>
  );
}
