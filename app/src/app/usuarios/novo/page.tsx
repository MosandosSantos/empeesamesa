"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Loja {
  id: string;
  lojaMX: string;
  numero: number | null;
}

const ROLES = [
  { value: "MEMBER", label: "Membro" },
  { value: "FINANCE", label: "Financeiro" },
  { value: "SECRETARY", label: "Secretário" },
  { value: "LODGE_ADMIN", label: "Administrador da Loja" },
  { value: "SYS_ADMIN", label: "Administrador do Sistema" },
];

export default function NovoUsuarioPage() {
  const router = useRouter();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLojas, setLoadingLojas] = useState(true);

  const [formData, setFormData] = useState({
    email: "",
    lojaId: "",
    role: "MEMBER",
  });

  useEffect(() => {
    loadLojas();
  }, []);

  async function loadLojas() {
    try {
      setLoadingLojas(true);
      const res = await fetch("/api/lojas");
      if (!res.ok) {
        throw new Error("Erro ao carregar lojas");
      }
      const data = await res.json();
      setLojas(data.lojas || []); // API retorna { lojas: [...] }
    } catch (error) {
      console.error("Erro ao carregar lojas:", error);
      alert("Erro ao carregar lojas");
      setLojas([]); // Garantir que seja array vazio em caso de erro
    } finally {
      setLoadingLojas(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.email || !formData.lojaId) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao criar usuário");
      }

      alert("Usuário criado e convite enviado com sucesso! Verifique o console.");
      router.push("/usuarios");
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      alert(error.message || "Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  }

  if (loadingLojas) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/usuarios">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Usuário</h1>
          <p className="text-muted-foreground">
            Criar novo usuário e enviar convite por email
          </p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="usuario@exemplo.com"
              required
            />
            <p className="text-sm text-muted-foreground">
              Um convite será enviado para este email
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lojaId">
              Loja <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.lojaId}
              onValueChange={(value) => setFormData({ ...formData, lojaId: value })}
            >
              <SelectTrigger id="lojaId">
                <SelectValue placeholder="Selecione uma loja" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(lojas) && lojas.length > 0 ? (
                  lojas.map((loja) => (
                    <SelectItem key={loja.id} value={loja.id}>
                      {loja.lojaMX}
                      {loja.numero && ` - Nº ${loja.numero}`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    Nenhuma loja disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              Perfil <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Define as permissões de acesso do usuário
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Criando..." : "Criar Usuário e Enviar Convite"}
          </Button>
          <Link href="/usuarios">
            <Button type="button" variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
