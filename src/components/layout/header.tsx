"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Bell,
  Search,
  Menu,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Estoque Mínimo Atingido",
      message: "Bobina Industrial está abaixo do estoque mínimo.",
      type: "alert",
      time: "10 min atrás",
      read: false,
    },
    {
      id: 2,
      title: "Garantia Vencendo",
      message: "A garantia da máquina Singer do cliente João vence amanhã.",
      type: "warning",
      time: "2 horas atrás",
      read: false,
    },
    {
      id: 3,
      title: "Ordem de Serviço Pronta",
      message: "OS #105 (Overlock Lanmax) foi marcada como Pronta.",
      type: "success",
      time: "4 horas atrás",
      read: true,
    },
  ]);

  if (!user) return null;

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-border bg-card px-4 md:px-6 shadow-sm">
      {/* Botão Hambúrguer & Busca */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-input hover:bg-muted text-muted-foreground md:hidden transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Busca Global */}
        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Busca global em tempo real (clientes, produtos, OS...)"
            className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/75"
          />
        </div>
      </div>

      {/* Ações da Direita */}
      <div className="flex items-center gap-2">
        {/* Toggle de Tema */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 rounded-lg hover:bg-muted text-muted-foreground"
          title="Alternar Tema Claro/Escuro"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </Button>

        {/* Central de Notificações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg hover:bg-muted text-muted-foreground relative"
              title="Notificações"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-card animate-bounce">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg border border-border">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-muted/50">
              <span className="font-semibold text-sm">Alertas e Notificações</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "flex gap-3 p-3 transition-colors hover:bg-muted/30",
                    !notif.read && "bg-primary/5 dark:bg-primary/10"
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    {notif.type === "alert" && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    {notif.type === "warning" && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    {notif.type === "success" && (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className={cn("text-xs font-semibold", !notif.read ? "text-foreground" : "text-muted-foreground")}>
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 mt-1">
                      <Clock size={10} />
                      <span>{notif.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-2 bg-muted/20 text-center">
              <span className="text-xs text-muted-foreground">Central de Alertas Inteligentes</span>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenuSeparator className="h-6 w-px bg-border mx-1 hidden sm:block" />

        {/* Perfil do Usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-lg pl-2 pr-3 py-1.5 h-auto hover:bg-muted text-foreground transition-all"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold ring-1 ring-primary/30">
                {user.nome.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block max-w-[120px]">
                <p className="text-xs font-semibold truncate leading-none">{user.nome}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">{user.perfil}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 shadow-lg border border-border">
            <DropdownMenuLabel className="font-normal p-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{user.nome}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2 py-2">
              <User size={16} />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            {user.perfil === "Administrador" && (
              <DropdownMenuItem className="cursor-pointer gap-2 py-2">
                <Settings size={16} />
                <span>Configurações</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer gap-2 py-2 text-destructive hover:bg-destructive/10">
              <LogOut size={16} />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
