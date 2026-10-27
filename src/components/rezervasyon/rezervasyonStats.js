import { CalendarDays, Clock3, CircleCheck, CircleX } from "lucide-react";

export default function RezervasyonStats({ stats }) {
  const items = [
    {
      title: "Toplam Rezervasyon",
      value: stats?.toplamRezervasyon ?? 0,
      icon: CalendarDays,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Bekleyen",
      value: stats?.bekleyen ?? 0,
      icon: Clock3,
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Onaylanan",
      value: stats?.onaylanan ?? 0,
      icon: CircleCheck,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "İptal Edilen",
      value: stats?.iptalEdilen ?? 0,
      icon: CircleX,
      color: "bg-red-50 text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div>
              <p className="text-xs font-medium text-slate-500">{stat.title}</p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {stat.value.toLocaleString("tr-TR")}
              </p>
            </div>

            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}
            >
              <Icon size={22} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
