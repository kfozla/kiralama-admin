"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MousePointer2,
  LockKeyhole,
  X,
} from "lucide-react";

import {
  WEEK_DAYS,
  getMonthDays,
  getMonthTitle,
  getSelectionRange,
  isSelectedDay,
  getBlockingEvent,
  getDailyPriceInfo,
  getEventStyle,
  formatPrice,
  todayISO,
  addDays,
} from "@/utils/emlakCalendar";

const LEGEND = [
  { label: "Müsait", color: "bg-emerald-500" },
  { label: "Bloke", color: "bg-red-500" },
];

function splitIntoWeeks(days) {
  const result = [];

  for (let i = 0; i < days.length; i += 7) {
    const week = days.slice(i, i + 7);

    while (week.length < 7) week.push(null);

    result.push(week);
  }

  return result;
}

function getWeekBlockSegments(week, events, lastVisibleDay) {
  return events
    .filter((event) => event.type === "block")
    .map((event) => {
      const indexes = week
        .map((day, index) =>
          day && event.start <= day && day < event.end ? index : -1,
        )
        .filter((index) => index !== -1);

      if (!indexes.length) return null;

      const first = indexes[0];
      const last = indexes[indexes.length - 1];
      const segmentLastDay = week[last];

      return {
        event,
        startColumn: first + 1,
        endColumn: last + 2,
        isBeginning: week[first] === event.start,
        showDelete:
          addDays(segmentLastDay, 1) >= event.end ||
          segmentLastDay === lastVisibleDay,
      };
    })
    .filter(Boolean);
}

