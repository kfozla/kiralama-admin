import { Suspense } from "react";
import AdminShell from "@/components/layout/adminShell";

// Add this export to bypass the check

export default function AdminLayout({ children }) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

function AdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-slate-500">Yönetim paneli yükleniyor...</p>
    </div>
  );
}
