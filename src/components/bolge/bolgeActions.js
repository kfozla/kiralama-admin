"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Ellipsis, FolderPlus, Pencil, Trash2 } from "lucide-react";

export default function BolgeActions({ bolge, onAddChild, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);

  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 190;
    const menuHeight = 148;

    setPosition({
      top:
        window.innerHeight - rect.bottom >= menuHeight + 6
          ? rect.bottom + 6
          : Math.max(8, rect.top - menuHeight - 6),
      left: Math.max(
        8,
        Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
      ),
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

  const runAction = (callback) => {
    setOpen(false);
    callback(bolge);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setPosition(null);
          setOpen((current) => !current);
        }}
        aria-label={`${bolge.ad} işlemleri`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
          open
            ? "bg-blue-50 text-blue-600"
            : "text-slate-500 hover:bg-slate-100"
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
              width: 190,
              zIndex: 9999,
            }}
            className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/15"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => runAction(onAddChild)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <FolderPlus size={16} />
              Alt Bölge Ekle
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => runAction(onEdit)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <Pencil size={16} />
              Düzenle
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              role="menuitem"
              onClick={() => runAction(onDelete)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
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
