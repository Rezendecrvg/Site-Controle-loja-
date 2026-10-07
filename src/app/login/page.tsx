"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Mail, Eye, EyeOff, Loader2, Sparkles, AlertCircle } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const resultado = await login(email, password);
      if (resultado.success) {
        router.push("/dashboard");
      } else {
        setErro(resultado.error ?? "Não foi possível entrar. Tente novamente.");
      }
    } catch (err) {
      console.error(err);
      setErro("Não foi possível entrar. Tente novamente.");
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
              Entre com o e-mail e senha da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* E-mail */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">E-mail corporativo</label>
                <div className="relative">
                  <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@westmaquinas.com"
                    className="pl-10 h-11 border-slate-800 bg-slate-950/60 focus:border-primary text-slate-100 placeholder:text-slate-600 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Senha de acesso</label>
                <div className="relative">
                  <KeyRound className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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

              {/* Mensagem de erro */}
              {erro && (
                <div className="flex items-center gap-2 rounded-md border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-300">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{erro}</span>
                </div>
              )}

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
