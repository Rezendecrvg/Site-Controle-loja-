"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, AlertTriangle, Clock, Search, Loader2 } from "lucide-react";

interface Garantia {
  id: string;
  cliente_id: string;
  origem: "Venda" | "Ordem de Serviço";
  origem_id: string;
  tipo: "Máquina" | "Serviço";
  data_inicio: string;
  data_fim: string;
  status: "Ativa" | "Vencida";
  clientes?: { nome: string } | null;
}

export default function GarantiasPage() {
  const [garantias, setGarantias] = useState<Garantia[]>([]);
  const [descricoes, setDescricoes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todas" | "ativas" | "vencidas">("todas");

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro(null);

    // Mantém os status do banco em dia (Ativa -> Vencida quando a data passou)
    await supabase.rpc("atualizar_garantias_vencidas");

    const { data: garantiasData, error: garantiasErro } = await supabase
      .from("garantias")
      .select("*, clientes(nome)")
      .order("data_fim", { ascending: false });

    if (garantiasErro) {
      setErro("Não foi possível carregar as garantias: " + garantiasErro.message);
      setLoading(false);
      return;
    }

    const lista = (garantiasData ?? []) as unknown as Garantia[];
    setGarantias(lista);

    const vendaIds = lista.filter((g) => g.origem === "Venda").map((g) => g.origem_id);
    const osIds = lista.filter((g) => g.origem === "Ordem de Serviço").map((g) => g.origem_id);

    const mapaDescricoes: Record<string, string> = {};

    if (vendaIds.length > 0) {
      const { data: itensData } = await supabase
        .from("itens_venda")
        .select("venda_id, produtos(nome)")
        .in("venda_id", vendaIds);
      for (const item of (itensData ?? []) as unknown as { venda_id: string; produtos: { nome: string } | null }[]) {
        const nomeProduto = item.produtos?.nome ?? "Produto";
        mapaDescricoes[item.venda_id] = mapaDescricoes[item.venda_id]
          ? `${mapaDescricoes[item.venda_id]}, ${nomeProduto}`
          : nomeProduto;
      }
    }

    if (osIds.length > 0) {
      const { data: osData } = await supabase
        .from("ordens_servico")
        .select("id, numero, marca_maquina, modelo_maquina")
        .in("id", osIds);
      for (const os of osData ?? []) {
        mapaDescricoes[os.id] = `${os.marca_maquina} ${os.modelo_maquina} (OS #${os.numero})`;
      }
    }

    setDescricoes(mapaDescricoes);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const hoje = useMemo(() => new Date(new Date().toDateString()), []);

  const diasRestantes = (dataFim: string) => {
    const fim = new Date(dataFim + "T00:00:00");
    return Math.round((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  };

  const garantiasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase();
    return garantias.filter((g) => {
      const descricao = descricoes[g.origem_id] ?? "";
      const matchBusca =
        (g.clientes?.nome ?? "").toLowerCase().includes(termo) || descricao.toLowerCase().includes(termo);
      const vencida = diasRestantes(g.data_fim) < 0;
      const matchFiltro = filtro === "todas" || (filtro === "vencidas" ? vencida : !vencida);
      return matchBusca && matchFiltro;
    });
  }, [garantias, descricoes, busca, filtro, hoje]);

  const ativas = garantias.filter((g) => diasRestantes(g.data_fim) >= 0).length;
  const vencidas = garantias.filter((g) => diasRestantes(g.data_fim) < 0).length;
  const vencendoEm7dias = garantias.filter((g) => {
    const d = diasRestantes(g.data_fim);
    return d >= 0 && d <= 7;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Controle de Garantias</h1>
        <p className="text-muted-foreground text-sm">Acompanhe todas as garantias de máquinas e serviços</p>
      </div>

      {erro && (
        <div className="rounded-md border border-red-900/30 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
          {erro}
        </div>
      )}

      <div className="grid gap-4 grid-cols-3">
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Ativas</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{ativas}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Vencendo em 7 dias</span>
          </div>
          <p className="text-2xl font-extrabold text-amber-500">{vencendoEm7dias}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Vencidas</span>
          </div>
          <p className="text-2xl font-extrabold text-muted-foreground">{vencidas}</p>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou produto..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>
            <div className="flex gap-1.5">
              {(["todas", "ativas", "vencidas"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border ${
                    filtro === f ? "bg-primary text-white border-primary shadow-sm" : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">
            {loading ? "Carregando..." : `${garantiasFiltradas.length} garantia(s)`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="animate-spin" size={18} /> Carregando garantias...
            </div>
          ) : garantiasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Shield size={28} className="opacity-40" />
              <p className="text-sm">Nenhuma garantia encontrada ainda.</p>
              <p className="text-xs">Elas são geradas automaticamente ao vender uma máquina ou entregar uma OS.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs font-bold text-muted-foreground uppercase">
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Produto / Serviço</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Início</th>
                    <th className="px-4 py-3 text-left">Fim</th>
                    <th className="px-4 py-3 text-right">Dias Rest.</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {garantiasFiltradas.map((g) => {
                    const dias = diasRestantes(g.data_fim);
                    const vencida = dias < 0;
                    return (
                      <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-semibold">{g.clientes?.nome ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{descricoes[g.origem_id] ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold border-none ${
                              g.tipo === "Máquina" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"
                            }`}
                          >
                            {g.tipo}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(g.data_inicio + "T00:00:00").toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(g.data_fim + "T00:00:00").toLocaleDateString("pt-BR")}
                        </td>
                        <td className={`px-4 py-3 text-right font-bold text-sm ${vencida ? "text-destructive" : dias <= 7 ? "text-amber-500" : "text-emerald-600"}`}>
                          {vencida ? "Vencida" : `${dias}d`}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold border-none ${
                              !vencida ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {vencida ? "Vencida" : "Ativa"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
