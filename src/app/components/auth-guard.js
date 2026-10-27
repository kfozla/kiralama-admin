"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import apiClient, { refreshAccessToken } from "@/app/lib/apiClient";

import { getAccessToken, clearAccessToken } from "@/app/lib/authToken";

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth, AuthGuard içinde kullanılmalı.");
  }

  return context;
}

export default function AuthGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/login";

  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;

    if (isLoginPage) {
      return () => {
        active = false;
      };
    }

    async function checkSession() {
      setChecking(true);

      try {
        // Yeni sekmede access token bellekte yoktur.
        if (!getAccessToken()) {
          await refreshAccessToken();
        }

        // Kimlik doğrulandıktan sonra kullanıcıyı getir.
        const { data } = await apiClient.get("/auth/me");

        if (!active) return;

        setUser(data);
        setAuthenticated(true);
      } catch (error) {
        if (!active) return;

        console.error("Oturum kontrolü başarısız:", error);

        clearAccessToken();
        setUser(null);
        setAuthenticated(false);

        router.replace("/login");
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return (
      <AuthContext.Provider value={{ user, authenticated, checking: false }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, authenticated, checking }}>
      {children}

      {!isLoginPage && (checking || !authenticated) && (
        <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-slate-50">
          <Loader2 size={30} className="animate-spin text-blue-600" />
        </div>
      )}
    </AuthContext.Provider>
  );
}
