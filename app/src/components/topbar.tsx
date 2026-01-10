"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TopBarProps {
  onMenuClick: () => void;
}

interface UserData {
  name: string;
  email: string;
  avatar?: string;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserData>({
    name: "Admin",
    email: "admin@esferaordo.com",
    avatar: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser({
            name: data.user.name ?? data.user.email,
            email: data.user.email,
            avatar: "",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    router.push("/logout");
  };

  return (
    <header className="sticky top-0 z-30 bg-background px-4 lg:px-6">
      <div className="relative flex h-16 items-center justify-between gap-4 border-b border-border bg-background/90 px-2 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center text-center leading-none text-rer-green">
            <div className="flex items-center gap-4">
              <Image
                src="/img/logo.svg"
                alt="SAL do GOISC"
                width={40}
                height={40}
                priority
                className="h-10 w-10"
              />
              <span className="text-3xl font-[var(--font-brand)] font-extrabold tracking-tight">
                SAL da MESA
              </span>
            </div>
            <span className="text-xs uppercase tracking-[0.5em] text-rer-green/80">
              (Sistema de Administração de Lojas)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                  3
                </span>
                <span className="sr-only">Notificações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <p className="text-sm font-medium">Nova mensalidade vencida</p>
                  <p className="text-xs text-muted-foreground">
                    João Silva - Mensalidade de dezembro
                  </p>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <p className="text-sm font-medium">Reunião agendada</p>
                  <p className="text-xs text-muted-foreground">
                    Próxima sessão em 20/12/2025
                  </p>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <p className="text-sm font-medium">Estoque baixo</p>
                  <p className="text-xs text-muted-foreground">
                    Velas - apenas 5 unidades restantes
                  </p>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-sm text-primary">
                Ver todas as notificações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start text-left md:flex">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
