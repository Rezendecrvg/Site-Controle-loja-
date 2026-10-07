"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { notificarEstoqueBaixo } from "@/lib/notificacoes-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Layers, TrendingUp, TrendingDown, AlertTriangle, History, Loader2, Plus } from "lucide-react";

interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  estoque_minimo: number;
  ativo: boolean;
}

interface Movimentacao {
  id: string;
  produto_id: string;
  tipo: string;
  quantidade: number;
  data: string;
  observacao: string | null;
  produtos?: { nome: string } | null;
  usuarios?: { nome: string } | null;
}

const tipoColors: Record<string, string> = {
  Entrada: "bg-emerald-500/10 text-emerald-600 border-none",
  Venda: "bg-blue-500/10 text-blue-600 border-none",
  "Ajuste Manual": "bg-amber-500/10 text-amber-600 border-none",
  "Ordem de Serviço": "bg-purple-500/10 text-purple-600 border-none",
  Perda: "bg-destructive/10 text-destructive border-none",
  Devolução: "bg-cyan-500/10 text-cyan-600 border-none",
};

const OPCOES_MOVIMENTACAO = [
  { value: "entrada", label: "Entrada (compra / reposição)", tipo: "Entrada", sinal: 1 },
  { value: "venda", label: "Venda", tipo: "Venda", sinal: -1 },
  { value: "perda", label: "Perda / Quebra", tipo: "Perda", sinal: -1 },
  { value: "devolucao", label: "Devolução", tipo: "Devolução", sinal: 1 },
  { value: "ajuste_pos", label: "Ajuste Manual (adicionar)", tipo: "Ajuste Manual", sinal: 1 },
  { value: "ajuste_neg", label: "Ajuste Manual (remover)", tipo: "Ajuste Manual", sinal: -1 },
] as const;

