export const WEEK_DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export function datePart(value) {
  return value ? String(value).slice(0, 10) : null;
}

export function isoDate(year, month, day) {
  return [
    year,
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

export function addDays(dateString, amount) {
  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day + amount));

  return isoDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

export function todayISO() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date());

  const get = (type) => parts.find((part) => part.type === type)?.value;

  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function getMonthDays(year, month) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

  const mondayOffset = (firstDay + 6) % 7;

  return [
    ...Array(mondayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      isoDate(year, month, i + 1),
    ),
  ];
}

export function getMonthTitle(year, month) {
  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function formatCalendarDate(dateString) {
  if (!dateString) return "-";

  const [year, month, day] = datePart(dateString).split("-");

  return `${day}.${month}.${year}`;
}

export function formatPrice(price) {
  if (price == null || !Number.isFinite(Number(price))) {
    return "—";
  }

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(price));
}

// İki tarih aralığı [başlangıç, bitiş) biçimindedir.
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// Kullanıcı ilk ve son geceyi dahil seçer.
// API'ye gönderilen bitiş ertesi gündür.
export function getSelectionRange(firstDay, lastDay) {
  if (!firstDay || !lastDay) return null;

  const start = firstDay < lastDay ? firstDay : lastDay;
  const last = firstDay > lastDay ? firstDay : lastDay;

  return {
    start,
    lastDay: last,
    end: addDays(last, 1),
  };
}

export function isSelectedDay(day, selection) {
  return !!selection && selection.start <= day && day < selection.end;
}

export function normalizeCalendarEvents(blocks) {
  return blocks
    .map((item) => {
      const start = datePart(item.baslangicTarihi);
      const end = datePart(item.bitisTarihi);

      if (!start || !end || start >= end) return null;

      return {
        id: item.id,
        type: "block",
        start,
        end,
        title: "Bloke",
        description: item.aciklama ?? "",
        rezervasyonId: item.rezervasyonId ?? null,
        isReservationBlock: item.rezervasyonId != null,
        blocksAvailability: true,
        raw: item,
      };
    })
    .filter(Boolean);
}

export function getDayEvents(day, events) {
  return events.filter((event) => event.start <= day && day < event.end);
}

export function getBlockingEvent(day, events) {
  return (
    getDayEvents(day, events).find((event) => event.blocksAvailability) ?? null
  );
}

export function isBlockSelectionAvailable(selection, events) {
  if (!selection) return false;

  return !events.some(
    (event) =>
      event.blocksAvailability &&
      rangesOverlap(selection.start, selection.end, event.start, event.end),
  );
}

export function normalizePriceRanges(prices) {
  return prices
    .map((item) => {
      const start = datePart(item.baslangicTarihi);
      const end = datePart(item.bitisTarihi);
      const price = Number(item.gecelikFiyat);

      if (
        !start ||
        !end ||
        start >= end ||
        item.gecelikFiyat == null ||
        !Number.isFinite(price)
      ) {
        return null;
      }

      return {
        id: item.id,
        start,
        end,
        price,
        raw: item,
      };
    })
    .filter(Boolean);
}

// Bir tarihe sıfır, bir veya birden fazla fiyat düşebilir.
export function getDailyPriceInfo(day, priceRanges) {
  const matches = priceRanges.filter(
    (item) => item.start <= day && day < item.end,
  );

  if (matches.length === 0) {
    return { price: null, conflict: false, range: null };
  }

  if (matches.length > 1) {
    return { price: null, conflict: true, range: null };
  }

  return {
    price: matches[0].price,
    conflict: false,
    range: matches[0],
  };
}

export function hasPriceOverlap(selection, ranges) {
  if (!selection) return false;

  return ranges.some((range) =>
    rangesOverlap(selection.start, selection.end, range.start, range.end),
  );
}

export function getEventStyle(event) {
  // Bloke olmayan günler: YEŞİL
  if (!event) {
    return {
      cell: "bg-emerald-50 border-emerald-200",
      dot: "bg-emerald-500",
      label: "Müsait",
    };
  }

  // Blokeli günler: KIRMIZI
  if (event.type === "block") {
    return {
      cell: "bg-red-50 border-red-200",
      dot: "bg-red-500",
      label: "Bloke",
    };
  }

  return {
    cell: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
    label: "Müsait",
  };
}
