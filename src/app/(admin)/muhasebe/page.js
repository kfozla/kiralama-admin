"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  CalendarCheck,
  Wallet,
  TrendingUp,
  House,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import EmlakSearch from "@/components/emlak/emlakSearch";
import {
  getMuhasebeOzet,
  getMuhasebeRezervasyonlar,
  getMuhasebeAylikGrafik,
} from "@/app/services/muhasebe.service";

const money = (value) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(Number(value ?? 0));

const dateText = (value) => {
  if (!value) return "-";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return `${day}.${month}.${year}`;
};

const initialFilters = () => {
  const year = new Date().getFullYear();
  return {
    baslangicTarihi: `${year}-01-01`,
    bitisTarihi: `${year}-12-31`,
    emlakId: null,
  };
};

const monthNames = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

const compactMoney = (value) =>
  new Intl.NumberFormat("tr-TR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value ?? 0));

// API yalnızca rezervasyon bulunan ayları dönebilir.
// Seçili dönemdeki boş ayları sıfır olarak tamamlıyoruz.
function buildMonthlyData(items, startDate, endDate) {
  if (!startDate || !endDate) return [];

  const firstYear = Number(startDate.slice(0, 4));
  const firstMonth = Number(startDate.slice(5, 7));
  const lastYear = Number(endDate.slice(0, 4));
  const lastMonth = Number(endDate.slice(5, 7));
  const byMonth = new Map(
    (items ?? []).map((item) => [
      `${item.yil ?? item.Yil}-${item.ay ?? item.Ay}`,
      item,
    ]),
  );

  const result = [];
  for (let year = firstYear; year <= lastYear; year++) {
    const begin = year === firstYear ? firstMonth : 1;
    const end = year === lastYear ? lastMonth : 12;
    for (let month = begin; month <= end; month++) {
      const found = byMonth.get(`${year}-${month}`) ?? {};
      result.push({
        key: `${year}-${String(month).padStart(2, "0")}`,
        label: `${monthNames[month - 1]} ${year}`,
        rezervasyonHacmi: Number(
          found.rezervasyonHacmi ?? found.RezervasyonHacmi ?? 0,
        ),
        onOdeme: Number(found.onOdeme ?? found.OnOdeme ?? 0),
        komisyon: Number(found.komisyon ?? found.Komisyon ?? 0),
        evSahibiHakedis: Number(
          found.evSahibiHakedis ?? found.EvSahibiHakedis ?? 0,
        ),
      });
    }
  }
  return result;
}

const tooltipFormatter = (value, name) => [money(value), name];

function SummaryCard({ title, value, icon: Icon, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="mt-3 break-words text-xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-400">{description}</p>
        </div>
        <div className="shrink-0 rounded-xl bg-blue-50 p-3 text-blue-600">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function MuhasebePage() {
  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: initialFilters(),
  });
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [ozet, setOzet] = useState(null);
  const [monthlyItems, setMonthlyItems] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [ozetLoading, setOzetLoading] = useState(true);
  const [ozetError, setOzetError] = useState("");
  const [chartError, setChartError] = useState("");
  const [rezervasyonlar, setRezervasyonlar] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Finansal özet ve grafik bağımsız yüklenir. Birinin hatası diğerini silmez.
  useEffect(() => {
    let active = true;
    const params = {
      baslangicTarihi: appliedFilters.baslangicTarihi,
      bitisTarihi: appliedFilters.bitisTarihi,
      ...(appliedFilters.emlakId != null && {
        emlakId: appliedFilters.emlakId,
      }),
    };

    const loadOverview = async () => {
      setOzetLoading(true);
      setChartLoading(true);
      setOzetError("");
      setChartError("");
      setOzet(null);
      setMonthlyItems([]);

      // allSettled: grafik 404/500 döndürse de başarılı özet korunur.
      const [ozetResult, grafikResult] = await Promise.allSettled([
        getMuhasebeOzet(params),
        getMuhasebeAylikGrafik(params),
      ]);

      if (!active) return;

      if (ozetResult.status === "fulfilled") {
        const data = ozetResult.value;
        setOzet(data?.data ?? data);
      } else {
        console.error("Muhasebe özet isteği başarısız:", ozetResult.reason);
        setOzetError(
          ozetResult.reason?.response?.data?.message ||
            `Finansal özet yüklenemedi (HTTP ${ozetResult.reason?.response?.status ?? "bağlantı hatası"}).`,
        );
      }

      if (grafikResult.status === "fulfilled") {
        const data = grafikResult.value?.data ?? grafikResult.value;
        setMonthlyItems(
          Array.isArray(data) ? data : (data?.items ?? data?.Items ?? []),
        );
      } else {
        console.error("Muhasebe grafik isteği başarısız:", grafikResult.reason);
        setChartError(
          grafikResult.reason?.response?.data?.message ||
            `Aylık grafik yüklenemedi (HTTP ${grafikResult.reason?.response?.status ?? "bağlantı hatası"}).`,
        );
      }
      setOzetLoading(false);
      setChartLoading(false);
    };

    loadOverview();
    return () => {
      active = false;
    };
  }, [appliedFilters]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // İki tarih parametresi de giriş tarihi aralığını temsil eder.
        const listeParams = {
          page,
          pageSize,
          girisTarihi: appliedFilters.baslangicTarihi,
          cikisTarihi: appliedFilters.bitisTarihi,
          ...(appliedFilters.emlakId != null && {
            emlakId: appliedFilters.emlakId,
          }),
        };
        const listeData = await getMuhasebeRezervasyonlar(listeParams);
        if (!active) return;
        setRezervasyonlar(listeData.items ?? listeData.Items ?? []);
        setTotalCount(listeData.totalCount ?? listeData.TotalCount ?? 0);
      } catch (err) {
        if (!active) return;
        setRezervasyonlar([]);
        setTotalCount(0);
        setError(
          err?.response?.data?.message || "Muhasebe verileri yüklenemedi.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [appliedFilters, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const chartData = buildMonthlyData(
    monthlyItems,
    appliedFilters.baslangicTarihi,
    appliedFilters.bitisTarihi,
  );
  const hasChartData = chartData.some(
    (item) =>
      item.rezervasyonHacmi ||
      item.onOdeme ||
      item.komisyon ||
      item.evSahibiHakedis,
  );

  const onFilter = (values) => {
    if (!values.baslangicTarihi || !values.bitisTarihi) {
      setError("Başlangıç ve bitiş tarihlerini girin.");
      return;
    }
    if (values.baslangicTarihi > values.bitisTarihi) {
      setError("Bitiş tarihi başlangıç tarihinden önce olamaz.");
      return;
    }
    const emlakId =
      values.emlakId == null || values.emlakId === ""
        ? null
        : Number(values.emlakId);
    if (emlakId != null && (!Number.isInteger(emlakId) || emlakId <= 0)) {
      setError("Geçersiz emlak seçimi.");
      return;
    }
    setError("");
    setPage(1);
    setAppliedFilters({
      baslangicTarihi: values.baslangicTarihi,
      bitisTarihi: values.bitisTarihi,
      emlakId,
    });
  };

  const onReset = () => {
    const values = initialFilters();
    reset(values);
    setPage(1);
    setAppliedFilters(values);
    setError("");
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
          Muhasebe
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Onaylanmış rezervasyonların finansal durumunu seçilen dönem ve emlağa
          göre inceleyin.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onFilter)}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-4 flex items-center gap-2">
          <Search size={18} className="text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Finansal Filtreler
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label
              className="mb-2 block text-xs font-semibold text-slate-600"
              htmlFor="baslangicTarihi"
            >
              Giriş Tarihi Başlangıcı
            </label>
            <input
              id="baslangicTarihi"
              type="date"
              {...register("baslangicTarihi")}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label
              className="mb-2 block text-xs font-semibold text-slate-600"
              htmlFor="bitisTarihi"
            >
              Giriş Tarihi Bitişi
            </label>
            <input
              id="bitisTarihi"
              type="date"
              {...register("bitisTarihi")}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-600">
              Emlak
            </label>
            <EmlakSearch control={control} name="emlakId" />
            <p className="mt-1.5 text-xs text-slate-400">
              Boş bırakılırsa tüm emlaklar dahil edilir.
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={16} /> Sıfırla
          </button>
          <button
            type="submit"
            className="h-10 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Filtrele
          </button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
        >
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Finansal Genel Bakış
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {dateText(appliedFilters.baslangicTarihi)} –{" "}
              {dateText(appliedFilters.bitisTarihi)}
              {appliedFilters.emlakId == null
                ? " · Tüm emlaklar"
                : " · Seçili emlak"}
            </p>
          </div>
          {ozetLoading && (
            <Loader2 size={18} className="animate-spin text-blue-600" />
          )}
        </div>
        {ozetError && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {ozetError}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Toplam Rezervasyon Hacmi"
            value={
              ozetLoading
                ? "…"
                : ozet
                  ? money(ozet.toplamRezervasyonHacmi)
                  : "—"
            }
            icon={CalendarCheck}
            description="Konaklama bedelleri toplamı"
          />
          <SummaryCard
            title="Toplam Ön Ödeme"
            value={ozetLoading ? "…" : ozet ? money(ozet.toplamOnOdeme) : "—"}
            icon={Wallet}
            description="Planlanan, tahsilat onaysız"
          />
          <SummaryCard
            title="Toplam Acente Komisyonu"
            value={ozetLoading ? "…" : ozet ? money(ozet.toplamKomisyon) : "—"}
            icon={TrendingUp}
            description="Hesaplanan acente komisyonu"
          />
          <SummaryCard
            title="Ev Sahipleri Toplam Hakedişi"
            value={
              ozetLoading
                ? "…"
                : ozet
                  ? money(ozet.toplamEmlakSahibiHakedis)
                  : "—"
            }
            icon={House}
            description="Konaklama bedeli − komisyon"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={19} className="text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Aylık Finansal Dağılım
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Onaylı rezervasyonlar · Giriş tarihine göre ·{" "}
              {dateText(appliedFilters.baslangicTarihi)} –{" "}
              {dateText(appliedFilters.bitisTarihi)}
            </p>
          </div>
          {chartLoading && (
            <Loader2 size={18} className="animate-spin text-blue-600" />
          )}
        </div>
        {chartError ? (
          <div
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {chartError}
          </div>
        ) : chartLoading ? (
          <div className="flex h-80 items-center justify-center text-sm text-slate-500">
            Grafik yükleniyor...
          </div>
        ) : !hasChartData ? (
          <div className="flex h-80 items-center justify-center text-center text-sm text-slate-500">
            Seçili tarih ve emlak için onaylanmış rezervasyon bulunamadı.
          </div>
        ) : (
          <div className="h-[380px] w-full overflow-x-auto">
            <div
              style={{ minWidth: `${Math.max(680, chartData.length * 85)}px` }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 12, right: 12, left: 12, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis
                    tickFormatter={compactMoney}
                    tick={{ fontSize: 11 }}
                    width={62}
                  />
                  <Tooltip formatter={tooltipFormatter} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    name="Rezervasyon Hacmi"
                    dataKey="rezervasyonHacmi"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={19}
                  />
                  <Bar
                    name="Ön Ödeme"
                    dataKey="onOdeme"
                    fill="#0ea5e9"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={19}
                  />
                  <Bar
                    name="Acente Komisyonu"
                    dataKey="komisyon"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={19}
                  />
                  <Bar
                    name="Ev Sahibi Hakedişi"
                    dataKey="evSahibiHakedis"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={19}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        <p className="mt-3 text-xs leading-5 text-slate-400">
          Ön ödeme ve komisyon tutarları rezervasyon kayıtlarından alınır;
          gerçek tahsilat ya da transfer bilgisi değildir. Hacim ve hakediş
          konaklama bedeli bazındadır; temizlik ve depozito hariçtir.
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Rezervasyon Muhasebesi
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {totalCount} onaylanmış rezervasyon
            </p>
          </div>
          <select
            aria-label="Sayfa başına kayıt"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} kayıt
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 size={28} className="animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold text-slate-500">
                    <th className="px-5 py-4">Rezervasyon</th>
                    <th className="px-4 py-4">Müşteri</th>
                    <th className="px-4 py-4">Giriş / Çıkış</th>
                    <th className="px-4 py-4 text-right">Konaklama Ücreti</th>
                    <th className="px-4 py-4 text-right">Temizlik Ücreti</th>
                    <th className="px-4 py-4 text-right">Toplam Fiyat</th>
                    <th className="px-4 py-4 text-right">Ön Ödeme</th>
                    <th className="px-4 py-4 text-right">Komisyon</th>
                    <th className="px-4 py-4 text-right">Ev Sahibi Hakedişi</th>
                    <th className="px-5 py-4 text-right">Acente Borcu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rezervasyonlar.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {r.emlakAdi || `Emlak #${r.emlakId}`}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Rezervasyon #{r.id}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {r.musteriAd} {r.musteriSoyad}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {dateText(r.girisTarihi)} – {dateText(r.cikisTarihi)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-800">
                        {money(r.toplamFiyat)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-800">
                        {money(r.temizlikUcreti)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-800">
                        {money(r.toplamFiyat + r.temizlikUcreti)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-600">
                        {money(r.onOdemeTutari)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-emerald-700">
                        {money(r.komisyonTutari)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-700">
                        {money(r.emlakSahibiHakedis)}
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-slate-700">
                        {money(r.acenteninBorcu)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rezervasyonlar.length === 0 && (
                <div className="px-6 py-16 text-center text-sm text-slate-500">
                  Bu dönem ve emlak için onaylı rezervasyon bulunamadı.
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-5 py-4">
              <p className="text-xs text-slate-500">
                Toplam {totalCount} kayıttan{" "}
                {totalCount ? (page - 1) * pageSize + 1 : 0}–
                {Math.min(page * pageSize, totalCount)} arası
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Önceki sayfa"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs font-semibold text-slate-600">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  aria-label="Sonraki sayfa"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
