"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Ellipsis, Eye, Pencil, Trash2 } from "lucide-react";

export default function EmlakActions({ emlak, onDelete }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);

  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();

    const menuWidth = 180;
    const menuHeight = 150;
    const gap = 6;
    const padding = 8;

    const top =
      window.innerHeight - rect.bottom >= menuHeight + gap
        ? rect.bottom + gap
        : rect.top - menuHeight - gap;

    const left = Math.max(
      padding,
      Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - padding),
    );

    setPosition({
      top: Math.max(padding, top),
      left,
    });
  };

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
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
    const handleResize = () => setOpen(false);

    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);

      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  return (
    <>
      {/* Üç nokta butonu */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`${emlak.emlakAdi} işlemleri`}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
          open
            ? "bg-blue-50 text-blue-600"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Ellipsis size={20} />
      </button>

      {/* Portal Dropdown */}
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
              width: 180,
              zIndex: 9999,
            }}
            className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/15"
          >
            <Link
              href={`/emlaklar/${emlak.id}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <Eye size={16} />
              Detay Görüntüle
            </Link>

            <Link
              href={`/emlaklar/${emlak.id}/duzenle`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil size={16} />
              Düzenle
            </Link>

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDelete(emlak);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
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
