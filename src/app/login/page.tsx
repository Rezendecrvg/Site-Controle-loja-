"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, Perfil } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Mail, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState<Perfil>("Administrador");
  const [password, setPassword] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, perfil);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 overflow-hidden">
      {/* Elementos visuais de fundo (blur circles) */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-primary/10 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-purple-600/10 blur-[100px] animate-pulse delay-700"></div>

      <div className="w-full max-w-md z-10 transition-all duration-300 hover:scale-[1.01]">
        {/* Logo / Título no Topo */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-extrabold text-2xl shadow-lg shadow-primary/30 mb-2 border border-primary/20">
            W
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">ERP West Máquinas</h2>
          <p className="text-slate-400 text-xs mt-1">Insira suas credenciais para gerenciar a loja</p>
        </div>

        <Card className="border border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-2xl text-white">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg text-slate-100 flex items-center gap-1.5 justify-center">
              <Sparkles size={16} className="text-indigo-400" />
              <span>Acesso ao Sistema</span>
            </CardTitle>
            <CardDescription className="text-slate-400 text-center text-xs">
              Escolha seu perfil operacional de trabalho
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* Seletor de Perfil Moderno */}
            <div className="grid grid-cols-2 gap-2.5 p-1 rounded-lg bg-slate-950 border border-slate-800/80">
              <button
                type="button"
                onClick={() => setPerfil("Administrador")}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                  perfil === "Administrador"
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Administrador
              </button>
              <button
                type="button"
                onClick={() => setPerfil("Vendedora")}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                  perfil === "Vendedora"
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Vendedora
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* E-mail */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">E-mail corporativo</label>
                <div className="relative">
                  <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      perfil === "Administrador"
                        ? "admin@westmaquinas.com.br"
                        : "vendedora@westmaquinas.com.br"
                    }
                    className="pl-10 h-11 border-slate-800 bg-slate-950/60 focus:border-primary text-slate-100 placeholder:text-slate-600 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Senha de acesso</label>
                  <button type="button" className="text-[10px] text-indigo-400 hover:underline">
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 border-slate-800 bg-slate-950/60 focus:border-primary text-slate-100 placeholder:text-slate-600 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Checkbox manter conectado */}
              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="remember"
                  className="rounded border-slate-800 bg-slate-950 text-primary focus:ring-primary/20 focus:ring-offset-slate-900"
                />
                <label htmlFor="remember" className="text-xs text-slate-400 select-none">
                  Manter conectado neste dispositivo
                </label>
              </div>

              {/* Botão de Entrar */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary hover:bg-primary/95 text-white shadow-lg shadow-primary/25 border-none text-sm font-semibold transition-all mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <span>Entrar no Sistema</span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-0 pb-6">
            <div className="w-full border-t border-slate-800/80 my-2"></div>
            <p className="text-[10px] text-slate-500 text-center">
              Acesso exclusivo para colaboradores da West Máquinas.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
