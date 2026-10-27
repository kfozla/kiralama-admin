"use client";

import { useEffect, useState } from "react";
import { CircleHelp, Plus, Pencil, Trash2, Save, X, Loader2 } from "lucide-react";
import { getSorularAdmin, createSoru, updateSoru, deleteSoru, getApiMessage } from "@/app/services/kurumsalIcerik.service";
import RichTextEditor from "./richTextEditor";

const blank = { soru: "", cevapHtml: "", sira: 0, aktifMi: true };

export default function SikcaSorulanSorular() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { setItems(await getSorularAdmin()); }
    catch (err) { setError(getApiMessage(err)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditId(null); setForm({ ...blank }); setError(""); setNotice(""); };
  const openEdit = (item) => { setEditId(item.id); setForm({ soru: item.soru, cevapHtml: item.cevapHtml, sira: item.sira, aktifMi: item.aktifMi }); setError(""); setNotice(""); };
  const change = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  async function save(event) {
    event.preventDefault();
    if (saving || !form?.soru.trim() || !form?.cevapHtml.trim()) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const payload = { ...form, soru: form.soru.trim(), sira: Math.max(0, Number(form.sira) || 0) };
      if (editId) await updateSoru(editId, payload);
      else await createSoru(payload);
      setForm(null); setEditId(null);
      await load(); setNotice("Soru kaydedildi.");
    } catch (err) { setError(getApiMessage(err)); }
    finally { setSaving(false); }
  }

  async function remove(item) {
    if (!window.confirm(`“${item.soru}” sorusu silinsin mi?`)) return;
    setSaving(true); setError("");
    try { await deleteSoru(item.id); await load(); setNotice("Soru silindi."); }
    catch (err) { setError(getApiMessage(err)); }
    finally { setSaving(false); }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-3 text-blue-600"><CircleHelp size={21}/></div><div><h2 className="font-bold text-slate-900">Sıkça Sorulan Sorular</h2><p className="text-xs text-slate-500">Soru, cevap ve görünürlük yönetimi</p></div></div>
        <button type="button" onClick={openNew} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={17}/> Yeni Soru</button>
      </div>
      <div className="space-y-3 p-5 sm:p-6">
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
        {form && <form onSubmit={save} className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/30 p-4">
          <h3 className="font-semibold text-slate-800">{editId ? "Soruyu düzenle" : "Yeni soru"}</h3>
          <div><label className="mb-1 block text-sm font-medium">Soru</label><input required maxLength={500} value={form.soru} onChange={(e) => change("soru", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"/></div>
          <div><label className="mb-1 block text-sm font-medium">Cevap</label><RichTextEditor key={editId ?? "new"} value={form.cevapHtml} onChange={(html) => change("cevapHtml", html)} disabled={saving}/></div>
          <div className="flex flex-wrap items-center gap-4"><label className="text-sm">Sıra <input type="number" min="0" value={form.sira} onChange={(e) => change("sira", e.target.value)} className="ml-2 w-20 rounded-lg border border-slate-200 px-2 py-2"/></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.aktifMi} onChange={(e) => change("aktifMi", e.target.checked)}/> Aktif</label></div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setForm(null)} className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm"><X size={16}/> Vazgeç</button><button disabled={saving || !form.soru.trim() || !form.cevapHtml.trim()} className="flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Kaydet</button></div>
        </form>}
        {loading ? <p className="text-sm text-slate-500">Sorular yükleniyor...</p> : items.length === 0 ? <p className="text-sm text-slate-500">Henüz soru eklenmedi.</p> : items.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">{item.soru}</p><p className="mt-1 text-xs text-slate-500">Sıra: {item.sira} · {item.aktifMi ? "Aktif" : "Pasif"}</p></div>
            <div className="flex gap-2"><button title="Düzenle" onClick={() => openEdit(item)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:text-blue-600"><Pencil size={17}/></button><button title="Sil" disabled={saving} onClick={() => remove(item)} className="rounded-lg border border-slate-200 p-2 text-red-500 disabled:opacity-50"><Trash2 size={17}/></button></div>
          </div>
        ))}
      </div>
    </section>
  );
}
