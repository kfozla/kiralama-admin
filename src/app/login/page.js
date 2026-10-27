"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";

import { loginUser } from "@/app/services/auth.service";
import { setAccessToken, clearAccessToken } from "@/app/lib/authToken";

import {
  UserRound,
  LockKeyhole,
  Eye,
  EyeOff,
  Loader2,
  House,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema } from "@/schemas/auth.schema";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const [year, setYear] = useState(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const {
    register,

    handleSubmit,

    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      username: "",

      password: "",
    },

    mode: "onTouched",
  });

  const onSubmit = async (data) => {
    setError("");

    try {
      // Backend accessToken'i JSON ile, refresh token'i HttpOnly cookie ile döndürmeli.
      const response = await loginUser({
        username: data.username.trim(),
        password: data.password,
      });

      if (!response?.accessToken) {
        throw new Error("Access token alınamadı.");
      }

      // Token yalnızca bu sekmenin belleğinde saklanır.
      // Yeni sekmeler refresh cookie üzerinden yeniden access token alır.
      setAccessToken(response.accessToken);

      router.replace("/dashboard");
    } catch (err) {
      clearAccessToken();

      const message = err.response?.data?.message;
      setError(
        typeof message === "string"
          ? message
          : err.response?.status === 401
            ? "Kullanıcı adı veya şifre hatalı."
            : err.message || "Giriş işlemi başarısız.",
      );
    }
  };

  return (
    <main className="flex min-h-screen bg-white">
      {/* SOL PANEL - VILLA GORSELI */}

      <section className="relative hidden min-h-screen w-[54%] overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between ">
        {/* Background Image */}

        <div
          className="absolute inset-0 bg-cover bg-center "
          style={{
            backgroundImage: "url('/images/login-villa.jpg')",
          }}
        />

        {/* Gradient Overlay */}

        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-900/20 to-slate-950/90 " />

        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[2] hidden w-64 lg:block"
          style={{
            clipPath: "polygon(85% 0, 200% 0, 100% 100%, 0 100%)",

            background: "white",
          }}
        />

        {/* Top Branding */}

        <div className="relative z-10 flex items-center gap-3 px-12 pt-12 xl:px-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-white backdrop-blur-md">
            <House size={25} strokeWidth={1.8} />
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-wide text-white">
              Göksoft
            </h2>

            <p className="text-xs tracking-[0.18em] text-white/65 uppercase">
              Emlak Yönetim Paneli
            </p>
          </div>
        </div>

        {/* Bottom Hero Text */}

        <div className="relative z-10 max-w-2xl px-12 pb-16 xl:px-16">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Profesyonel Kiralama Yönetimi
          </div>

          <h1 className="max-w-xl text-4xl leading-[1.15] font-semibold tracking-tight text-white xl:text-5xl 2xl:text-6xl">
            Her şey
            <br />
            tek bir panelde.
          </h1>

          <p className="mt-6 max-w-lg text-base leading-8 text-white/75 xl:text-lg">
            Villalarınızı, rezervasyonlarınızı ve misafirlerinizi tek bir yerden
            kolayca yönetin.
          </p>

          <div className="mt-10 h-px w-full bg-white/20" />

          <div className="mt-6 flex items-center gap-3 text-sm text-white/75">
            <ShieldCheck size={19} className="text-emerald-300" />
            Güvenli ve merkezi yönetim sistemi
          </div>
        </div>
      </section>

      {/* SAG PANEL - LOGIN */}

      <section className="flex min-h-screen w-full flex-col bg-white lg:w-[46%]">
        {/* Mobile Brand */}

        <div className="flex items-center gap-3 px-6 pt-8 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <House size={21} />
          </div>

          <span className="font-semibold tracking-tight text-slate-900">
            Villa Management
          </span>
        </div>

        {/* Form Container */}

        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-12 xl:px-20">
          <div className="w-full max-w-[410px]">
            {/* Header */}

            <div className="mb-10 mx-auto text-center lg:mb-12">
              <div className="mb-6 hidden h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 lg:flex mx-auto">
                <LockKeyhole size={26} strokeWidth={1.8} />
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Tekrar hoş geldiniz.
              </h2>

              <p className="mt-3 text-[15px] leading-7 text-slate-500">
                Yönetim paneline erişmek için hesap bilgilerinizi girin.
              </p>
            </div>

            {/* Login Form */}

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-6"
            >
              {/* Username */}

              <div>
                <label
                  htmlFor="username"
                  className="mb-2.5 block text-sm font-semibold text-slate-700"
                >
                  Kullanıcı Adı
                </label>

                <div className="relative">
                  <UserRound
                    size={19}
                    className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="username"
                    type="text"
                    placeholder="Kullanıcı adınızı girin"
                    autoComplete="username"
                    aria-invalid={!!errors.username}
                    aria-describedby={
                      errors.username ? "username-error" : undefined
                    }
                    {...register("username")}
                    className={`h-[54px] w-full rounded-xl border bg-slate-50/70 pr-4 pl-12 text-[15px] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                      errors.username
                        ? "border-red-400 focus:border-red-400 focus:ring-red-50"
                        : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-50"
                    }`}
                  />
                </div>

                {errors.username && (
                  <p id="username-error" className="mt-2 text-sm text-red-500">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password */}

              <div>
                <label
                  htmlFor="password"
                  className="mb-2.5 block text-sm font-semibold text-slate-700"
                >
                  Şifre
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Şifrenizi girin"
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    {...register("password")}
                    className={`h-[54px] w-full rounded-xl border bg-slate-50/70 pr-12 pl-12 text-[15px] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                      errors.password
                        ? "border-red-400 focus:border-red-400 focus:ring-red-50"
                        : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-50"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Şifreyi gizle" : "Şifreyi göster"
                    }
                    aria-pressed={showPassword}
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>

                {errors.password && (
                  <p id="password-error" className="mt-2 text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* API Error */}

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                  {error}
                </div>
              )}

              {/* Submit Button */}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex h-[54px] w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/15 transition-all hover:bg-blue-700 hover:shadow-blue-600/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={19} className="animate-spin" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  <>
                    Giriş Yap
                    <ArrowRight
                      size={19}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Security Note */}

            <div className="mt-10 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-slate-500"
              />

              <p className="text-xs leading-5 text-slate-500">
                Bu alan yalnızca yetkili personelin kullanımına yöneliktir.
                Hesap bilgilerinizi kimseyle paylaşmayın.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}

        <footer className="px-6 pb-7 text-center text-xs text-slate-400">
          © {year} Göksoft. Tüm hakları saklıdır.
        </footer>
      </section>
    </main>
  );
}
