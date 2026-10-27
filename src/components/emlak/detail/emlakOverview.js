import {
  House,
  MapPin,
  UserRound,
  FileText,
  Info,
  Clock3,
  Wallet,
  CarFront,
  BadgeCheck,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  getAciklama,
  getEmlakTipiAdi,
  getYatakOdasi,
  getBanyoSayisi,
  formatValue,
} from "@/utils/emlakDetail";

import HtmlContent from "@/components/common/HtmlContent";

function Section({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Icon size={18} />
        </div>

        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>

      {children}
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {value === null || value === undefined || value === ""
          ? "Belirtilmemiş"
          : value}
      </p>
    </div>
  );
}

function formatTime(value) {
  if (!value) return "Belirtilmemiş";
  return String(value).slice(0, 5);
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") {
    return "Belirtilmemiş";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Belirtilmemiş";
  }

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount);
}

export default function EmlakOverview({ emlak, bolgeAdi, sahip }) {
  const ownerName = sahip
    ? `${sahip.ad ?? ""} ${sahip.soyad ?? ""}`.trim()
    : emlak.emlakSahibiId == null
      ? "Emlak sahibi seçilmedi"
      : "Emlak sahibi bilgisi alınamadı";

  return (
    <div className="space-y-5">
      {/* GENEL BİLGİLER */}
      <Section icon={House} title="Genel Bilgiler">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField
            label="Emlak Tipi"
            value={getEmlakTipiAdi(emlak.emlakTipi)}
          />

          <DetailField
            label="Kapasite"
            value={formatValue(emlak.kapasite, " Kişi")}
          />

          <DetailField label="Yatak Odası" value={getYatakOdasi(emlak)} />

          <DetailField label="Banyo" value={getBanyoSayisi(emlak)} />

          <DetailField
            label="Havuz Sayısı"
            value={emlak.havuzBilgileri?.length ?? 0}
          />

          <DetailField
            label="Otopark Kapasitesi"
            value={
              emlak.otoparkSayisi != null
                ? `${emlak.otoparkSayisi} Araç`
                : "Belirtilmemiş"
            }
          />

          <DetailField label="Emlak ID" value={`#${emlak.id}`} />
        </div>
      </Section>

      {/* BELGE VE YAYIN BİLGİLERİ */}
      <Section icon={BadgeCheck} title="Belge ve Yayın Bilgileri">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DetailField
            label="Turizm İzin Belge Numarası"
            value={emlak.belgeNo}
          />

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Yayın Durumu</p>

            <div className="mt-2">
              {emlak.yayinda === true ? (
                <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                  <Eye size={16} />
                  Yayında
                </span>
              ) : emlak.yayinda === false ? (
                <span className="inline-flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-700">
                  <EyeOff size={16} />
                  Yayında Değil
                </span>
              ) : (
                <span className="text-sm font-semibold text-slate-500">
                  Belirtilmemiş
                </span>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* KONAKLAMA KOŞULLARI */}
      <Section icon={Clock3} title="Konaklama Koşulları">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField
            label="Giriş Saati"
            value={formatTime(emlak.girisSaati)}
          />

          <DetailField
            label="Çıkış Saati"
            value={formatTime(emlak.cikisSaati)}
          />

          <DetailField
            label="Minimum Konaklama Süresi"
            value={
              emlak.minimumKonaklamaSuresi != null
                ? `${emlak.minimumKonaklamaSuresi} Gece`
                : "Belirtilmemiş"
            }
          />
        </div>
      </Section>

      {/* EK ÜCRETLER */}
      <Section icon={Wallet} title="Ek Ücretler">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField
            label="Hasar Depozitosu"
            value={formatMoney(emlak.hasarDepozitosu)}
          />

          <DetailField
            label="Temizlik Ücreti"
            value={formatMoney(emlak.temizlikUcreti)}
          />

          <DetailField
            label="Temizlik Ücreti Gece Sınırı"
            value={
              emlak.minimumKonaklamaTemizlik != null
                ? emlak.minimumKonaklamaTemizlik === 0
                  ? "Uygulanmıyor"
                  : `${emlak.minimumKonaklamaTemizlik} geceden az`
                : "Belirtilmemiş"
            }
          />
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          Hasar depozitosu, konaklama bedelinden ayrı değerlendirilen ve
          koşullara göre iade edilebilen güvence tutarıdır. Temizlik ücreti,
          belirlenen gece sınırının altındaki konaklamalarda uygulanır.
        </p>
      </Section>

      {/* BÖLGE */}
      <Section icon={MapPin} title="Bölge Bilgileri">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DetailField label="Bölge" value={bolgeAdi} />

          <DetailField label="Bölge ID" value={emlak.bolgeId} />
        </div>
      </Section>

      {/* EMLAK SAHİBİ */}
      <Section icon={UserRound} title="Emlak Sahibi">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DetailField label="Ad Soyad" value={ownerName} />

          <DetailField label="Telefon" value={sahip?.telefon} />

          {sahip?.email && <DetailField label="E-posta" value={sahip.email} />}
        </div>
      </Section>

      {/* AÇIKLAMA */}
      <Section icon={FileText} title="Açıklama">
        <HtmlContent
          html={getAciklama(emlak)}
          emptyText="Açıklama girilmemiş."
        />
      </Section>

      {/* GENEL BİLGİLER VE NOTLAR */}
      <Section icon={Info} title="Genel Bilgiler ve Notlar">
        <HtmlContent
          html={emlak.genelBilgiler}
          emptyText="Genel bilgi girilmemiş."
        />
      </Section>
    </div>
  );
}
