import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/app/components/auth-guard";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Goksoft | Yönetim Paneli",
  description: "Goksoft Villa Kiralama Yönetim Paneli",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            </div>
          }
        >
          <AuthGuard>{children}</AuthGuard>
        </Suspense>
      </body>
    </html>
  );
}
