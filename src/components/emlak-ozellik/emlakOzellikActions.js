"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";

export default function EmlakOzellikActions({ feature, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);

  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();

    const width = 176;
    const height = 104;
    const gap = 6;

    const top =
      window.innerHeight - rect.bottom >= height + gap
        ? rect.bottom + gap
        : rect.top - height - gap;

    const left = Math.max(
      8,
      Math.min(rect.right - width, window.innerWidth - width - 8),
    );

    setPosition({
      top: Math.max(8, top),
      left,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event) => {
      if (
        !buttonRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    const handleScroll = () => setOpen(false);

    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  const handleAction = (callback) => {
    setOpen(false);
    callback(feature);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`${feature.ozellikAdi} işlemleri`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          setPosition(null);
          setOpen((prev) => !prev);
        }}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
          open
            ? "bg-blue-50 text-blue-600"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Ellipsis size={20} />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: 176,
              zIndex: 9999,
            }}
            className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/15"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction(onEdit)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Pencil size={16} />
              Düzenle
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction(onDelete)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
              Sil
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
