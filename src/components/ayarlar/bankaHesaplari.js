"use client";

import { useEffect, useState } from "react";
import { Landmark, Plus, Pencil, Trash2, Save, X, ImagePlus, Loader2 } from "lucide-react";
import {
  getBankalarAdmin, createBanka, updateBanka, deleteBanka,
  uploadBankaLogo, deleteBankaLogo, getApiMessage,
} from "@/app/services/kurumsalIcerik.service";

const emptyForm = { bankaAdi: "", hesapSahibi: "", iban: "", subeAdi: "", paraBirimi: "TRY", sira: 0, aktifMi: true };
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500";

function logoSrc(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  try { return `${new URL(base).origin}${path.startsWith("/") ? "" : "/"}${path}`; }
  catch { return path; }
}

export default function BankaHesaplari() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    try { setItems(await getBankalarAdmin()); }
    catch (err) { setError(getApiMessage(err)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const startNew = () => { setForm({ ...emptyForm }); setEditId(null); setFile(null); setError(""); setNotice(""); };
  const startEdit = (item) => {
    setEditId(item.id);
    setForm({ bankaAdi: item.bankaAdi, hesapSahibi: item.hesapSahibi, iban: item.iban,
      subeAdi: item.subeAdi ?? "", paraBirimi: item.paraBirimi, sira: item.sira, aktifMi: item.aktifMi });
    setFile(null); setError(""); setNotice("");
  };
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const currentItem = items.find((item) => item.id === editId);

  async function save(event) {
    event.preventDefault();
    if (!form || saving) return;
    if (file && (file.size > 2 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type))) {
      setError("Logo PNG, JPG veya WebP olmalı ve 2 MB'ı geçmemeli."); return;
    }
    setSaving(true); setError(""); setNotice("");
    try {
      const payload = {
        ...form,
        bankaAdi: form.bankaAdi.trim(), hesapSahibi: form.hesapSahibi.trim(),
        iban: form.iban.replace(/\s/g, "").toUpperCase(),
        subeAdi: form.subeAdi.trim() || null,
        sira: Math.max(0, Number(form.sira) || 0),
      };
      const saved = editId ? await updateBanka(editId, payload) : await createBanka(payload);
      // Banka kaydı ilk kez oluşmuş olmalı ki logo ID üzerinden yüklenebilsin.
      if (file) {
        try { await uploadBankaLogo(saved.id, file); }
        catch (uploadError) {
          await load();
          setEditId(saved.id);
          setError(`Banka bilgileri kaydedildi ancak logo yüklenemedi: ${getApiMessage(uploadError)}. Logo seçip tekrar kaydedebilirsin.`);
          return;
        }
      }
      setForm(null); setEditId(null); setFile(null);
      await load(); setNotice("Banka hesabı kaydedildi.");
    } catch (err) { setError(getApiMessage(err)); }
    finally { setSaving(false); }
  }

  async function remove(item) {
    if (!window.confirm(`${item.bankaAdi} hesabı silinsin mi?`)) return;
    setSaving(true); setError("");
    try { await deleteBanka(item.id); await load(); setNotice("Banka hesabı silindi."); }
    catch (err) { setError(getApiMessage(err)); }
    finally { setSaving(false); }
  }

  async function removeLogo() {
    if (!editId || !window.confirm("Banka logosu kaldırılsın mı?")) return;
    setSaving(true); setError("");
    try { await deleteBankaLogo(editId); setFile(null); await load(); setNotice("Logo kaldırıldı."); }
    catch (err) { setError(getApiMessage(err)); }
    finally { setSaving(false); }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Landmark size={21}/></div><div><h2 className="font-bold text-slate-900">Banka Hesapları</h2><p className="text-xs text-slate-500">IBAN, banka logosu ve aktif hesaplar</p></div></div>
        <button type="button" onClick={startNew} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={17}/> Hesap Ekle</button>
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
        {form && <form onSubmit={save} className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/30 p-4">
          <h3 className="font-semibold text-slate-800">{editId ? "Banka hesabını düzenle" : "Yeni banka hesabı"}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Banka Adı *<input required maxLength={150} value={form.bankaAdi} onChange={(e) => update("bankaAdi", e.target.value)} className={`mt-1 ${inputClass}`}/></label>
            <label className="text-sm font-medium text-slate-700">Hesap Sahibi *<input required maxLength={200} value={form.hesapSahibi} onChange={(e) => update("hesapSahibi", e.target.value)} className={`mt-1 ${inputClass}`}/></label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">IBAN *<input required maxLength={42} value={form.iban} onChange={(e) => update("iban", e.target.value.toUpperCase())} placeholder="TR00 0000 0000 0000 0000 0000 00" className={`mt-1 ${inputClass}`}/></label>
            <label className="text-sm font-medium text-slate-700">Şube Adı<input maxLength={150} value={form.subeAdi} onChange={(e) => update("subeAdi", e.target.value)} className={`mt-1 ${inputClass}`}/></label>
            <label className="text-sm font-medium text-slate-700">Para Birimi<select value={form.paraBirimi} onChange={(e) => update("paraBirimi", e.target.value)} className={`mt-1 ${inputClass}`}>{["TRY", "USD", "EUR", "GBP"].map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Sıra<input type="number" min="0" value={form.sira} onChange={(e) => update("sira", e.target.value)} className={`mt-1 ${inputClass}`}/></label>
            <label className="flex items-center gap-2 self-end pb-3 text-sm text-slate-700"><input type="checkbox" checked={form.aktifMi} onChange={(e) => update("aktifMi", e.target.checked)}/> Aktif hesap</label>
          </div>
          <div className="space-y-2"><label className="block text-sm font-semibold text-slate-700">Banka Logosu (PNG, JPG, WebP · en fazla 2 MB)</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700"/>
            {(preview || currentItem?.logoUrl) && <img src={preview || logoSrc(currentItem.logoUrl)} alt="Banka logosu önizlemesi" className="h-20 w-40 rounded-lg border border-slate-200 bg-white object-contain p-2"/>}
            {editId && currentItem?.logoUrl && <button type="button" disabled={saving} onClick={removeLogo} className="text-xs font-semibold text-red-600 disabled:opacity-50">Mevcut logoyu kaldır</button>}
          </div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => { setForm(null); setEditId(null); setFile(null); }} className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm"><X size={16}/> Vazgeç</button><button disabled={saving || !form.bankaAdi.trim() || !form.hesapSahibi.trim() || !form.iban.trim()} type="submit" className="flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Kaydet</button></div>
        </form>}
        {loading ? <p className="text-sm text-slate-500">Banka hesapları yükleniyor...</p> : items.length === 0 ? <p className="text-sm text-slate-500">Henüz banka hesabı eklenmedi.</p> : items.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 p-4">
          <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-50">{item.logoUrl ? <img src={logoSrc(item.logoUrl)} alt={`${item.bankaAdi} logosu`} className="h-14 w-20 object-contain"/> : <ImagePlus size={22} className="text-slate-400"/>}</div>
          <div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">{item.bankaAdi} <span className="ml-1 text-xs font-normal text-slate-400">{item.paraBirimi}</span></p><p className="mt-1 text-xs text-slate-600">{item.hesapSahibi}</p><p className="mt-1 break-all font-mono text-xs text-slate-700">{item.iban}</p><p className="mt-1 text-xs text-slate-400">Sıra: {item.sira} · {item.aktifMi ? "Aktif" : "Pasif"}</p></div>
          <div className="flex gap-2"><button type="button" title="Düzenle" onClick={() => startEdit(item)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:text-blue-600"><Pencil size={17}/></button><button type="button" title="Sil" disabled={saving} onClick={() => remove(item)} className="rounded-lg border border-slate-200 p-2 text-red-600 disabled:opacity-50"><Trash2 size={17}/></button></div>
        </div>)}
      </div>
    </section>
  );
}
