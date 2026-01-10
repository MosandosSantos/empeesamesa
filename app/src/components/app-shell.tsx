"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = window.localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem("sidebar-collapsed", String(newValue));
      return newValue;
    });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="relative min-h-screen">
      {/* Desktop Sidebar - Always visible on lg+ */}
      <div className="hidden lg:block">
        <Sidebar isOpen={true} isCollapsed={isCollapsed} onToggleCollapse={toggleSidebar} />
      </div>

      {/* Mobile Sidebar - Sheet/Drawer */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu de Navegação</SheetTitle>
            <SheetDescription>
              Navegue pelas diferentes seções do sistema SAL GOISC
            </SheetDescription>
          </SheetHeader>
          <Sidebar isOpen={true} onClose={closeMobileMenu} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className={cn(
        "flex min-h-screen flex-col transition-[padding] duration-300",
        isCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        {/* Top Bar */}
        <TopBar onMenuClick={toggleMobileMenu} />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-secondary/30 py-6">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-5 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rer-green">
                    SAL GOISC
                  </p>
                  <p className="text-base font-semibold text-foreground">
                    {"Sistemas de Administra\u00e7\u00e3o de Lojas"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} Todos os direitos
                    reservados.
                  </p>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <a
                    className="font-semibold text-rer-gold transition-colors hover:text-rer-green"
                    href="https://mosansantos.netlify.app/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {"Desenvolvido por EsferaDataSci. Respons\u00e1vel Mos\u00e1n dos Santos."}
                  </a>
                  <a
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    href="https://wa.me/5521999417097"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Fale no WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
