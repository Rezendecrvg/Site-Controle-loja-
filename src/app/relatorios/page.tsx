"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { dataLocalISO, hojeLocalISO, formatarDataBR } from "@/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Layers,
  DollarSign,
  Printer,
  Wallet,
  Loader2,
  RefreshCw,
  AlertCircle,
  ShoppingBag,
  Users,
  CreditCard,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ============================================================
// TIPOS
// ============================================================
interface ItemVenda {
  quantidade: number;
  preco_unitario: number;
  produtos?: {
    nome: string;
    preco_custo: number;
    categorias?: { nome: string } | null;
  } | null;
}

interface Venda {
  id: string;
  data: string;
  total: number;
  subtotal: number;
  desconto: number;
  forma_pagamento: string;
  vendedor_id: string;
  vendedorNome: string;
  itens: ItemVenda[];
}

interface CaixaRegistro {
  id: string;
  data: string;
  status: string;
  valor_abertura: number;
  valor_fechamento: number | null;
  diferenca: number | null;
  criado_em: string;
  fechado_em: string | null;
  responsavelNome: string;
}

interface MovimentacaoRegistro {
  id: string;
  data: string;
  tipo: string;
  valor: number;
  motivo: string;
  responsavelNome: string;
}

type Periodo = "Hoje" | "Semana" | "Mês atual" | "Ano";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function lucroDaVenda(venda: Venda): number {
  const margemItens = venda.itens.reduce((acc, item) => {
    const custo = Number(item.produtos?.preco_custo ?? 0);
    return acc + (Number(item.preco_unitario) - custo) * Number(item.quantidade);
  }, 0);
  return margemItens - Number(venda.desconto ?? 0);
}

