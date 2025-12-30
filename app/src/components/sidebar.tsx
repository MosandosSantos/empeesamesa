"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  UserCog,
  ClipboardCheck,
  DollarSign,
  TrendingUp,
  BookOpen,
  Package,
  HelpCircle,
  Mail,
  Building2,
  ChevronLeft,
  ChevronRight,
  Lock,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    label: "Lojas (SaaS)",
    href: "/admin/lojas",
    icon: Building2,
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

  const toggleExpand = (itemLabel: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemLabel)
        ? prev.filter((label) => label !== itemLabel)
        : [...prev, itemLabel]
    );
  };

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
      <div className={cn(
        "flex h-16 items-center border-b border-sidebar-border transition-all duration-300",
        isCollapsed ? "justify-center px-2" : "justify-between px-6"
      )}>
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          <Image
            src="/img/logo.svg"
            alt="EsferaOrdo"
            width={36}
            height={36}
            className="h-9 w-9 flex-shrink-0"
            priority
          />
          {!isCollapsed && (
            <span className="text-base font-semibold font-[var(--font-brand)]">
              <span className="text-rer-green">Esfera</span>
              <span className="text-rer-gold">Ordo</span>
            </span>
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
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const hasSubItems = 'subItems' in item && item.subItems && item.subItems.length > 0;
              const isExpanded = expandedItems.includes(item.label);
              const isSubItemActive = hasSubItems && item.subItems?.some((sub: any) => pathname === sub.href);

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
                          {item.subItems?.map((subItem: any) => (
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
