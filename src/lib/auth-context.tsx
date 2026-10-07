"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type Perfil = "Administrador" | "Vendedora";

export interface User {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Busca o perfil (nome, perfil, ativo) na tabela `usuarios` a partir do auth_id
  const carregarPerfil = async (authId: string) => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, email, perfil, ativo")
      .eq("auth_id", authId)
      .maybeSingle();

    if (error || !data) {
      setUser(null);
      return;
    }

    if (!data.ativo) {
      await supabase.auth.signOut();
      setUser(null);
      return;
    }

    setUser(data as User);
  };

  useEffect(() => {
    // Verifica se já existe uma sessão ativa (usuário já logado antes)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await carregarPerfil(session.user.id);
      }
      setLoading(false);
    });

    // Escuta mudanças de sessão (login, logout, expiração)
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await carregarPerfil(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      setLoading(false);
      return { success: false, error: "E-mail ou senha incorretos." };
    }

    await carregarPerfil(data.user.id);
    setLoading(false);
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
