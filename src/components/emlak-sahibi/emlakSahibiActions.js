"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Ellipsis, Eye, Pencil, Trash2 } from "lucide-react";

export default function EmlakSahibiActions({
  owner,
  onDetail,
  onEdit,
  onDelete,
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);

  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const width = 180;
    const height = 154;
    const gap = 6;

    setPosition({
      top:
        window.innerHeight - rect.bottom >= height + gap
          ? rect.bottom + gap
          : Math.max(8, rect.top - height - gap),
      left: Math.max(
        8,
        Math.min(rect.right - width, window.innerWidth - width - 8),
      ),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      if (
        !buttonRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    const handleScroll = () => setOpen(false);

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  const selectAction = (callback) => {
    setOpen(false);
    callback(owner);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`${owner.ad} ${owner.soyad} işlemleri`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          setPosition(null);
          setOpen((prev) => !prev);
        }}
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
              width: 180,
              zIndex: 9999,
            }}
            className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/15"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => selectAction(onDetail)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <Eye size={16} />
              Detay Görüntüle
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => selectAction(onEdit)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <Pencil size={16} />
              Düzenle
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              role="menuitem"
              onClick={() => selectAction(onDelete)}
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
