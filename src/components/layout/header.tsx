"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
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
  ShoppingBag,
  Wrench,
  ShieldAlert,
  Trash2,
  Check,
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

interface Notificacao {
  id: string;
  tipo: "venda" | "estoque" | "os" | "garantia" | "sistema";
  titulo: string;
  mensagem: string;
  lida: boolean;
  criada_em: string;
}

const ICONE_TIPO: Record<Notificacao["tipo"], React.ReactNode> = {
  venda: <ShoppingBag className="h-4 w-4 text-emerald-500" />,
  estoque: <AlertTriangle className="h-4 w-4 text-destructive" />,
  os: <Wrench className="h-4 w-4 text-blue-500" />,
  garantia: <ShieldAlert className="h-4 w-4 text-amber-500" />,
  sistema: <CheckCircle className="h-4 w-4 text-muted-foreground" />,
};

function tempoRelativo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora mesmo";
  if (min < 60) return `${min} min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notifications, setNotifications] = useState<Notificacao[]>([]);

  const carregarNotificacoes = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("notificacoes")
      .select("id, tipo, titulo, mensagem, lida, criada_em")
      .eq("usuario_id", user.id)
      .order("criada_em", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Erro ao carregar notificações:", error.message);
      return;
    }

    setNotifications(data || []);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    carregarNotificacoes();

    // Auto-refresh a cada 15s (fallback caso o realtime não pegue)
    const intervalo = setInterval(carregarNotificacoes, 15000);

    // Tempo real: atualiza assim que uma notificação é inserida para este usuário
    const canal = supabase
      .channel("notificacoes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notificacoes", filter: `usuario_id=eq.${user.id}` },
        () => carregarNotificacoes()
      )
      .subscribe();

    return () => {
      clearInterval(intervalo);
      supabase.removeChannel(canal);
    };
  }, [user, carregarNotificacoes]);

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

  const markAllAsRead = async () => {
    const idsNaoLidas = notifications.filter((n) => !n.lida).map((n) => n.id);
    if (idsNaoLidas.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));

    const { error } = await supabase.from("notificacoes").update({ lida: true }).in("id", idsNaoLidas);
    if (error) {
      console.error("Erro ao marcar notificações como lidas:", error.message);
      carregarNotificacoes();
    }
  };

  const marcarComoLida = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    const { error } = await supabase.from("notificacoes").update({ lida: true }).eq("id", id);
    if (error) carregarNotificacoes();
  };

  const deletarNotificacao = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const { error } = await supabase.from("notificacoes").delete().eq("id", id);
    if (error) carregarNotificacoes();
  };

  const unreadCount = notifications.filter((n) => !n.lida).length;

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
          <DropdownMenuTrigger>
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
              {notifications.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhuma notificação por aqui.
                </div>
              )}
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "group flex gap-3 p-3 transition-colors hover:bg-muted/30",
                    !notif.lida && "bg-primary/5 dark:bg-primary/10"
                  )}
                >
                  <div className="shrink-0 mt-0.5">{ICONE_TIPO[notif.tipo]}</div>
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <p className={cn("text-xs font-semibold", !notif.lida ? "text-foreground" : "text-muted-foreground")}>
                      {notif.titulo}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {notif.mensagem}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 mt-1">
                      <Clock size={10} />
                      <span>{tempoRelativo(notif.criada_em)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.lida && (
                      <button
                        onClick={() => marcarComoLida(notif.id)}
                        className="p-1 rounded hover:bg-muted text-emerald-600"
                        title="Marcar como lida"
                      >
                        <Check size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => deletarNotificacao(notif.id)}
                      className="p-1 rounded hover:bg-muted text-destructive"
                      title="Excluir"
                    >
                      <Trash2 size={13} />
                    </button>
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
          <DropdownMenuTrigger>
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