export default function EmlakCalendar({
  year,
  month,
  events = [],
  priceRanges = [],
  canSelect = true,
  deleting = false,
  onMonthChange,
  onRangeSelect,
  onEventClick,
  onBlockDelete,
}) {
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [tapStart, setTapStart] = useState(null);

  const draggingRef = useRef(false);
  const startRef = useRef(null);
  const endRef = useRef(null);
  const tapStartRef = useRef(null);
  const suppressClickRef = useRef(false);

  const days = getMonthDays(year, month);
  const weeks = splitIntoWeeks(days);
  const lastVisibleDay = [...days].reverse().find(Boolean);
  const today = todayISO();

  const preview =
    dragStart && dragEnd
      ? getSelectionRange(dragStart, dragEnd)
      : tapStart
        ? getSelectionRange(tapStart, tapStart)
        : null;

  function resetSelection() {
    draggingRef.current = false;
    startRef.current = null;
    endRef.current = null;
    tapStartRef.current = null;

    setDragStart(null);
    setDragEnd(null);
    setTapStart(null);
  }

  function changeMonth(offset) {
    const next = new Date(Date.UTC(year, month - 1 + offset, 1));

    resetSelection();

    onMonthChange(next.getUTCFullYear(), next.getUTCMonth() + 1);
  }

  function goToday() {
    const [y, m] = today.split("-").map(Number);

    resetSelection();
    onMonthChange(y, m);
  }

  function isBlocked(day) {
    return Boolean(getBlockingEvent(day, events));
  }

  function finishDrag() {
    if (!draggingRef.current) return;

    const start = startRef.current;
    const end = endRef.current ?? start;

    resetSelection();
    suppressClickRef.current = true;

    if (start && end && canSelect) {
      onRangeSelect(getSelectionRange(start, end));
    }
  }

  useEffect(() => {
    const handleMouseUp = () => finishDrag();

    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  useEffect(() => {
    resetSelection();
  }, [year, month]);

  function handleMouseDown(event, day) {
    if (!canSelect || event.button !== 0 || isBlocked(day)) {
      return;
    }

    if (event.nativeEvent?.sourceCapabilities?.firesTouchEvents) {
      return;
    }

    event.preventDefault();

    tapStartRef.current = null;
    setTapStart(null);

    draggingRef.current = true;
    startRef.current = day;
    endRef.current = day;

    setDragStart(day);
    setDragEnd(day);
  }

  function handleMouseEnter(day) {
    if (!draggingRef.current) return;

    endRef.current = day;
    setDragEnd(day);
  }

  function handleTouchDay(day) {
    if (!canSelect || isBlocked(day)) return;

    const first = tapStartRef.current;

    if (!first) {
      tapStartRef.current = day;
      setTapStart(day);
      return;
    }

    tapStartRef.current = null;
    setTapStart(null);

    onRangeSelect(getSelectionRange(first, day));
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* HEADER */}
      <div className="space-y-5 border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <CalendarDays size={21} className="text-blue-600" />
              Müsaitlik Takvimi
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Boş günleri seçerek bloke oluşturun.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToday}
              className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Bugün
            </button>

            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Önceki ay"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ChevronLeft size={19} />
            </button>

            <div className="min-w-[130px] text-center text-sm font-bold capitalize text-slate-800">
              {getMonthTitle(year, month)}
            </div>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Sonraki ay"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ChevronRight size={19} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          {LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
              <span className="text-xs font-medium text-slate-600">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MousePointer2 size={15} />
          Mouse ile sürükleyin; mobilde başlangıç ve son geceyi seçin.
        </div>

        {tapStart && (
          <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
            Başlangıç seçildi. Şimdi son geceye dokunun.
            <button
              type="button"
              onClick={resetSelection}
              className="ml-3 font-semibold underline"
            >
              Vazgeç
            </button>
          </div>
        )}

        {!canSelect && (
          <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            Yeni bloke oluşturma şu anda kullanılamıyor.
          </p>
        )}
      </div>

      {/* TAKVİM */}
      <div className="p-3 sm:p-5">
        <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-[11px] font-bold uppercase text-slate-400"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          {weeks.map((week, weekIndex) => {
            const segments = getWeekBlockSegments(week, events, lastVisibleDay);

            return (
              <div
                key={weekIndex}
                className="relative grid grid-cols-7 gap-1.5 sm:gap-2"
              >
                {week.map((day, index) => {
                  if (!day) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="min-h-[105px] sm:min-h-[125px]"
                      />
                    );
                  }

                  const block = getBlockingEvent(day, events);

                  const style = getEventStyle(block);

                  const priceInfo = getDailyPriceInfo(day, priceRanges);

                  const selected = isSelectedDay(day, preview);

                  return (
                    <div
                      key={day}
                      onMouseDown={(event) => handleMouseDown(event, day)}
                      onMouseEnter={() => handleMouseEnter(day)}
                      onMouseUp={finishDrag}
                      onTouchEnd={(event) => {
                        if (event.target.closest("button")) {
                          return;
                        }

                        if (event.cancelable) {
                          event.preventDefault();
                        }

                        handleTouchDay(day);
                      }}
                      onContextMenu={(event) => event.preventDefault()}
                      className={`relative flex min-h-[105px] select-none flex-col rounded-xl border p-1.5 pb-10 transition sm:min-h-[125px] sm:p-3 sm:pb-10 ${
                        selected
                          ? "border-blue-400 bg-blue-100 ring-2 ring-blue-200"
                          : style.cell
                      } ${
                        canSelect && !block
                          ? "cursor-crosshair hover:border-blue-400"
                          : "cursor-default"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold sm:text-sm ${
                            day === today
                              ? "bg-blue-600 text-white"
                              : "text-slate-800"
                          }`}
                        >
                          {Number(day.slice(-2))}
                        </span>

                        <span
                          className={`h-2 w-2 rounded-full ${style.dot}`}
                          title={style.label}
                        />
                      </div>

                      {/* Gecelik fiyat */}
                      <div className="mt-3">
                        <span
                          className={`block text-[10px] font-bold sm:text-xs ${
                            priceInfo.conflict
                              ? "text-red-600"
                              : "text-slate-700"
                          }`}
                        >
                          {priceInfo.conflict
                            ? "Çakışma"
                            : formatPrice(priceInfo.price)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* BİRLEŞİK BLOKE ŞERİTLERİ */}
                <div className="pointer-events-none absolute inset-0 grid grid-cols-7 gap-1.5 sm:gap-2">
                  {segments.map((segment) => {
                    const automatic = segment.event.isReservationBlock;

                    return (
                      <div
                        key={`block-${segment.event.id}`}
                        style={{
                          gridColumn: `${segment.startColumn} / ${segment.endColumn}`,
                        }}
                        className="pointer-events-auto relative z-10 mb-1 flex h-7 self-end items-center justify-between gap-1 rounded-md bg-red-500 px-2 text-white shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => onEventClick(segment.event)}
                          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                          title={
                            automatic
                              ? "Rezervasyona bağlı bloke"
                              : segment.event.description || "Manuel bloke"
                          }
                        >
                          <LockKeyhole size={12} className="shrink-0" />

                          <span className="truncate text-[10px] font-semibold sm:text-xs">
                            {segment.isBeginning ? "Bloke" : "Bloke devamı"}
                          </span>
                        </button>

                        {/* Yalnızca manuel blokeler silinebilir */}
                        {segment.showDelete && !automatic && (
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => onBlockDelete(segment.event)}
                            aria-label="Blokeyi kaldır"
                            title="Manuel blokeyi kaldır"
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-red-700 text-white transition hover:bg-red-800 disabled:opacity-50"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
