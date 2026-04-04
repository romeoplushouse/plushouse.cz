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
    <div className="min-h-screen flex bg-[#0f1117]">
      {/* Left Brand Panel */}
      <div
        className="hidden lg:flex lg:w-[60%] relative overflow-hidden flex-col items-center justify-center px-16"
        style={{ background: "linear-gradient(135deg, #0a0c10 0%, #1a1d24 100%)" }}
      >
        {/* Animated dot grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(181, 225, 38, 0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Decorative glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-[0.08]"
          style={{ background: "radial-gradient(circle, #B5E126, transparent 70%)" }}
        />
        <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #B5E126, transparent 70%)" }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-lg text-center">
          {/* Logo text */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold tracking-tight text-[#B5E126]">
              PLUS HOUSE
            </h1>
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-[#B5E126]/10 border border-[#B5E126]/20">
              <span className="text-xs font-semibold text-[#B5E126] tracking-widest uppercase">ERP System</span>
            </div>
          </div>

          <p className="text-gray-400 text-lg mb-16">
            Kompletní řízení vaší firmy
          </p>

          {/* Feature bullets - glassmorphism */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-left">
            {features.map((f) => (
              <div key={f.label} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.05] transition-all hover:bg-white/[0.06] hover:border-[#B5E126]/10">
                <div className="mt-0.5 w-9 h-9 rounded-lg bg-[#B5E126]/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4.5 h-4.5 text-[#B5E126]" />
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
      <div className="w-full lg:w-[40%] bg-[#0f1117] flex flex-col items-center justify-center px-6 sm:px-12 py-12 relative">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-[#B5E126] mb-1">
            PLUS HOUSE
          </h2>
          <span className="text-xs font-semibold text-gray-500 tracking-widest uppercase">ERP System</span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-100 mb-1">Přihlášení</h2>
          <p className="text-gray-500 text-sm mb-8">Zadejte své přístupové údaje</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
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
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Heslo
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none"
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
                className="w-4 h-4 rounded border-[#2a2d35] bg-[#1a1d24] text-[#B5E126] focus:ring-[#B5E126]/30 cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-gray-400 select-none cursor-pointer">
                Zapamatovat si mě
              </label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-sm font-bold shadow-lg shadow-[#B5E126]/20 hover:shadow-[#B5E126]/30"
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
        <p className="absolute bottom-6 text-xs text-gray-600 select-none">
          PlusHouse ERP v0.1.0
        </p>
      </div>
    </div>
  );
}
