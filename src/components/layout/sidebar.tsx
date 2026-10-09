"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  Home,
  Package,
  Layers,
  Users,
  Wrench,
  Shield,
  FileText,
  Settings,
  History,
  Store,
  Receipt,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const isAdmin = user.perfil === "Administrador";

  // Administrador: tudo. Vendedora: caixa, vendas, clientes, estoque e produtos.
  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard",
      show: true,
    },
    {
      title: "Caixa / PDV",
      icon: Store,
      href: "/ponto-venda",
      show: true,
    },
    {
      title: "Venda de Máquina",
      icon: Receipt,
      href: "/venda-maquina",
      show: true,
    },
    {
      title: "Produtos",
      icon: Package,
      href: "/produtos",
      show: true,
    },
    {
      title: "Estoque",
      icon: Layers,
      href: "/estoque",
      show: true, // vendedora precisa dar entrada quando chega mercadoria
    },
    {
      title: "Clientes",
      icon: Users,
      href: "/clientes",
      show: true,
    },
    {
      title: "Ordens de Serviço",
      icon: Wrench,
      href: "/os",
      show: true,
    },
    {
      title: "Garantias",
      icon: Shield,
      href: "/garantias",
      show: isAdmin,
    },
    {
      title: "Relatórios & BI",
      icon: FileText,
      href: "/relatorios",
      show: isAdmin,
    },
    {
      title: "Configurações",
      icon: Settings,
      href: "/configuracoes",
      show: isAdmin,
    },
    {
      title: "Logs de Auditoria",
      icon: History,
      href: "/logs",
      show: isAdmin,
    },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-16"
      )}
    >
      {/* Topo / Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow-md transition-transform hover:scale-105">
            W
          </div>
          {isOpen && (
            <span className="font-semibold text-lg tracking-tight whitespace-nowrap bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              West Máquinas
            </span>
          )}
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden md:flex h-6 w-6 items-center justify-center rounded-md border border-sidebar-border bg-sidebar hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shadow-sm transition-colors"
        >
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded">
        {menuItems
          .filter((item) => item.show)
          .map((item, idx) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={idx}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group relative",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-muted-foreground"
                )}
              >
                <item.icon
                  size={18}
                  className={cn(
                    "shrink-0 transition-transform group-hover:scale-110",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                  )}
                />
                {isOpen ? (
                  <span className="whitespace-nowrap transition-opacity duration-200">
                    {item.title}
                  </span>
                ) : (
                  <span className="absolute left-14 z-30 rounded-md bg-zinc-900 px-2 py-1 text-xs text-white opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">
                    {item.title}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>

      {/* Rodapé da Sidebar */}
      <div className="p-2 border-t border-sidebar-border bg-sidebar-accent/30 space-y-1">
        {/* Link para a Vitrine */}
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-muted-foreground transition-all group relative",
            !isOpen && "justify-center"
          )}
        >
          <Store size={18} className="shrink-0 group-hover:text-sidebar-accent-foreground" />
          {isOpen ? (
            <span className="whitespace-nowrap">Ver Vitrine Pública</span>
          ) : (
            <span className="absolute left-14 z-30 rounded-md bg-zinc-900 px-2 py-1 text-xs text-white opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">
              Ver Vitrine Pública
            </span>
          )}
        </Link>

        {/* Sair */}
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all group relative",
            !isOpen && "justify-center"
          )}
        >
          <LogOut size={18} className="shrink-0 group-hover:text-destructive" />
          {isOpen ? (
            <span className="whitespace-nowrap">Sair</span>
          ) : (
            <span className="absolute left-14 z-30 rounded-md bg-destructive px-2 py-1 text-xs text-white opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">
              Sair
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
