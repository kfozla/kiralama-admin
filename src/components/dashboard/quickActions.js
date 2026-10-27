import Link from "next/link";
import {
  Plus,
  House,
  CalendarPlus,
  BadgeDollarSign,
  ArrowUpRight,
  CalendarDays,
} from "lucide-react";

const actions = [
  {
    title: "Yeni Emlak",
    description: "Portföye yeni villa ekle",
    href: "/emlaklar/yeni",
    icon: House,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Yeni Rezervasyon",
    description: "Misafir rezervasyonu oluştur",
    href: "/rezervasyonlar/yeni",
    icon: CalendarPlus,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Rezervasyon Takvimi",
    description: "Tüm rezervasyonları takvimde görüntüle",
    href: "/rezervasyonlar/takvim",
    icon: CalendarDays,
    color: "bg-violet-50 text-violet-600",
  },
];

export default function QuickActions() {
  return (
    <section className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Hızlı İşlemler</h2>
          <p className="mt-1 text-xs text-slate-500">Sık kullanılan işlemler</p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Plus size={19} />
        </div>
      </div>

      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.title}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3.5 transition-all hover:border-blue-200 hover:bg-blue-50/30"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.color}`}
              >
                <Icon size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  {action.title}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {action.description}
                </p>
              </div>

              <ArrowUpRight
                size={18}
                className="text-slate-300 transition group-hover:text-blue-600"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
