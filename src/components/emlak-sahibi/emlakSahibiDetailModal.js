"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  UserRound,
  Phone,
  Mail,
  House,
  FileText,
  Loader2,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { getEmlakSahibiEmlaklar } from "@/app/services/emlakSahibi.service";

function extractList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export default function EmlakSahibiDetailModal({ owner, onClose, onEdit }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!owner) return;

    let active = true;

    const loadProperties = async () => {
      setLoading(true);
      setError("");
      setProperties([]);

      try {
        const data = await getEmlakSahibiEmlaklar(owner.id);
        if (active) setProperties(extractList(data));
      } catch {
        if (active) {
          setError("Sahibine ait emlaklar alınamadı.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProperties();

    return () => {
      active = false;
    };
  }, [owner]);

  useEffect(() => {
    if (!owner) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [owner, onClose]);

  if (!owner) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-detail-title"
        className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <UserRound size={27} />
            </div>

            <div>
              <h2
                id="owner-detail-title"
                className="text-xl font-bold text-slate-900"
              >
                {owner.ad} {owner.soyad}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Emlak Sahibi · #{owner.id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                <Phone size={15} />
                Telefon
              </div>
              <p className="text-sm font-medium text-slate-800">
                {owner.telefon || "-"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                <Mail size={15} />
                E-posta
              </div>
              <p className="break-all text-sm font-medium text-slate-800">
                {owner.email || "-"}
              </p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <FileText size={17} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Açıklama</h3>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {owner.aciklama || "Açıklama girilmemiş."}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <div className="mb-4 flex items-center gap-2">
              <House size={18} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Kayıtlı Emlaklar
              </h3>
              {!loading && !error && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                  {properties.length}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center gap-2 py-5 text-sm text-slate-500">
                <Loader2 size={18} className="animate-spin" />
                Emlaklar yükleniyor...
              </div>
            ) : error ? (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            ) : properties.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                Bu kişiye kayıtlı emlak bulunmuyor.
              </p>
            ) : (
              <div className="space-y-2">
                {properties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/emlaklar/${property.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                        <House size={18} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {property.emlakAdi ??
                            property["emlakAdı"] ??
                            property["EmlakAdı"] ??
                            `Emlak #${property.id}`}
                        </p>
                        <p className="text-xs text-slate-400">
                          Emlak #{property.id}
                        </p>
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-slate-400" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 p-5 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Kapat
          </button>

          <button
            type="button"
            onClick={() => onEdit(owner)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Pencil size={16} />
            Düzenle
          </button>
        </div>
      </div>
    </div>
  );
}
