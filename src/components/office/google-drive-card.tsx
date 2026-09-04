"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Cloud, CloudOff, Check, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";

interface Status {
  connected: boolean;
  email: string | null;
}

export function GoogleDriveCard() {
  const team = useAppStore((s) => s.team);
  const { userId } = useAuthStore();
  const isAdmin = team.find((m) => m.id === userId)?.perfil === "Administrador";
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<Status | null>(null);
  const [desconectando, setDesconectando] = useState(false);

  async function carregarStatus() {
    const res = await fetch("/api/integracoes/google-drive/status");
    setStatus(await res.json());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarStatus();
  }, []);

  async function desconectar() {
    if (!confirm("Desconectar o Google Drive do escritório? Documentos já enviados continuam lá, mas novos uploads vão parar de funcionar até reconectar.")) return;
    setDesconectando(true);
    await fetch("/api/integracoes/google-drive/disconnect", { method: "POST" });
    await carregarStatus();
    setDesconectando(false);
  }

  const resultado = searchParams.get("googleDrive");

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Integração com Google Drive</CardTitle>
        <p className="mt-1 text-xs text-sand-500">
          Documentos anexados em Documentos, Licenças e Certificados são salvos direto no Google Drive do escritório,
          organizados numa pasta por cliente.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {resultado === "conectado" && (
          <p className="flex items-center gap-1.5 text-xs text-status-success">
            <Check className="size-3.5" /> Google Drive conectado com sucesso.
          </p>
        )}
        {resultado === "erro" && (
          <p className="flex items-center gap-1.5 text-xs text-status-danger">
            <AlertTriangle className="size-3.5" /> Não foi possível conectar o Google Drive. Tenta de novo.
          </p>
        )}

        {status === null ? (
          <p className="text-xs text-sand-400">Verificando conexão...</p>
        ) : status.connected ? (
          <div className="flex items-center justify-between rounded-lg border border-sand-200 bg-sand-50 px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs text-sand-700">
              <Cloud className="size-4 text-status-success" />
              Conectado{status.email ? ` como ${status.email}` : ""}
            </div>
            {isAdmin && (
              <Button type="button" size="sm" variant="outline" onClick={desconectar} disabled={desconectando}>
                {desconectando ? "Desconectando..." : "Desconectar"}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-sand-300 bg-sand-50 px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs text-sand-500">
              <CloudOff className="size-4" /> Google Drive não conectado
            </div>
            {isAdmin ? (
              <a href="/api/integracoes/google-drive/connect" className={buttonVariants({ size: "sm" })}>
                Conectar Google Drive
              </a>
            ) : (
              <span className="text-[11px] text-sand-400">Só um Administrador pode conectar.</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
