"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Building2 } from "lucide-react";
import { EleveMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/auth-store";
import { useAppStore } from "@/lib/store/app-store";
import { createClient } from "@/lib/supabase/client";

type Tab = "equipe" | "cliente";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const clients = useAppStore((s) => s.clients);
  const [tab, setTab] = useState<Tab>("equipe");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Preencha e-mail e senha para continuar.");
      return;
    }
    setError("");
    if (tab === "equipe") {
      setLoading(true);
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (authError || !data.user) {
        setError("E-mail ou senha inválidos.");
        return;
      }
      login("equipe", data.user.email ?? email.trim(), data.user.id);
      router.push("/dashboard");
    } else {
      login("cliente", email, clientId);
      router.push("/portal");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-wine-950 px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(138,47,62,0.45) 0%, rgba(36,5,10,0) 70%), radial-gradient(50% 40% at 90% 100%, rgba(240,216,158,0.12) 0%, rgba(36,5,10,0) 70%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-cream-100 shadow-lg">
            <EleveMark className="size-9 text-wine-800" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-medium text-cream-50">
              eleven<span className="text-cream-300">.</span>
            </h1>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-cream-300/80">
              Contabilidade &amp; Consultoria
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-7">
          <div className="mb-1 text-center">
            <h2 className="font-display text-lg font-semibold text-sand-900">Eleven Hub</h2>
            <p className="mt-1 text-xs text-sand-500">Entre para acessar sua plataforma</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-sand-100 p-1">
            <button
              type="button"
              onClick={() => setTab("equipe")}
              className={`rounded-lg py-2 text-xs font-medium transition-colors ${
                tab === "equipe" ? "bg-white text-wine-800 shadow-sm" : "text-sand-500 hover:text-sand-700"
              }`}
            >
              Sou da equipe
            </button>
            <button
              type="button"
              onClick={() => setTab("cliente")}
              className={`rounded-lg py-2 text-xs font-medium transition-colors ${
                tab === "cliente" ? "bg-white text-wine-800 shadow-sm" : "text-sand-500 hover:text-sand-700"
              }`}
            >
              Sou cliente
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder={tab === "equipe" ? "seunome@eleven.com.br" : "seuemail@empresa.com.br"}
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>

            {tab === "cliente" && (
              <div className="space-y-1.5">
                <Label htmlFor="entity">Empresa (demo)</Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
                  <select
                    id="entity"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="h-9 w-full rounded-lg border border-sand-300 bg-white pl-9 pr-3 text-sm text-sand-900 outline-none focus:border-wine-500 focus:ring-2 focus:ring-wine-100"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.dados.nomeFantasia ?? c.dados.razaoSocial}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {error && <p className="text-xs font-medium text-status-danger">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-cream-200/60">Acesso restrito à equipe Eleven</p>
      </div>
    </div>
  );
}
