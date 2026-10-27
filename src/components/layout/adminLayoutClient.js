"use client";

// Mevcut (admin)/layout.js dosyandaki
// sidebar, header ve mobil menü kodlarını
// bu component içerisine taşı.

export default function AdminLayoutClient({ children }) {
  return (
    <div className="min-h-screen">
      {/* Mevcut sidebar ve header yapın */}
      {children}
    </div>
  );
}
