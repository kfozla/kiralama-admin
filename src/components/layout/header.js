"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import {
  Menu,
  LogOut,
  ChevronDown,
  UserRound,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import { logoutUser } from "@/app/services/auth.service";
import { useAuth } from "@/app/components/auth-guard";
import { clearAccessToken } from "@/app/lib/authToken";

const pageTitles = {
  dashboard: "Dashboard",
  emlaklar: "Emlaklar",
  "emlak-sahipleri": "Emlak Sahipleri",
  rezervasyonlar: "Rezervasyonlar",
  takvim: "Takvim",
  fiyatlar: "Fiyat Yönetimi",
  bolgeler: "Bölgeler",
  ozellikler: "Emlak Özellikleri",
  kullanicilar: "Kullanıcılar",
  ayarlar: "Ayarlar",
};

export default function Header({ onMenuClick }) {
  const pathname = usePathname();

  // AuthGuard içerisindeki AuthContext'ten gelir.
  const { user } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const segment = pathname?.split("/").filter(Boolean)[0];
  const title = pageTitles[segment] || "Yönetim Paneli";

  // Kullanıcı bilgileri /auth/me endpoint'inden gelir.
  const username = user?.username ?? user?.userName ?? user?.name ?? "Yönetici";

  const role = user?.role ?? user?.userRole ?? "Yönetici";

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setMenuOpen(false);

    try {
      await logoutUser();
    } catch (error) {
      console.error("Çıkış isteği başarısız:", error);
    } finally {
      // Access token artık sessionStorage'da değil.
      clearAccessToken();

      // Auth state ve sayfa tamamen sıfırlanır.
      window.location.replace("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      {/* SOL TARAF */}
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Menüyü aç"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
        >
          <Menu size={21} />
        </button>

        <div>
          <p className="text-[11px] font-medium tracking-wide text-slate-400">
            Villa Management / Yönetim
          </p>

          <h1 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">
            {title}
          </h1>
        </div>
      </div>

      {/* SAĞ TARAF */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-slate-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <UserRound size={20} />
          </div>

          <div className="hidden text-left sm:block">
            <p className="max-w-40 truncate text-sm font-semibold text-slate-800">
              {username}
            </p>

            <p className="text-[11px] text-slate-400">{role}</p>
          </div>

          <ChevronDown
            size={16}
            className={`hidden text-slate-400 transition-transform sm:block ${
              menuOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {menuOpen && (
          <>
            {/* Menü dışına tıklayınca kapat */}
            <button
              type="button"
              aria-label="Kullanıcı menüsünü kapat"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />

            {/* Kullanıcı menüsü */}
            <div
              role="menu"
              className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10"
            >
              <div className="border-b border-slate-100 px-3 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  {username}
                </p>

                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <ShieldCheck size={13} />
                  {role}
                </p>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {loggingOut ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <LogOut size={17} />
                )}

                {loggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
