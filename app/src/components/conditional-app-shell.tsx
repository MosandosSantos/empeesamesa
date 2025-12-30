"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./app-shell";

interface ConditionalAppShellProps {
  children: React.ReactNode;
}

export function ConditionalAppShell({ children }: ConditionalAppShellProps) {
  const pathname = usePathname();

  // Rotas que não devem ter o AppShell (sidebar e topbar)
  const routesWithoutShell = ["/login", "/logout"];

  // Se a rota atual está na lista de rotas sem shell, renderizar apenas o children
  if (routesWithoutShell.includes(pathname)) {
    return <>{children}</>;
  }

  // Caso contrário, renderizar com AppShell
  return <AppShell>{children}</AppShell>;
}
