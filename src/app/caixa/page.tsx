"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Plus,
  Minus,
  CheckCircle,
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Smartphone,
} from "lucide-react";

type StatusCaixa = "fechado" | "aberto";

interface Movimentacao {
  id: number;
  tipo: "Entrada" | "Saída";
  valor: number;
  motivo: string;
  hora: string;
}

export default function CaixaPage() {
  const [status, setStatus] = useState<StatusCaixa>("fechado");
  const [valorAbertura, setValorAbertura] = useState("");
  const [valorConferido, setValorConferido] = useState("");
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([
    { id: 1, tipo: "Entrada", valor: 45.0, motivo: "Venda #001 (Bobinas)", hora: "09:15" },
    { id: 2, tipo: "Entrada", valor: 1200.0, motivo: "Venda #002 (Singer Facilita)", hora: "10:30" },
    { id: 3, tipo: "Saída", valor: 80.0, motivo: "Compra de material de embalagem", hora: "11:00" },
    { id: 4, tipo: "Entrada", valor: 350.0, motivo: "Venda #003 (Peças diversas)", hora: "13:45" },
    { id: 5, tipo: "Entrada", valor: 755.0, motivo: "OS #104 (Serviço de manutenção)", hora: "15:20" },
  ]);
  const [novaMovTipo, setNovaMovTipo] = useState<"Entrada" | "Saída">("Entrada");
  const [novaMovValor, setNovaMovValor] = useState("");
  const [novaMovMotivo, setNovaMovMotivo] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [caixaFechado, setCaixaFechado] = useState(false);

  const abertura = parseFloat(valorAbertura || "0");
  const totalEntradas = movimentacoes.filter((m) => m.tipo === "Entrada").reduce((a, m) => a + m.valor, 0);
  const totalSaidas = movimentacoes.filter((m) => m.tipo === "Saída").reduce((a, m) => a + m.valor, 0);
  const saldoCalculado = abertura + totalEntradas - totalSaidas;
  const conferido = parseFloat(valorConferido || "0");
  const diferenca = conferido - saldoCalculado;

  const abrirCaixa = () => {
    if (!valorAbertura || parseFloat(valorAbertura) < 0) return;
    setStatus("aberto");
  };

  const adicionarMovimentacao = () => {
    if (!novaMovValor || !novaMovMotivo) return;
    const nova: Movimentacao = {
      id: Date.now(),
      tipo: novaMovTipo,
      valor: parseFloat(novaMovValor),
      motivo: novaMovMotivo,
      hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
    setMovimentacoes((prev) => [...prev, nova]);
    setNovaMovValor("");
    setNovaMovMotivo("");
  };

  const fecharCaixa = () => {
    if (!valorConferido) return;
    setCaixaFechado(true);
  };

  const reiniciar = () => {
    setStatus("fechado");
    setValorAbertura("");
    setValorConferido("");
    setJustificativa("");
    setCaixaFechado(false);
    setMovimentacoes([]);
  };

  if (caixaFechado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold">Caixa Fechado com Sucesso!</h2>
        <div className="text-center space-y-1 text-muted-foreground text-sm">
          <p>Saldo calculado: <strong className="text-foreground">R$ {saldoCalculado.toFixed(2).replace(".", ",")}</strong></p>
          <p>Valor conferido: <strong className="text-foreground">R$ {conferido.toFixed(2).replace(".", ",")}</strong></p>
          <p className={diferenca === 0 ? "text-emerald-500 font-bold" : "text-destructive font-bold"}>
            Diferença: R$ {diferenca.toFixed(2).replace(".", ",")} {diferenca === 0 ? "✓ Sem divergência" : diferenca > 0 ? "(Sobra)" : "(Falta)"}
          </p>
          {justificativa && <p>Justificativa: {justificativa}</p>}
        </div>
        <Button onClick={reiniciar} className="mt-4">Iniciar Novo Dia</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Controle de Caixa</h1>
          <p className="text-muted-foreground text-sm">Abertura, movimentações e fechamento do caixa diário</p>
        </div>
        <Badge
          variant="outline"
          className={`text-sm px-3 py-1.5 font-bold gap-1.5 ${
            status === "aberto"
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
              : "border-muted-foreground bg-muted text-muted-foreground"
          }`}
        >
          {status === "aberto" ? <Unlock size={14} /> : <Lock size={14} />}
          {status === "aberto" ? "Caixa Aberto" : "Caixa Fechado"}
        </Badge>
      </div>

      {/* ABERTURA */}
      {status === "fechado" && (
        <Card className="max-w-md mx-auto shadow-md border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="text-primary" size={20} />
              Abrir Caixa do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-muted-foreground">Valor Inicial em Dinheiro (R$)</label>
              <Input
                type="number"
                min={0}
                placeholder="Ex: 150,00"
                value={valorAbertura}
                onChange={(e) => setValorAbertura(e.target.value)}
                className="h-11 text-base"
              />
            </div>
            <Button onClick={abrirCaixa} className="w-full h-11 gap-2 font-bold">
              <Unlock size={16} /> Abrir Caixa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* CAIXA ABERTO */}
      {status === "aberto" && (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Resumo financeiro */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-4 text-center shadow-sm">
                <DollarSign className="mx-auto text-primary mb-1" size={18} />
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Abertura</p>
                <p className="font-extrabold text-sm mt-0.5">R$ {abertura.toFixed(2).replace(".", ",")}</p>
              </Card>
              <Card className="p-4 text-center shadow-sm">
                <TrendingUp className="mx-auto text-emerald-500 mb-1" size={18} />
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Entradas</p>
                <p className="font-extrabold text-sm mt-0.5 text-emerald-600">R$ {totalEntradas.toFixed(2).replace(".", ",")}</p>
              </Card>
              <Card className="p-4 text-center shadow-sm">
                <TrendingDown className="mx-auto text-destructive mb-1" size={18} />
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Saídas</p>
                <p className="font-extrabold text-sm mt-0.5 text-destructive">R$ {totalSaidas.toFixed(2).replace(".", ",")}</p>
              </Card>
              <Card className="p-4 text-center shadow-sm border-primary/30 bg-primary/5">
                <Wallet className="mx-auto text-primary mb-1" size={18} />
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Saldo</p>
                <p className="font-extrabold text-sm mt-0.5 text-primary">R$ {saldoCalculado.toFixed(2).replace(".", ",")}</p>
              </Card>
            </div>

            {/* Movimentações */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Movimentações do Dia</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border max-h-64 overflow-y-auto">
                  {movimentacoes.map((m) => (
                    <div key={m.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          m.tipo === "Entrada" ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                        }`}>
                          {m.tipo === "Entrada" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{m.motivo}</p>
                          <p className="text-[11px] text-muted-foreground">{m.hora}</p>
                        </div>
                      </div>
                      <span className={`font-bold text-sm ${m.tipo === "Entrada" ? "text-emerald-600" : "text-destructive"}`}>
                        {m.tipo === "Entrada" ? "+" : "-"} R$ {m.valor.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Painel de ações */}
          <div className="space-y-4">
            {/* Nova movimentação */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Registrar Movimentação Manual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setNovaMovTipo("Entrada")}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      novaMovTipo === "Entrada" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Plus size={12} /> Entrada
                  </button>
                  <button
                    onClick={() => setNovaMovTipo("Saída")}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      novaMovTipo === "Saída" ? "border-destructive bg-destructive/10 text-destructive" : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Minus size={12} /> Saída
                  </button>
                </div>
                <Input placeholder="Valor (R$)" type="number" value={novaMovValor} onChange={(e) => setNovaMovValor(e.target.value)} className="h-9 text-sm" />
                <Input placeholder="Motivo / Descrição" value={novaMovMotivo} onChange={(e) => setNovaMovMotivo(e.target.value)} className="h-9 text-sm" />
                <Button onClick={adicionarMovimentacao} variant="secondary" className="w-full h-9 text-xs font-bold gap-1.5">
                  <Plus size={14} /> Registrar
                </Button>
              </CardContent>
            </Card>

            {/* Fechamento */}
            <Card className="shadow-sm border-destructive/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
                  <Lock size={14} /> Fechar Caixa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
                  <p>Saldo calculado pelo sistema:</p>
                  <p className="font-extrabold text-base text-foreground mt-0.5">R$ {saldoCalculado.toFixed(2).replace(".", ",")}</p>
                </div>
                <Input
                  type="number"
                  placeholder="Valor físico conferido (R$)"
                  value={valorConferido}
                  onChange={(e) => setValorConferido(e.target.value)}
                  className="h-9 text-sm"
                />
                {valorConferido && diferenca !== 0 && (
                  <div className={`text-xs font-bold p-2 rounded-lg ${diferenca > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                    Diferença: R$ {Math.abs(diferenca).toFixed(2).replace(".", ",")} ({diferenca > 0 ? "Sobra" : "Falta"})
                  </div>
                )}
                {valorConferido && diferenca !== 0 && (
                  <Input placeholder="Justificativa obrigatória" value={justificativa} onChange={(e) => setJustificativa(e.target.value)} className="h-9 text-sm" />
                )}
                <Button
                  onClick={fecharCaixa}
                  variant="destructive"
                  disabled={!valorConferido || (diferenca !== 0 && !justificativa)}
                  className="w-full h-10 text-sm font-bold gap-2"
                >
                  <Lock size={14} /> Fechar Caixa do Dia
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