export default function EstoquePage() {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [dialogAberto, setDialogAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ produto_id: "", opcao: "entrada", quantidade: "", observacao: "" });

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro(null);

    const [{ data: produtosData, error: produtosErro }, { data: movData, error: movErro }] =
      await Promise.all([
        supabase.from("produtos").select("id, nome, quantidade, estoque_minimo, ativo").order("nome"),
        supabase
          .from("movimentacao_estoque")
          .select("*, produtos(nome), usuarios(nome)")
          .order("data", { ascending: false })
          .limit(200),
      ]);

    if (produtosErro || movErro) {
      setErro("Não foi possível carregar os dados do estoque: " + (produtosErro?.message ?? movErro?.message));
    } else {
      setProdutos((produtosData ?? []) as Produto[]);
      setMovimentacoes((movData ?? []) as Movimentacao[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const stats = useMemo(() => {
    const totalSkus = produtos.filter((p) => p.ativo).length;
    const abaixoMinimo = produtos.filter((p) => p.ativo && p.quantidade <= p.estoque_minimo).length;

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    let entradasMes = 0;
    let saidasMes = 0;
    for (const m of movimentacoes) {
      const dataMovimentacao = new Date(m.data);
      if (dataMovimentacao < inicioMes) continue;
      if (m.quantidade > 0) entradasMes += m.quantidade;
      else saidasMes += Math.abs(m.quantidade);
    }

    return { totalSkus, abaixoMinimo, entradasMes, saidasMes };
  }, [produtos, movimentacoes]);

  const abrirDialog = () => {
    setForm({ produto_id: "", opcao: "entrada", quantidade: "", observacao: "" });
    setErro(null);
    setDialogAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const opcaoSelecionada = OPCOES_MOVIMENTACAO.find((o) => o.value === form.opcao)!;
    const quantidadeNum = Number(form.quantidade);

    if (!form.produto_id) {
      setErro("Selecione um produto.");
      return;
    }
    if (!quantidadeNum || quantidadeNum <= 0) {
      setErro("Informe uma quantidade válida (maior que zero).");
      return;
    }

    const produto = produtos.find((p) => p.id === form.produto_id);
    const quantidadeComSinal = quantidadeNum * opcaoSelecionada.sinal;

    if (produto && opcaoSelecionada.sinal < 0 && produto.quantidade + quantidadeComSinal < 0) {
      setErro(`Estoque insuficiente. "${produto.nome}" só tem ${produto.quantidade} unidade(s).`);
      return;
    }

    setSalvando(true);
    const { error } = await supabase.rpc("registrar_movimentacao_estoque", {
      p_produto_id: form.produto_id,
      p_tipo: opcaoSelecionada.tipo,
      p_quantidade: quantidadeComSinal,
      p_usuario_id: user?.id ?? null,
      p_observacao: form.observacao.trim() || null,
    });

    setSalvando(false);
    if (error) {
      setErro("Erro ao registrar movimentação: " + error.message);
      return;
    }

    setDialogAberto(false);

    // Se a movimentação deixou o estoque no ou abaixo do mínimo, notifica
    if (produto) {
      const novaQuantidade = produto.quantidade + quantidadeComSinal;
      if (novaQuantidade <= produto.estoque_minimo) {
        notificarEstoqueBaixo(produto.nome, novaQuantidade, produto.estoque_minimo);
      }
    }

    carregarDados();
  };

  const formatarData = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Controle de Estoque</h1>
          <p className="text-muted-foreground text-sm">Histórico de movimentações, inventário e alertas de reposição</p>
        </div>
        <Button className="gap-2 font-semibold shadow-sm" onClick={abrirDialog}>
          <Plus size={16} /> Nova Movimentação
        </Button>
      </div>

      {erro && !dialogAberto && (
        <div className="rounded-md border border-red-900/30 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
          {erro}
        </div>
      )}

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Layers size={16} className="text-primary" /><span className="text-[10px] font-bold text-muted-foreground uppercase">Total SKUs</span></div>
          <p className="text-2xl font-extrabold">{stats.totalSkus}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle size={16} className="text-amber-500" /><span className="text-[10px] font-bold text-muted-foreground uppercase">Abaixo Mínimo</span></div>
          <p className="text-2xl font-extrabold text-amber-500">{stats.abaixoMinimo}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><TrendingUp size={16} className="text-emerald-500" /><span className="text-[10px] font-bold text-muted-foreground uppercase">Entradas Mês</span></div>
          <p className="text-2xl font-extrabold text-emerald-600">{stats.entradasMes}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><TrendingDown size={16} className="text-destructive" /><span className="text-[10px] font-bold text-muted-foreground uppercase">Saídas Mês</span></div>
          <p className="text-2xl font-extrabold text-destructive">{stats.saidasMes}</p>
        </Card>
      </div>

      {stats.abaixoMinimo > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5 shadow-sm">
          <CardContent className="py-3 flex flex-wrap items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Produtos abaixo do estoque mínimo:</span>
            {produtos
              .filter((p) => p.ativo && p.quantidade <= p.estoque_minimo)
              .map((p) => (
                <Badge key={p.id} variant="outline" className="text-[10px] font-semibold bg-amber-500/10 border-none text-amber-700 dark:text-amber-400">
                  {p.nome} ({p.quantidade})
                </Badge>
              ))}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <History size={16} className="text-primary" /> Histórico de Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="animate-spin" size={18} /> Carregando movimentações...
            </div>
          ) : movimentacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <History size={28} className="opacity-40" />
              <p className="text-sm">Nenhuma movimentação registrada ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs font-bold text-muted-foreground uppercase">
                    <th className="px-4 py-3 text-left">Produto</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-right">Qtd</th>
                    <th className="px-4 py-3 text-left">Usuário</th>
                    <th className="px-4 py-3 text-left">Data/Hora</th>
                    <th className="px-4 py-3 text-left">Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {movimentacoes.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{m.produtos?.nome ?? "Produto removido"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-[10px] font-bold ${tipoColors[m.tipo] ?? ""}`}>
                          {m.tipo}
                        </Badge>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold text-sm ${m.quantidade > 0 ? "text-emerald-600" : "text-destructive"}`}>
                        {m.quantidade > 0 ? `+${m.quantidade}` : m.quantidade}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{m.usuarios?.nome ?? "Sistema"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatarData(m.data)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{m.observacao ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nova Movimentação */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSalvar}>
            <DialogHeader>
              <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
              <DialogDescription>Registre uma entrada, perda ou ajuste manual.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3.5 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Produto *</label>
                <select
                  required
                  value={form.produto_id}
                  onChange={(e) => setForm({ ...form, produto_id: e.target.value })}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Selecione...</option>
                  {produtos.filter((p) => p.ativo).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} (estoque atual: {p.quantidade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Tipo de movimentação *</label>
                <select
                  value={form.opcao}
                  onChange={(e) => setForm({ ...form, opcao: e.target.value })}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {OPCOES_MOVIMENTACAO.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Quantidade *</label>
                <Input
                  required
                  type="number"
                  min="1"
                  value={form.quantidade}
                  onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Observação</label>
                <Input
                  value={form.observacao}
                  onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  placeholder="Ex: Compra fornecedor Lanmax Sul"
                />
              </div>

              {erro && <p className="text-xs text-destructive">{erro}</p>}
            </div>

            <DialogFooter>
              <DialogClose>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={salvando} className="gap-1.5">
                {salvando && <Loader2 size={14} className="animate-spin" />}
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
