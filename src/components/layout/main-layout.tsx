"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Redireciona para login se não estiver autenticado e não for a vitrine pública
    if (!loading && !user && pathname !== "/login" && pathname !== "/") {
      router.push("/login");
    }
  }, [user, loading, pathname, router]);

  // Se estiver carregando, mostra tela de splash minimalista e premium
  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary/10"></div>
          <div className="absolute h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="font-bold text-primary text-xl">W</span>
        </div>
        <p className="mt-4 text-xs font-semibold text-muted-foreground animate-pulse">
          Carregando ERP West Máquinas...
        </p>
      </div>
    );
  }

  // Se não estiver logado, não renderiza a estrutura com sidebar, apenas o conteúdo (ex: login ou vitrine)
  const isPublicPage = pathname === "/login" || pathname === "/";
  if (!user || isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar para Desktop e Mobile */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Overlay para fechar sidebar no mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-10 bg-black/40 md:hidden"
        />
      )}

      {/* Container Principal */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          sidebarOpen ? "md:pl-64" : "md:pl-16"
        )}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
