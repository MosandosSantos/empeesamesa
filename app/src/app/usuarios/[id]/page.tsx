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
import { use } from "react";

interface Loja {
  id: string;
  lojaMX: string;
  numero: number | null;
}

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  lojaId: string | null;
}

const ROLES = [
  { value: "MEMBER", label: "Membro" },
  { value: "FINANCE", label: "Financeiro" },
  { value: "SECRETARY", label: "Secretário" },
  { value: "LODGE_ADMIN", label: "Administrador da Loja" },
  { value: "SYS_ADMIN", label: "Administrador do Sistema" },
];

const STATUSES = [
  { value: "INVITED", label: "Convidado" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "SUSPENDED", label: "Suspenso" },
];

export default function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    email: "",
    lojaId: "",
    role: "MEMBER",
    status: "INVITED",
  });

  useEffect(() => {
    loadData();
  }, [resolvedParams.id]);

  async function loadData() {
    try {
      setLoadingData(true);

      // Carregar usuário
      const userRes = await fetch(`/api/users/${resolvedParams.id}`);
      if (!userRes.ok) {
        throw new Error("Erro ao carregar usuário");
      }
      const user: User = await userRes.json();

      // Carregar lojas
      const lojasRes = await fetch("/api/lojas");
      if (!lojasRes.ok) {
        throw new Error("Erro ao carregar lojas");
      }
      const lojasData = await lojasRes.json();

      setLojas(lojasData);
      setFormData({
        email: user.email,
        lojaId: user.lojaId || "",
        role: user.role,
        status: user.status,
      });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar dados");
      router.push("/usuarios");
    } finally {
      setLoadingData(false);
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
      const res = await fetch(`/api/users/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao atualizar usuário");
      }

      alert("Usuário atualizado com sucesso!");
      router.push("/usuarios");
    } catch (error: any) {
      console.error("Erro ao atualizar usuário:", error);
      alert(error.message || "Erro ao atualizar usuário");
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
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
          <h1 className="text-3xl font-bold tracking-tight">Editar Usuário</h1>
          <p className="text-muted-foreground">
            Atualizar informações e permissões do usuário
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
                {lojas.map((loja) => (
                  <SelectItem key={loja.id} value={loja.id}>
                    {loja.lojaMX}
                    {loja.numero && ` - Nº ${loja.numero}`}
                  </SelectItem>
                ))}
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

          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Usuários suspensos não podem fazer login
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
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
