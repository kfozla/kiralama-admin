"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  House,
  CalendarDays,
  CalendarRange,
  UsersRound,
  Wallet,
  MapPin,
  SlidersHorizontal,
  ChevronLeft,
  X,
  Building2,
  Settings2,
  Plus,
  Settings,
  ScrollText,
  ShieldCheck,
  CalendarPlus,
} from "lucide-react";

const mainMenu = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
];
const emlakMenu = [
  {
    label: "Emlak Listesi",
    href: "/emlaklar",
    icon: House,
  },
  {
    label: "Emlak Ekle",
    href: "/emlaklar/yeni",
    icon: Plus,
  },
  {
    label: "Emlak Sahipleri",
    href: "/emlak-sahipleri",
    icon: UsersRound,
  },
  {
    label: "Emlak Özellikleri",
    href: "/ozellikler",
    icon: SlidersHorizontal,
  },

  {
    label: "Bölgeler",
    href: "/bolgeler",
    icon: MapPin,
  },
];
const rezervasyonMenu = [
  {
    label: "Rezervasyonlar",
    href: "/rezervasyonlar",
    icon: CalendarDays,
  },
  {
    label: "Yeni Rezervasyon",
    href: "/rezervasyonlar/yeni",
    icon: CalendarPlus,
  },
  {
    label: "Rezervasyon Takvimi",
    href: "/rezervasyonlar/takvim",
    icon: CalendarRange,
  },
];

const managementMenu = [
  {
    label: "Kullanıcılar",
    href: "/kullanicilar",
    icon: UsersRound,
  },
  {
    label: "Ayarlar",
    href: "/ayarlar",
    icon: Settings,
  },
];

function MenuGroup({ title, items, pathname, onClose }) {
  return (
    <div>
      <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.16em] text-slate-500 uppercase">
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20"
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon
                size={19}
                strokeWidth={active ? 2.3 : 1.8}
                className="shrink-0"
              />

              <span className="flex-1">{item.label}</span>

              {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-[#0F172A] transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Brand */}
      <div className="flex h-[88px] shrink-0 items-center justify-between border-b border-white/10 px-6">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Building2 size={23} strokeWidth={1.8} />
          </div>

          <div>
            <p className="text-[15px] font-bold tracking-tight text-white">
              Göksoft
            </p>

            <p className="mt-0.5 text-[10px] tracking-[0.12em] text-slate-400 uppercase">
              Yönetim Paneli
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={onClose}
          aria-label="Menüyü kapat"
          className="text-slate-400 lg:hidden"
        >
          <X size={22} />
        </button>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Yönetim menüsü"
        className="scrollbar-hide flex-1 space-y-9 overflow-y-auto px-4 py-7"
      >
        <MenuGroup
          title="Ana Menü"
          items={mainMenu}
          pathname={pathname}
          onClose={onClose}
        />

        <MenuGroup
          title="Emlak İşlemleri"
          items={emlakMenu}
          pathname={pathname}
          onClose={onClose}
        />

        <MenuGroup
          title="Rezervasyon İşlemleri"
          items={rezervasyonMenu}
          pathname={pathname}
          onClose={onClose}
        />

        <MenuGroup
          title="Yönetim"
          items={managementMenu}
          pathname={pathname}
          onClose={onClose}
        />
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300">
            <Settings2 size={18} />
          </div>

          <div className="flex-1">
            <p className="text-xs font-medium text-white">Yönetim Sistemi</p>

            <p className="mt-1 text-[11px] text-slate-400">v1.0.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
