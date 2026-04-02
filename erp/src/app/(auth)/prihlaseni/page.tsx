"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff, Loader2, BarChart3, FileText, Briefcase, MapPin } from "lucide-react";

const features = [
  { icon: BarChart3, label: "Účetnictví", desc: "Přehledné vedení účetnictví" },
  { icon: FileText, label: "Fakturace", desc: "Rychlé vystavení faktur" },
  { icon: Briefcase, label: "Zakázky", desc: "Správa a sledování zakázek" },
  { icon: MapPin, label: "GPS sledování", desc: "Monitoring vozového parku" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { signIn } = await import("next-auth/react");
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Nesprávný email nebo heslo");
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("Chyba při přihlašování");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Brand Panel */}
      <div
        className="hidden lg:flex lg:w-[60%] relative overflow-hidden flex-col items-center justify-center px-16"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}
      >
        {/* Decorative grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }}
        />
        <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-lg text-center">
          {/* Logo monogram */}
          <div className="mx-auto mb-8 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" }}
          >
            <span className="text-white text-4xl font-bold tracking-tight">PH</span>
          </div>

          <h1 className="text-white text-4xl font-bold tracking-tight mb-3">
            PlusHouse ERP
          </h1>
          <p className="text-gray-400 text-lg mb-16">
            Kompletní řízení vaší firmy
          </p>

          {/* Feature bullets */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-left">
            {features.map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <div className="mt-0.5 w-9 h-9 rounded-lg bg-white/[0.07] flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4.5 h-4.5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{f.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-[40%] bg-white flex flex-col items-center justify-center px-6 sm:px-12 py-12 relative">
        {/* Mobile logo — shown only when left panel is hidden */}
        <div className="lg:hidden mb-10 flex flex-col items-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg mb-4"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" }}
          >
            <span className="text-white text-2xl font-bold">PH</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">PlusHouse ERP</h2>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Přihlášení</h2>
          <p className="text-gray-500 text-sm mb-8">Zadejte své přístupové údaje</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vas@email.cz"
                  required
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Heslo
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-gray-600 select-none cursor-pointer">
                Zapamatovat si mě
              </label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              style={{ background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Přihlašování...
                </>
              ) : (
                "Přihlásit se"
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="absolute bottom-6 text-xs text-gray-400 select-none">
          PlusHouse ERP v0.1.0
        </p>
      </div>
    </div>
  );
}
