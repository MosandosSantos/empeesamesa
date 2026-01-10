"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  UserCog,
  ClipboardCheck,
  DollarSign,
  TrendingUp,
  Package,
  Building2,
  Landmark,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  canAccessFinance,
  canAccessPresence,
  isLojaAdmin,
  isSecretaria,
  isTesouraria,
  isSaasAdmin,
} from "@/lib/roles";

type NavigationSubItem = {
  label: string;
  href: string;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  subItems?: NavigationSubItem[];
};

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    label: "Prefeituras",
    href: "/potencias",
    icon: Landmark,
  },
  {
    label: "Lojas",
    href: "/admin/lojas",
    icon: Building2,
  },
  {
    label: "Membros",
    href: "/membros",
    icon: Users,
  },
  {
    label: "Presença",
    href: "/presenca",
    icon: ClipboardCheck,
  },
  {
    label: "Pagamentos",
    href: "/pagamentos",
    icon: DollarSign,
  },
  {
    label: "Financeiro",
    href: "/financeiro",
    icon: TrendingUp,
  },
  {
    label: "Inventário",
    href: "/inventario",
    icon: Package,
  },
   {
    label: "Usuários",
    href: "/usuarios",
    icon: UserCog,
    subItems: [
      {
        label: "Gerenciar Usuários",
        href: "/usuarios",
      },
      {
        label: "Trocar Senha",
        href: "/senha",
      },
    ],
  },
 
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ isOpen = true, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const [role, setRole] = React.useState<string | null>(null);
  const [tenantName, setTenantName] = React.useState<string>("");

  React.useEffect(() => {
    let mounted = true;
    const loadRole = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) return;
        const data = await response.json();
        if (mounted) {
          setRole(data?.user?.role ?? null);
          setTenantName(data?.user?.tenantName ?? "");
        }
      } catch {
        // ignore
      }
    };

    loadRole();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleItems = React.useMemo(() => {
    return navigationItems.filter((item) => {
      if (!role) return true;
      if (item.href === "/presenca" && !canAccessPresence(role)) return false;
      if ((item.href === "/pagamentos" || item.href === "/financeiro") && !canAccessFinance(role)) {
        return false;
      }
      if (
        item.href === "/potencias" &&
        (isLojaAdmin(role) || isTesouraria(role) || isSecretaria(role))
      ) {
        return false;
      }
      return true;
    });
  }, [role]);

  const toggleExpand = (itemLabel: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemLabel)
        ? prev.filter((label) => label !== itemLabel)
        : [...prev, itemLabel]
    );
  };

  const tenantLabel = isSaasAdmin(role) ? "EsferaDataSci" : tenantName?.trim() || "SAL GOISC";
  const tenantShort =
    tenantLabel
      .split(" ")
      .filter((word) => word.length > 0)
      .map((word) => word[0].toUpperCase())
      .join("")
      .slice(0, 2) || "SG";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        "flex flex-col",
        isCollapsed ? "w-16" : "w-64",
        !isOpen && "-translate-x-full",
        "lg:translate-x-0"
      )}
    >
      {/* Logo/Header */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border transition-all duration-300",
          isCollapsed ? "justify-center px-2" : "justify-between px-6"
        )}
      >
        <Link href="/" className="flex items-center" onClick={onClose}>
          {isCollapsed ? (
            <span
              className="text-sm font-semibold uppercase tracking-[0.3em] text-sidebar-foreground"
              title={tenantLabel}
            >
              {tenantShort}
            </span>
          ) : (
            <div className="flex flex-col">
              <span className="text-[0.55rem] uppercase tracking-[0.3em] text-sidebar-foreground/70">
                Loja
              </span>
              <span
                className="max-w-[130px] truncate text-sm font-semibold text-sidebar-foreground"
                title={tenantLabel}
              >
                {tenantLabel}
              </span>
            </div>
          )}
        </Link>

        {/* Toggle Button - Desktop only */}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className={cn(
              "hidden lg:flex h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              isCollapsed && "absolute right-2"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 overflow-y-auto py-4 transition-all duration-300",
        isCollapsed ? "px-2" : "px-3"
      )}>
        <TooltipProvider delayDuration={0}>
          <ul className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const hasSubItems = Boolean(item.subItems?.length);
              const isExpanded = expandedItems.includes(item.label);
              const isSubItemActive = hasSubItems && item.subItems?.some((sub) => pathname === sub.href);

              // Se tem subitens e não está colapsado, mostra botão expansível
              if (hasSubItems && !isCollapsed) {
                return (
                  <li key={item.label}>
                    <div>
                      <button
                        onClick={() => toggleExpand(item.label)}
                        className={cn(
                          "w-full flex items-center justify-between rounded-lg text-sm font-medium transition-colors",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          "gap-3 px-3 py-2.5",
                          isSubItemActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/80"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>
                      {isExpanded && (
                        <ul className="ml-9 mt-1 space-y-1">
                          {item.subItems?.map((subItem) => (
                            <li key={subItem.href}>
                              <Link
                                href={subItem.href}
                                onClick={onClose}
                                className={cn(
                                  "block rounded-lg px-3 py-2 text-sm transition-colors",
                                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                  pathname === subItem.href
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "text-sidebar-foreground/70"
                                )}
                              >
                                {subItem.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                );
              }

              // Item normal (sem subitens ou colapsado)
              const linkContent = (
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isCollapsed ? "justify-center px-3 py-2.5" : "gap-3 px-3 py-2.5",
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "text-sidebar-foreground/80"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );

              return (
                <li key={item.href}>
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}
          </ul>
        </TooltipProvider>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-lg bg-sidebar-accent p-3">
            <p className="text-xs font-medium text-sidebar-accent-foreground">
              Sistema de Gestão
            </p>
            <p className="text-xs text-sidebar-accent-foreground/60">
              Versão 0.1.0
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}