// ============================================================
// PÁGINA
// ============================================================
export default function RelatoriosPage() {
  const { user } = useAuth();

  const [aba, setAba] = useState<"caixa" | "bi">("caixa");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [vendas, setVendas] = useState<Venda[]>([]);
  const [caixas, setCaixas] = useState<CaixaRegistro[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoRegistro[]>([]);

  const [diaSelecionado, setDiaSelecionado] = useState<string>(hojeLocalISO());
  const [periodo, setPeriodo] = useState<Periodo>("Mês atual");

  // --------------------------------------------------------
  // Carregamento (manual — sem atualização automática)
  // --------------------------------------------------------
  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);

    try {
      const [
        { data: vendasData, error: vendasErro },
        { data: caixasData, error: caixasErro },
        { data: movsData, error: movsErro },
        { data: usuariosData },
      ] = await Promise.all([
        supabase
          .from("vendas")
          .select(
            "id, data, total, subtotal, desconto, forma_pagamento, vendedor_id, itens_venda(quantidade, preco_unitario, produtos(nome, preco_custo, categorias(nome)))"
          )
          .eq("status", "Finalizada")
          .order("data", { ascending: false }),
        supabase.from("caixa").select("*").order("data", { ascending: false }),
        supabase.from("movimentacoes_caixa").select("*").order("data", { ascending: false }),
        supabase.from("usuarios").select("id, nome"),
      ]);

      if (vendasErro) throw vendasErro;
      if (caixasErro) throw caixasErro;
      if (movsErro) throw movsErro;

      const nomePorUsuario: Record<string, string> = {};
      (usuariosData ?? []).forEach((u: { id: string; nome: string }) => {
        nomePorUsuario[u.id] = u.nome;
      });

      setVendas(
        ((vendasData ?? []) as unknown as Array<Record<string, unknown>>).map((v) => ({
          id: String(v.id),
          data: String(v.data),
          total: Number(v.total ?? 0),
          subtotal: Number(v.subtotal ?? 0),
          desconto: Number(v.desconto ?? 0),
          forma_pagamento: String(v.forma_pagamento ?? "—"),
          vendedor_id: String(v.vendedor_id ?? ""),
          vendedorNome: nomePorUsuario[String(v.vendedor_id)] ?? "—",
          itens: (v.itens_venda ?? []) as ItemVenda[],
        }))
      );

      setCaixas(
        ((caixasData ?? []) as Array<Record<string, unknown>>).map((c) => ({
          id: String(c.id),
          data: dataLocalISO(String(c.criado_em ?? c.data)),
          status: String(c.status ?? "—"),
          valor_abertura: Number(c.valor_abertura ?? 0),
          valor_fechamento: c.valor_fechamento === null ? null : Number(c.valor_fechamento),
          diferenca: c.diferenca === null ? null : Number(c.diferenca),
          criado_em: String(c.criado_em),
          fechado_em: c.fechado_em ? String(c.fechado_em) : null,
          responsavelNome: nomePorUsuario[String(c.usuario_abertura_id)] ?? "—",
        }))
      );

      setMovimentacoes(
        ((movsData ?? []) as Array<Record<string, unknown>>).map((m) => ({
          id: String(m.id),
          data: String(m.data),
          tipo: String(m.tipo ?? "Saída"),
          valor: Math.abs(Number(m.valor ?? 0)),
          motivo: String(m.motivo ?? "Sem descrição"),
          responsavelNome: nomePorUsuario[String(m.responsavel_id)] ?? "—",
        }))
      );
    } catch (e) {
      setErro("Erro ao carregar relatórios: " + ((e as Error)?.message ?? "erro desconhecido"));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // --------------------------------------------------------
  // RELATÓRIO DO CAIXA (por dia)
  // --------------------------------------------------------
  const diasComMovimento = useMemo(() => {
    const dias = new Set<string>();
    vendas.forEach((v) => dias.add(dataLocalISO(v.data)));
    caixas.forEach((c) => dias.add(c.data));
    movimentacoes.forEach((m) => dias.add(dataLocalISO(m.data)));
    return Array.from(dias).sort().reverse();
  }, [vendas, caixas, movimentacoes]);

  const relatorioDia = useMemo(() => {
    const vendasDia = vendas.filter((v) => dataLocalISO(v.data) === diaSelecionado);
    const caixasDia = caixas.filter((c) => c.data === diaSelecionado);
    const movsDia = movimentacoes.filter((m) => dataLocalISO(m.data) === diaSelecionado);

    const valorInicial = caixasDia.reduce((acc, c) => acc + c.valor_abertura, 0);
    const totalVendido = vendasDia.reduce((acc, v) => acc + v.total, 0);
    const entradas = movsDia
      .filter((m) => m.tipo === "Entrada")
      .reduce((acc, m) => acc + m.valor, 0);
    const saidas = movsDia.filter((m) => m.tipo === "Saída").reduce((acc, m) => acc + m.valor, 0);
    const saldoFinal = valorInicial + totalVendido + entradas - saidas;

    const valorFechado = caixasDia.reduce(
      (acc, c) => acc + (c.valor_fechamento ?? 0),
      0
    );
    const temFechamento = caixasDia.some((c) => c.valor_fechamento !== null);
    const diferenca = caixasDia.reduce((acc, c) => acc + (c.diferenca ?? 0), 0);

    // Produtos vendidos no dia
    const produtosMap: Record<string, { nome: string; quantidade: number; total: number }> = {};
    vendasDia.forEach((v) =>
      v.itens.forEach((item) => {
        const nome = item.produtos?.nome ?? "Produto removido";
        if (!produtosMap[nome]) produtosMap[nome] = { nome, quantidade: 0, total: 0 };
        produtosMap[nome].quantidade += Number(item.quantidade);
        produtosMap[nome].total += Number(item.preco_unitario) * Number(item.quantidade);
      })
    );

    // Formas de pagamento
    const pagamentosMap: Record<string, { total: number; qtd: number }> = {};
    vendasDia.forEach((v) => {
      if (!pagamentosMap[v.forma_pagamento]) {
        pagamentosMap[v.forma_pagamento] = { total: 0, qtd: 0 };
      }
      pagamentosMap[v.forma_pagamento].total += v.total;
      pagamentosMap[v.forma_pagamento].qtd += 1;
    });

    // Por vendedor
    const vendedoresMap: Record<string, { nome: string; total: number; qtd: number }> = {};
    vendasDia.forEach((v) => {
      if (!vendedoresMap[v.vendedorNome]) {
        vendedoresMap[v.vendedorNome] = { nome: v.vendedorNome, total: 0, qtd: 0 };
      }
      vendedoresMap[v.vendedorNome].total += v.total;
      vendedoresMap[v.vendedorNome].qtd += 1;
    });

    return {
      vendasDia,
      caixasDia,
      movsDia,
      valorInicial,
      totalVendido,
      entradas,
      saidas,
      saldoFinal,
      valorFechado,
      temFechamento,
      diferenca,
      produtos: Object.values(produtosMap).sort((a, b) => b.quantidade - a.quantidade),
      pagamentos: Object.entries(pagamentosMap).map(([forma, dados]) => ({ forma, ...dados })),
      vendedores: Object.values(vendedoresMap).sort((a, b) => b.total - a.total),
    };
  }, [vendas, caixas, movimentacoes, diaSelecionado]);

  // --------------------------------------------------------
  // BI (por período)
  // --------------------------------------------------------
  const vendasDoPeriodo = useMemo(() => {
    const agora = new Date();
    const hojeISO = hojeLocalISO();

    return vendas.filter((v) => {
      const dataVenda = dataLocalISO(v.data);

      if (periodo === "Hoje") return dataVenda === hojeISO;

      if (periodo === "Semana") {
        const limite = new Date(agora);
        limite.setDate(limite.getDate() - 7);
        return new Date(v.data) >= limite;
      }

      if (periodo === "Mês atual") {
        return dataVenda.slice(0, 7) === hojeISO.slice(0, 7);
      }

      return dataVenda.slice(0, 4) === hojeISO.slice(0, 4);
    });
  }, [vendas, periodo]);

  const bi = useMemo(() => {
    const faturamento = vendasDoPeriodo.reduce((acc, v) => acc + v.total, 0);
    const lucro = vendasDoPeriodo.reduce((acc, v) => acc + lucroDaVenda(v), 0);
    const quantidade = vendasDoPeriodo.length;
    const ticketMedio = quantidade > 0 ? faturamento / quantidade : 0;

    // Série temporal por dia (ou por mês, quando o período é "Ano")
    const porChave: Record<string, { chave: string; faturamento: number; lucro: number }> = {};
    vendasDoPeriodo.forEach((v) => {
      const iso = dataLocalISO(v.data);
      const chave =
        periodo === "Ano"
          ? iso.slice(0, 7)
          : formatarDataBR(iso, { day: "2-digit", month: "2-digit" });

      if (!porChave[chave]) porChave[chave] = { chave, faturamento: 0, lucro: 0 };
      porChave[chave].faturamento += v.total;
      porChave[chave].lucro += lucroDaVenda(v);
    });

    const serie = Object.values(porChave).reverse();

    // Produtos mais vendidos
    const produtosMap: Record<string, { nome: string; quantidade: number; total: number }> = {};
    vendasDoPeriodo.forEach((v) =>
      v.itens.forEach((item) => {
        const nome = item.produtos?.nome ?? "Produto removido";
        if (!produtosMap[nome]) produtosMap[nome] = { nome, quantidade: 0, total: 0 };
        produtosMap[nome].quantidade += Number(item.quantidade);
        produtosMap[nome].total += Number(item.preco_unitario) * Number(item.quantidade);
      })
    );

    // Categorias
    const categoriasMap: Record<string, number> = {};
    vendasDoPeriodo.forEach((v) =>
      v.itens.forEach((item) => {
        const nome = item.produtos?.categorias?.nome ?? "Outros";
        categoriasMap[nome] =
          (categoriasMap[nome] ?? 0) + Number(item.preco_unitario) * Number(item.quantidade);
      })
    );

    // Vendedores
    const vendedoresMap: Record<string, { nome: string; total: number; qtd: number }> = {};
    vendasDoPeriodo.forEach((v) => {
      if (!vendedoresMap[v.vendedorNome]) {
        vendedoresMap[v.vendedorNome] = { nome: v.vendedorNome, total: 0, qtd: 0 };
      }
      vendedoresMap[v.vendedorNome].total += v.total;
      vendedoresMap[v.vendedorNome].qtd += 1;
    });

    return {
      faturamento,
      lucro,
      quantidade,
      ticketMedio,
      serie,
      produtos: Object.values(produtosMap)
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 10),
      categorias: Object.entries(categoriasMap).map(([name, value]) => ({
        name,
        value: Math.round(value),
      })),
      vendedores: Object.values(vendedoresMap).sort((a, b) => b.total - a.total),
    };
  }, [vendasDoPeriodo, periodo]);

  if (!user) return null;

  const margemLucro = bi.faturamento > 0 ? ((bi.lucro / bi.faturamento) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground text-sm">
            Fechamento de caixa por dia e análise de vendas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => carregar()}
            disabled={loading}
            className="gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-2 text-xs font-semibold"
          >
            <Printer size={14} /> Imprimir
          </Button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 p-1 rounded-xl border border-border bg-muted/40 w-fit">
        <button
          onClick={() => setAba("caixa")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            aba === "caixa"
              ? "bg-background text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-background/60"
          }`}
        >
          <Wallet size={15} /> Caixa do dia
        </button>
        <button
          onClick={() => setAba("bi")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            aba === "bi"
              ? "bg-background text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-background/60"
          }`}
        >
          <TrendingUp size={15} /> Vendas & BI
        </button>
      </div>

      {erro && (
        <div className="flex items-center gap-2 rounded-md border border-red-900/30 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
          <AlertCircle size={16} className="shrink-0" /> {erro}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="animate-spin" size={20} /> Carregando relatórios...
        </div>
      ) : aba === "caixa" ? (
        /* ==================== ABA CAIXA ==================== */
        <div className="space-y-6">
          {/* Seletor de dia */}
          <Card className="shadow-sm">
            <CardContent className="pt-6 flex flex-wrap items-center gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">Dia</label>
                <Input
                  type="date"
                  value={diaSelecionado}
                  onChange={(e) => setDiaSelecionado(e.target.value)}
                  className="max-w-[200px]"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-5">
                {diasComMovimento.slice(0, 6).map((dia) => (
                  <button
                    key={dia}
                    onClick={() => setDiaSelecionado(dia)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                      diaSelecionado === dia
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {formatarDataBR(dia, { day: "2-digit", month: "2-digit" })}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resumo do caixa do dia */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={15} className="text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Valor inicial
                </span>
              </div>
              <p className="text-lg font-extrabold">R$ {moeda(relatorioDia.valorInicial)}</p>
            </Card>

            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag size={15} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Total vendido
                </span>
              </div>
              <p className="text-lg font-extrabold text-emerald-600">
                R$ {moeda(relatorioDia.totalVendido)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {relatorioDia.vendasDia.length} venda(s)
              </p>
            </Card>

            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={15} className="text-blue-500" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Entradas
                </span>
              </div>
              <p className="text-lg font-extrabold text-blue-600">
                R$ {moeda(relatorioDia.entradas)}
              </p>
            </Card>

            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={15} className="text-red-500" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Saídas
                </span>
              </div>
              <p className="text-lg font-extrabold text-red-600">R$ {moeda(relatorioDia.saidas)}</p>
            </Card>

            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={15} className="text-primary" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Saldo final
                </span>
              </div>
              <p className="text-lg font-extrabold text-primary">
                R$ {moeda(relatorioDia.saldoFinal)}
              </p>
              {relatorioDia.temFechamento && (
                <p
                  className={`text-[11px] font-semibold mt-0.5 ${
                    relatorioDia.diferenca === 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  Conferido: R$ {moeda(relatorioDia.valorFechado)} (dif.{" "}
                  {relatorioDia.diferenca > 0 ? "+" : ""}
                  {moeda(relatorioDia.diferenca)})
                </p>
              )}
            </Card>
          </div>

          {/* Status dos caixas do dia */}
          {relatorioDia.caixasDia.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">Caixas do dia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {relatorioDia.caixasDia.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-xs p-2.5 rounded border border-border/60"
                  >
                    <div>
                      <p className="font-semibold">
                        Aberto por {c.responsavelNome} às {hora(c.criado_em)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Abertura R$ {moeda(c.valor_abertura)}
                        {c.fechado_em ? ` • Fechado às ${hora(c.fechado_em)}` : ""}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold border-none ${
                        c.status === "Aberto"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Movimentações do dia */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Wallet size={15} className="text-muted-foreground" /> Movimentações do dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relatorioDia.movsDia.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhuma entrada ou saída neste dia.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {relatorioDia.movsDia.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-xs p-2 rounded border border-border/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{m.motivo}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {m.tipo} • {m.responsavelNome} • {hora(m.data)}
                          </p>
                        </div>
                        <p
                          className={`font-bold ml-2 shrink-0 ${
                            m.tipo === "Saída" ? "text-red-600" : "text-blue-600"
                          }`}
                        >
                          {m.tipo === "Saída" ? "-" : "+"} R$ {moeda(m.valor)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Formas de pagamento */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CreditCard size={15} className="text-primary" /> Formas de pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relatorioDia.pagamentos.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhuma venda neste dia.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {relatorioDia.pagamentos.map((p) => {
                      const percentual =
                        relatorioDia.totalVendido > 0
                          ? (p.total / relatorioDia.totalVendido) * 100
                          : 0;
                      return (
                        <div key={p.forma} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold">{p.forma}</span>
                            <span className="font-bold">
                              R$ {moeda(p.total)}{" "}
                              <span className="text-[10px] text-muted-foreground font-normal">
                                ({p.qtd})
                              </span>
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${percentual}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Produtos vendidos no dia */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Layers size={15} className="text-indigo-500" /> Produtos vendidos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {relatorioDia.produtos.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Nenhum produto vendido neste dia.
                  </p>
                ) : (
                  <div className="divide-y divide-border max-h-64 overflow-y-auto">
                    {relatorioDia.produtos.map((p) => (
                      <div key={p.nome} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs truncate">{p.nome}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {p.quantidade} unidade(s)
                          </p>
                        </div>
                        <p className="font-bold text-xs text-emerald-600 whitespace-nowrap">
                          R$ {moeda(p.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Por vendedor */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users size={15} className="text-primary" /> Vendas por vendedor(a)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {relatorioDia.vendedores.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Nenhuma venda neste dia.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {relatorioDia.vendedores.map((v) => (
                      <div key={v.nome} className="flex items-center gap-3 px-4 py-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                          {v.nome.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs truncate">{v.nome}</p>
                          <p className="text-[10px] text-muted-foreground">{v.qtd} venda(s)</p>
                        </div>
                        <p className="font-bold text-xs text-emerald-600">R$ {moeda(v.total)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Vendas detalhadas do dia */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Vendas do dia</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {relatorioDia.vendasDia.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Nenhuma venda registrada em{" "}
                  {formatarDataBR(diaSelecionado, { day: "2-digit", month: "2-digit", year: "numeric" })}
                  .
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase">
                        <th className="px-4 py-2.5 text-left">Hora</th>
                        <th className="px-4 py-2.5 text-left">Vendedor(a)</th>
                        <th className="px-4 py-2.5 text-left">Pagamento</th>
                        <th className="px-4 py-2.5 text-left">Itens</th>
                        <th className="px-4 py-2.5 text-right">Desconto</th>
                        <th className="px-4 py-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {relatorioDia.vendasDia.map((v) => (
                        <tr key={v.id} className="hover:bg-muted/30">
                          <td className="px-4 py-2.5 font-semibold">{hora(v.data)}</td>
                          <td className="px-4 py-2.5">{v.vendedorNome}</td>
                          <td className="px-4 py-2.5">{v.forma_pagamento}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {v.itens.reduce((acc, i) => acc + Number(i.quantidade), 0)} item(ns)
                          </td>
                          <td className="px-4 py-2.5 text-right text-muted-foreground">
                            {v.desconto > 0 ? `- R$ ${moeda(v.desconto)}` : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-emerald-600">
                            R$ {moeda(v.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ==================== ABA BI ==================== */
        <div className="space-y-6">
          <div className="flex gap-1.5 p-1 bg-muted rounded-lg w-fit">
            {(["Hoje", "Semana", "Mês atual", "Ano"] as Periodo[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  periodo === p
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-primary" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Faturamento
                </span>
              </div>
              <p className="text-xl font-extrabold">R$ {moeda(bi.faturamento)}</p>
              <p className="text-[11px] text-muted-foreground">{periodo}</p>
            </Card>

            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={16} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Lucro bruto
                </span>
              </div>
              <p className="text-xl font-extrabold text-emerald-600">R$ {moeda(bi.lucro)}</p>
              <p className="text-[11px] text-muted-foreground">Margem: {margemLucro}%</p>
            </Card>

            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Layers size={16} className="text-indigo-500" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Total de vendas
                </span>
              </div>
              <p className="text-xl font-extrabold">{bi.quantidade}</p>
              <p className="text-[11px] text-muted-foreground">no período</p>
            </Card>

            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={16} className="text-purple-500" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Ticket médio
                </span>
              </div>
              <p className="text-xl font-extrabold">R$ {moeda(bi.ticketMedio)}</p>
              <p className="text-[11px] text-muted-foreground">por venda</p>
            </Card>
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Faturamento vs Lucro</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {bi.serie.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Sem vendas no período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bi.serie} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="chave"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: "8px" }}
                        formatter={(value) => `R$ ${moeda(Number(value))}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="faturamento"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        name="Faturamento"
                      />
                      <Line
                        type="monotone"
                        dataKey="lucro"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        name="Lucro"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Vendas por categoria</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {bi.categorias.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Sem vendas no período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bi.categorias}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name }) => name}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {bi.categorias.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `R$ ${moeda(Number(value))}`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Produtos mais vendidos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {bi.produtos.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Sem vendas no período
                    </div>
                  ) : (
                    bi.produtos.map((p, idx) => (
                      <div key={p.nome} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{p.nome}</p>
                          <p className="text-xs text-muted-foreground">{p.quantidade} unidades</p>
                        </div>
                        <p className="font-extrabold text-sm text-emerald-600 whitespace-nowrap">
                          R$ {moeda(p.total)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Desempenho por vendedor(a)</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {bi.vendedores.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Sem vendas no período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={bi.vendedores}
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="nome"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: "8px" }}
                        formatter={(value) => `R$ ${moeda(Number(value))}`}
                      />
                      <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Total" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
