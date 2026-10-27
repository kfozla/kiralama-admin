import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const colors = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
};

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color = "blue",
  href,
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            colors[color] || colors.blue
          }`}
        >
          {Icon && <Icon size={23} strokeWidth={1.8} />}
        </div>

        {href && (
          <Link
            href={href}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-blue-600"
          >
            <ArrowUpRight size={18} />
          </Link>
        )}
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">{title}</p>

      <h3 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </h3>

      <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p>
    </div>
  );
}
