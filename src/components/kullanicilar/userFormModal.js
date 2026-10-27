"use client";

import { useEffect, useState } from "react";
import {
  X,
  UserPlus,
  Pencil,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

const emptyForm = {
  username: "",
  password: "",
  role: "Personel",
};

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

export default function UserFormModal({
  open,
  user,
  loading,
  error,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  const editing = Boolean(user);

  useEffect(() => {
    if (!open) return;

    setForm({
      username: user?.username ?? "",
      password: "",
      role: user?.role ?? "Personel",
    });
    setShowPassword(false);
  }, [open, user]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !loading) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onClose]);

  if (!open) return null;

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.username.trim() || !form.password || form.password.length < 8) {
      return;
    }

    onSave(form);
  }

  const valid =
    form.username.trim().length > 0 &&
    form.password.length >= 8 &&
    ["Admin", "Personel"].includes(form.role);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[3px]"
        onClick={() => !loading && onClose()}
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              {editing ? <Pencil size={22} /> : <UserPlus size={22} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editing ? "Kullanıcı Düzenle" : "Yeni Personel Ekle"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Panel hesabı ve erişim rolü
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Kullanıcı Adı *
            </label>
            <input
              required
              autoComplete="off"
              value={form.username}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  username: event.target.value,
                }))
              }
              placeholder="Örn: ahmet.yilmaz"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              {editing ? "Yeni Şifre *" : "Şifre *"}
            </label>

            <div className="relative">
              <input
                required
                minLength={8}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    password: event.target.value,
                  }))
                }
                placeholder="En az 8 karakter"
                className={`${inputClass} pr-12`}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              {editing
                ? "Mevcut şifre gösterilmez. Düzenleme sırasında yeni bir şifre belirleyin."
                : "Personelin panele giriş yaparken kullanacağı şifre."}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Kullanıcı Rolü *
            </label>

            <select
              value={form.role}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  role: event.target.value,
                }))
              }
              className={inputClass}
            >
              <option value="Personel">Personel</option>
              <option value="Admin">Yönetici (Admin)</option>
            </select>

            <div className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-700">
              <ShieldCheck size={17} className="mt-0.5 shrink-0" />
              <p>
                Admin rolü personel yönetimi gibi yetkili işlemler için
                kullanılabilir. Personel yetkileri backend tarafında ayrıca
                sınırlandırılmalıdır.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Vazgeç
            </button>

            <button
              type="submit"
              disabled={!valid || loading}
              className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 size={17} className="animate-spin" />}
              {editing ? "Değişiklikleri Kaydet" : "Personel Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
