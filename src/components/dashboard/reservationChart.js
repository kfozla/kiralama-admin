"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { BarChart3 } from "lucide-react";

import { useEffect, useState } from "react";

import { getLastSixMonthsReservations } from "@/app/services/dashboard.service";

const defaultData = [
  { month: "May", count: 9 },
  { month: "Haz", count: 15 },
  { month: "Tem", count: 24 },
  { month: "Ağu", count: 21 },
  { month: "Eyl", count: 16 },
  { month: "Eki", count: 12 },
];

export default function ReservationChart({ data = defaultData }) {
  const [chartData, setChartData] = useState(defaultData);

  useEffect(() => {
    async function fetchChartData() {
      try {
        const data = await getLastSixMonthsReservations();
        setChartData(data);
        console.log("Rezervasyon verileri alındı:", data);
      } catch (error) {
        console.error("Rezervasyon verileri alınamadı:", error);
      }
    }

    fetchChartData();
  }, []);

  return (
    <section className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={19} className="text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Rezervasyon Analizi
            </h2>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Aylara göre oluşturulan rezervasyonlar
          </p>
        </div>

        <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
          Son 6 Ay
        </div>
      </div>

      <div className="h-[280px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 0, left: -24, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#E2E8F0"
              strokeDasharray="4 4"
            />

            <XAxis
              dataKey="ayAdi"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94A3B8", fontSize: 12 }}
              dy={12}
            />

            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94A3B8", fontSize: 12 }}
            />

            <Tooltip
              cursor={{ fill: "#EFF6FF" }}
              formatter={(value) => [value, "Rezervasyon"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #E2E8F0",
                boxShadow: "0 8px 30px rgba(15,23,42,0.08)",
              }}
            />

            <Bar
              dataKey="rezervasyonSayisi"
              name="Rezervasyon"
              fill="#2563EB"
              radius={[7, 7, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Örnek veriler gösterilmektedir.
      </p>
    </section>
  );
}
