"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
  login: (email: string, perfil: Perfil) => Promise<boolean>;
  logout: () => void;
  togglePerfil: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carrega usuário mockado inicial se existir no localStorage
    const savedUser = localStorage.getItem("west_maquinas_auth");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Padrão: Administrador para facilidade de testes iniciais
      const defaultUser: User = {
        id: "1",
        nome: "Administrador West",
        email: "admin@westmaquinas.com.br",
        perfil: "Administrador",
        ativo: true,
      };
      setUser(defaultUser);
      localStorage.setItem("west_maquinas_auth", JSON.stringify(defaultUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, perfil: Perfil): Promise<boolean> => {
    setLoading(true);
    // Simula uma chamada de login
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockUser: User = {
      id: perfil === "Administrador" ? "1" : "2",
      nome: perfil === "Administrador" ? "Administrador West" : "Vendedora Sarah",
      email: email || (perfil === "Administrador" ? "admin@westmaquinas.com.br" : "sarah@westmaquinas.com.br"),
      perfil: perfil,
      ativo: true,
    };

    setUser(mockUser);
    localStorage.setItem("west_maquinas_auth", JSON.stringify(mockUser));
    setLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("west_maquinas_auth");
  };

  const togglePerfil = () => {
    if (!user) return;
    const newPerfil: Perfil = user.perfil === "Administrador" ? "Vendedora" : "Administrador";
    const updatedUser: User = {
      ...user,
      id: newPerfil === "Administrador" ? "1" : "2",
      nome: newPerfil === "Administrador" ? "Administrador West" : "Vendedora Sarah",
      email: newPerfil === "Administrador" ? "admin@westmaquinas.com.br" : "sarah@westmaquinas.com.br",
      perfil: newPerfil,
    };
    setUser(updatedUser);
    localStorage.setItem("west_maquinas_auth", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, togglePerfil }}>
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
