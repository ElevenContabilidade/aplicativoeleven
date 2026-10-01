"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Check } from "lucide-react";
import { EleveMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type SessaoStatus = "checking" | "ready" | "invalid";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [sessaoStatus, setSessaoStatus] = useState<SessaoStatus>("checking");

  // O próprio createClient (createBrowserClient) já detecta o access_token
  // que vem no link do e-mail (#access_token=...&type=recovery) e autentica
  // essa sessão temporária de recuperação assim que a página carrega.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setSessaoStatus((cur) => (cur === "checking" ? (data.session ? "ready" : "invalid") : cur));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setSessaoStatus("ready");
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setError("As senhas não são iguais.");
      return;
    }
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password: senha });
    if (updateError) {
      setLoading(false);
      setError("Não foi possível salvar a senha nova. Peça um novo link de redefinição e tente de novo.");
      return;
    }
    await supabase.auth.signOut();
    setLoading(false);
    setPronto(true);
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
          {pronto ? (
            <div className="text-center">
              <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-status-success-bg text-status-success">
                <Check className="size-5" />
              </div>
              <h2 className="font-display text-lg font-semibold text-sand-900">Senha redefinida</h2>
              <p className="mt-1 text-xs text-sand-500">Já pode entrar com a senha nova.</p>
              <Button className="mt-5 w-full" size="lg" onClick={() => router.push("/login")}>
                Ir para o login
              </Button>
            </div>
          ) : sessaoStatus === "invalid" ? (
            <div className="text-center">
              <h2 className="font-display text-lg font-semibold text-sand-900">Link inválido ou expirado</h2>
              <p className="mt-1 text-xs text-sand-500">Peça um novo link de redefinição na tela de login.</p>
              <Button className="mt-5 w-full" size="lg" variant="outline" onClick={() => router.push("/login")}>
                Voltar para o login
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-1 text-center">
                <h2 className="font-display text-lg font-semibold text-sand-900">Nova senha</h2>
                <p className="mt-1 text-xs text-sand-500">Escolha uma nova senha pra sua conta.</p>
              </div>
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="senha">Nova senha</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
                    <Input
                      id="senha"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-9 pr-9"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
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

                <div className="space-y-1.5">
                  <Label htmlFor="confirmar">Confirmar nova senha</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
                    <Input
                      id="confirmar"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-9"
                      value={confirmar}
                      onChange={(e) => setConfirmar(e.target.value)}
                    />
                  </div>
                </div>

                {error && <p className="text-xs font-medium text-status-danger">{error}</p>}

                <Button type="submit" className="w-full" size="lg" disabled={loading || sessaoStatus === "checking"}>
                  {loading ? "Salvando..." : "Salvar nova senha"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
