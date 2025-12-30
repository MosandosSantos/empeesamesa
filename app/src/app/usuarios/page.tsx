"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  lojaId: string | null;
  loja: {
    id: string;
    lojaMX: string;
    numero: number | null;
  } | null;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  SYS_ADMIN: "Administrador do Sistema",
  LODGE_ADMIN: "Administrador da Loja",
  SECRETARY: "Secretário",
  FINANCE: "Financeiro",
  MEMBER: "Membro",
};

const STATUS_LABELS: Record<string, string> = {
  INVITED: "Convidado",
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
};

const STATUS_COLORS: Record<string, string> = {
  INVITED: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-green-100 text-green-800",
  SUSPENDED: "bg-red-100 text-red-800",
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  async function loadUsers() {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      if (!res.ok) {
        throw new Error("Erro ao carregar usuários");
      }
      const data = await res.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      alert("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendInvite(userId: string, email: string) {
    if (!confirm(`Reenviar convite para ${email}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}/resend-invite`, {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao reenviar convite");
      }

      alert("Convite reenviado com sucesso! Verifique o console.");
      await loadUsers();
    } catch (error: any) {
      console.error("Erro ao reenviar convite:", error);
      alert(error.message || "Erro ao reenviar convite");
    }
  }

  async function handleDelete() {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao deletar usuário");
      }

      alert("Usuário deletado com sucesso");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      await loadUsers();
    } catch (error: any) {
      console.error("Erro ao deletar usuário:", error);
      alert(error.message || "Erro ao deletar usuário");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerenciar usuários e permissões do sistema
          </p>
        </div>
        <Link href="/usuarios/novo">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Loja</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {searchTerm
                    ? "Nenhum usuário encontrado com esse filtro"
                    : "Nenhum usuário cadastrado"}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    {user.loja ? (
                      <div>
                        <div className="font-medium">{user.loja.lojaMX}</div>
                        {user.loja.numero && (
                          <div className="text-sm text-muted-foreground">
                            Nº {user.loja.numero}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        STATUS_COLORS[user.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {STATUS_LABELS[user.status] || user.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {user.status === "INVITED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResendInvite(user.id, user.email)}
                          title="Reenviar convite"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      <Link href={`/usuarios/${user.id}`}>
                        <Button variant="ghost" size="sm" title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUserToDelete(user);
                          setDeleteDialogOpen(true);
                        }}
                        title="Deletar"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de confirmação de deleção */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o usuário{" "}
              <strong>{userToDelete?.email}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
