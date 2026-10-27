"use client";

import { useEffect, useState } from "react";
import {
  FileCheck2,
  FileUp,
  FileText,
  ExternalLink,
  Download,
  Trash2,
  Loader2,
  Save,
} from "lucide-react";

import {
  updateIsletmeAyarlari,
  uploadTursabBelgesi,
  deleteTursabBelgesi,
  getTursabBelgesiBlob,
  isletmeApiError,
} from "@/app/services/isletmeAyarlari.service";

export default function TursabBelgeUpload({ settings, onUpdated }) {
  const [membership, setMembership] = useState(false);
  const [documentNumber, setDocumentNumber] = useState("");
  const [file, setFile] = useState(null);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [documentType, setDocumentType] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!settings) return;
    setMembership(Boolean(settings.tursabUyeligiVar));
    setDocumentNumber(settings.tursabBelgeNo ?? "");
  }, [settings]);

  useEffect(() => {
    let active = true;
    let url = null;

    async function loadDocument() {
      setDocumentUrl(null);

      if (!settings?.tursabBelgesiVar) return;

      setLoading(true);

      try {
        const blob = await getTursabBelgesiBlob();

        url = URL.createObjectURL(blob);

        if (active) {
          setDocumentUrl(url);
          setDocumentType(blob.type);
        } else {
          URL.revokeObjectURL(url);
        }
      } catch {
        if (active) setError("Belge görüntülenemedi.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDocument();

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [settings?.tursabBelgesiVar, settings?.updatedAt]);

  async function saveMembership() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await updateIsletmeAyarlari({
        isletmeAdi: settings.isletmeAdi,
        yetkiliKisi: settings.yetkiliKisi,
        telefon: settings.telefon,
        email: settings.email,
        adres: settings.adres,
        webSitesi: settings.webSitesi,
        tursabUyeligiVar: membership,
        tursabBelgeNo: membership ? documentNumber.trim() || null : null,
      });

      onUpdated(result);
      setSuccess("TÜRSAB bilgileri kaydedildi.");
    } catch (err) {
      setError(isletmeApiError(err));
    } finally {
      setSaving(false);
    }
  }

  function handleFile(event) {
    const selected = event.target.files?.[0];
    event.target.value = "";

    if (!selected) return;

    const allowed = ["application/pdf", "image/png", "image/jpeg"];

    if (!allowed.includes(selected.type)) {
      setError("PDF, PNG veya JPG dosyası seçiniz.");
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError("Belge en fazla 10 MB olabilir.");
      return;
    }

    setFile(selected);
    setError("");
    setSuccess("");
  }

  async function uploadDocument() {
    if (!file || saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Önce formdaki güncel üyelik bilgilerini kaydet.
      const updated = await updateIsletmeAyarlari({
        isletmeAdi: settings.isletmeAdi,
        yetkiliKisi: settings.yetkiliKisi,
        telefon: settings.telefon,
        email: settings.email,
        adres: settings.adres,
        webSitesi: settings.webSitesi,
        tursabUyeligiVar: true,
        tursabBelgeNo: documentNumber.trim() || null,
      });

      const result = await uploadTursabBelgesi(file);

      setMembership(true);
      setFile(null);
      onUpdated({
        ...updated,
        ...result,
      });

      setSuccess("TÜRSAB belgesi yüklendi.");
    } catch (err) {
      setError(isletmeApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeDocument() {
    if (!settings?.tursabBelgesiVar || saving) return;

    if (!window.confirm("TÜRSAB belgesi kaldırılsın mı?")) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await deleteTursabBelgesi();
      setFile(null);
      onUpdated({
        ...settings,
        tursabBelgesiVar: false,
      });
      setSuccess("Belge kaldırıldı.");
    } catch (err) {
      setError(isletmeApiError(err));
    } finally {
      setSaving(false);
    }
  }

  function downloadDocument() {
    if (!documentUrl) return;

    const extension =
      documentType === "application/pdf"
        ? ".pdf"
        : documentType === "image/png"
          ? ".png"
          : ".jpg";

    const anchor = document.createElement("a");
    anchor.href = documentUrl;
    anchor.download = `tursab-belgesi${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <FileCheck2 size={21} />
        </div>

        <div>
          <h2 className="font-bold text-slate-900">TÜRSAB Bilgileri</h2>
          <p className="mt-1 text-xs text-slate-500">
            Opsiyonel üyelik ve belge bilgileri
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              TÜRSAB Üyeliği
            </p>
            <p className="mt-1 text-xs text-slate-500">
              İşletmenizin üyeliği varsa etkinleştirin.
            </p>
          </div>

          <input
            type="checkbox"
            checked={membership}
            onChange={(e) => setMembership(e.target.checked)}
            className="h-5 w-5 accent-blue-600"
          />
        </label>

        {membership && (
          <>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                TÜRSAB Belge Numarası
              </label>

              <input
                type="text"
                maxLength={100}
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Belge numarasını giriniz"
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <FileText size={34} className="text-blue-600" />
                <p className="text-sm font-semibold text-slate-700">
                  TÜRSAB Belgesi
                </p>
                <p className="text-xs text-slate-500">
                  PDF, PNG veya JPG · Maksimum 10 MB
                </p>

                <input
                  id="tursab-file"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFile}
                  className="hidden"
                />

                <label
                  htmlFor="tursab-file"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <FileUp size={17} />
                  Dosya Seç
                </label>

                {file && (
                  <p className="max-w-full break-all text-xs text-blue-700">
                    {file.name}
                  </p>
                )}
              </div>
            </div>

            {loading && (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                Mevcut belge yükleniyor...
              </p>
            )}

            {settings?.tursabBelgesiVar && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <FileCheck2 size={18} />
                  Yüklü TÜRSAB belgesi mevcut
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {documentUrl && (
                    <>
                      <a
                        href={documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                      >
                        <ExternalLink size={15} />
                        Görüntüle
                      </a>

                      <button
                        type="button"
                        onClick={downloadDocument}
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                      >
                        <Download size={15} />
                        İndir
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={removeDocument}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    Kaldır
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"
          >
            {success}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            disabled={saving}
            onClick={saveMembership}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Save size={17} />
            Bilgileri Kaydet
          </button>

          {membership && file && (
            <button
              type="button"
              disabled={saving}
              onClick={uploadDocument}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <FileUp size={17} />
              )}
              Belgeyi Yükle
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
