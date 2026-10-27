"use client";

import { useEffect, useState } from "react";
import { FileText, Save, Loader2 } from "lucide-react";
import { getSayfaIcerikleri, updateSayfaIcerigi, getApiMessage } from "@/app/services/kurumsalIcerik.service";
import RichTextEditor from "./richTextEditor";

const pages = [
  { slug: "hakkimizda", title: "Hakkımızda" },
  { slug: "kiralama-sozlesmesi", title: "Kiralama Sözleşmesi" },
  { slug: "musteri-aydinlatma-metni", title: "Müşteri Aydınlatma Metni" },
  { slug: "gizlilik-politikasi", title: "Gizlilik Politikası" },
  { slug: "cerez-politikasi", title: "Çerez Politikası" },
];

export default function SayfaIcerikleri() {
  const [slug, setSlug] = useState(pages[0].slug);
  const [records, setRecords] = useState({});
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getSayfaIcerikleri();
        if (active) setRecords(Object.fromEntries(data.map((x) => [x.slug, x])));
      } catch (err) { if (active) setError(getApiMessage(err)); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const current = records[slug];
    setTitle(current?.baslik ?? pages.find((p) => p.slug === slug)?.title ?? "");
    setHtml(current?.icerikHtml ?? "");
    setError("");
    setNotice("");
  }, [slug, records]);

  async function save(event) {
    event.preventDefault();
    if (!title.trim() || !html.trim() || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const result = await updateSayfaIcerigi(slug, { baslik: title.trim(), icerikHtml: html });
      setRecords((prev) => ({ ...prev, [slug]: result }));
      setNotice("İçerik kaydedildi.");
    } catch (err) { setError(getApiMessage(err)); }
    finally { setSaving(false); }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><FileText size={21} /></div>
        <div><h2 className="font-bold text-slate-900">Sayfa İçerikleri</h2><p className="mt-1 text-xs text-slate-500">Kurumsal sayfaların HTML içeriklerini düzenleyin.</p></div>
      </div>
      {loading ? <p className="p-6 text-sm text-slate-500">İçerikler yükleniyor...</p> : (
        <form onSubmit={save} className="space-y-5 p-5 sm:p-6">
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Düzenlenecek sayfa</label>
            <select value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm sm:max-w-md">
              {pages.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
            </select>
          </div>
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Sayfa başlığı</label>
            <input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">İçerik</label>
            <RichTextEditor key={slug} value={html} onChange={setHtml} disabled={saving} />
          </div>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
          <div className="flex justify-end"><button disabled={saving || !title.trim() || !html.trim()} type="submit" className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? <Loader2 size={17} className="animate-spin"/> : <Save size={17}/>} Kaydet</button></div>
        </form>
      )}
    </section>
  );
}
