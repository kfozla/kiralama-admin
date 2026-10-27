import { MapPin, Navigation, ExternalLink, LocateFixed } from "lucide-react";

export default function EmlakLocation({ emlak, bolgeAdi }) {
  const lat = Number(emlak.latitude);
  const lng = Number(emlak.longitude);

  const hasCoordinates =
    emlak.latitude !== null &&
    emlak.latitude !== undefined &&
    emlak.latitude !== "" &&
    emlak.longitude !== null &&
    emlak.longitude !== undefined &&
    emlak.longitude !== "" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  const mapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${lat},${lng}`,
      )}`
    : null;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900">Konum Bilgileri</h3>

        <p className="mt-1 text-sm text-slate-500">
          Emlağın kayıtlı bölgesi ve coğrafi koordinatları
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <MapPin size={20} />
          </div>

          <div>
            <p className="text-xs text-slate-500">Kayıtlı Bölge</p>

            <p className="mt-1 text-sm font-bold text-slate-900">
              {bolgeAdi || "Bölge belirtilmemiş"}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Enlem (Latitude)</p>

            <p className="mt-2 font-mono text-sm font-semibold text-slate-800">
              {hasCoordinates ? lat : "Belirtilmemiş"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Boylam (Longitude)</p>

            <p className="mt-2 font-mono text-sm font-semibold text-slate-800">
              {hasCoordinates ? lng : "Belirtilmemiş"}
            </p>
          </div>
        </div>
      </div>

      {hasCoordinates ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LocateFixed size={22} className="text-blue-600" />

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Haritada Görüntüle
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Konumu Google Haritalar'da açabilirsiniz.
                </p>
              </div>
            </div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Navigation size={16} />
              Haritada Aç
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
          <MapPin size={26} className="mx-auto text-slate-300" />

          <p className="mt-3 text-sm text-slate-500">
            Bu emlak için geçerli koordinatlar girilmemiş.
          </p>
        </div>
      )}
    </div>
  );
}
