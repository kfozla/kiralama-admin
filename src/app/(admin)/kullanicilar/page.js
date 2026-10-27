"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserApiError,
} from "@/app/services/user.service";

import UserFormModal from "@/components/kullanicilar/userFormModal";

function extractUsers(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;

  throw new Error("Kullanıcı listesi beklenen formatta gelmedi.");
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  });
}

function UserAvatar({ username }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
      {(username || "?").slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function KullanicilarPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getUsers();
      setUsers(extractUsers(data).filter((user) => !user.isDeleted));
    } catch (err) {
      setError(getUserApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        (user.username ?? "").toLocaleLowerCase("tr-TR").includes(query);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const adminCount = users.filter((user) => user.role === "Admin").length;

  const staffCount = users.filter((user) => user.role === "Personel").length;

  function openCreate() {
    setEditingUser(null);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(user) {
    setEditingUser(user);
    setFormError("");
    setFormOpen(true);
  }

  async function handleSave(values) {
    if (saving) return;

    setSaving(true);
    setFormError("");
    setNotice("");

    try {
      if (editingUser) {
        await updateUser(editingUser.id, values);
      } else {
        await createUser(values);
      }

      const message = editingUser
        ? "Kullanıcı başarıyla güncellendi."
        : "Yeni personel başarıyla eklendi.";

      setFormOpen(false);
      setEditingUser(null);

      setNotice(message);
      await loadUsers();
    } catch (err) {
      setFormError(getUserApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!userToDelete || deleting) return;

    setDeleting(true);
    setDeleteError("");
    setNotice("");

    try {
      await deleteUser(userToDelete.id);

      setUserToDelete(null);
      setNotice("Kullanıcı başarıyla silindi.");
      await loadUsers();
    } catch (err) {
      setDeleteError(getUserApiError(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
            <Users size={26} className="text-blue-600" />
            Kullanıcılar
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Panel kullanıcılarını ve personel hesaplarını yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            title="Listeyi yenile"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <UserPlus size={18} />
            Personel Ekle
          </button>
        </div>
      </div>

      {/* İSTATİSTİKLER */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            title: "Toplam Kullanıcı",
            value: users.length,
            Icon: Users,
            color: "bg-blue-50 text-blue-600",
          },
          {
            title: "Yöneticiler",
            value: adminCount,
            Icon: ShieldCheck,
            color: "bg-purple-50 text-purple-600",
          },
          {
            title: "Personeller",
            value: staffCount,
            Icon: UserRound,
            color: "bg-emerald-50 text-emerald-600",
          },
        ].map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}
            >
              <stat.Icon size={21} />
            </div>
            <p className="text-xs font-medium text-slate-500">{stat.title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "—" : stat.value}
            </p>
          </div>
        ))}
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
        >
          <CheckCircle2 size={18} />
          {notice}
          <button
            type="button"
            onClick={() => setNotice("")}
            className="ml-auto"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* LİSTE */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 className="font-bold text-slate-900">Personel Listesi</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredUsers.length} kullanıcı listeleniyor
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <div className="relative min-w-[190px] flex-1 sm:w-64">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Kullanıcı ara..."
                className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-500"
            >
              <option value="all">Tüm Roller</option>
              <option value="Admin">Yöneticiler</option>
              <option value="Personel">Personeller</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[270px] items-center justify-center gap-3 text-sm text-slate-500">
            <Loader2 size={23} className="animate-spin text-blue-600" />
            Kullanıcılar yükleniyor...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex min-h-[270px] flex-col items-center justify-center gap-3 p-6 text-slate-400">
            <Users size={34} strokeWidth={1.5} />
            <p className="text-sm">Kullanıcı bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <th className="px-5 py-4">Kullanıcı</th>
                  <th className="px-5 py-4">Rol</th>
                  <th className="px-5 py-4">Kayıt Tarihi</th>
                  <th className="px-5 py-4 text-right">İşlemler</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const isAdmin = user.role === "Admin";

                  return (
                    <tr
                      key={user.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar username={user.username} />
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {user.username}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Kullanıcı #{user.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            isAdmin
                              ? "bg-purple-50 text-purple-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {isAdmin ? (
                            <ShieldCheck size={14} />
                          ) : (
                            <UserRound size={14} />
                          )}
                          {isAdmin ? "Yönetici" : user.role}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                          <CalendarDays size={16} className="text-slate-400" />
                          {formatDate(user.createdAt)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            <Pencil size={15} />
                            Düzenle
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError("");
                              setUserToDelete(user);
                            }}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            <Trash2 size={15} />
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* EKLE / DÜZENLE */}
      <UserFormModal
        open={formOpen}
        user={editingUser}
        loading={saving}
        error={formError}
        onSave={handleSave}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
            setEditingUser(null);
            setFormError("");
          }
        }}
      />

      {/* SİLME ONAY MODALI */}
      {userToDelete && (
        <div className="fixed inset-0 z-[310] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[3px]"
            onClick={() => !deleting && setUserToDelete(null)}
          />

          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 size={25} />
            </div>

            <h2
              id="delete-user-title"
              className="text-xl font-bold text-slate-900"
            >
              Kullanıcıyı Sil
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              <strong className="text-slate-900">
                {userToDelete.username}
              </strong>{" "}
              adlı kullanıcıyı silmek istediğinize emin misiniz? Kullanıcının
              panele erişimi kaldırılmalıdır.
            </p>

            {deleteError && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setUserToDelete(null)}
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Vazgeç
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Trash2 size={17} />
                )}
                Kullanıcıyı Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
