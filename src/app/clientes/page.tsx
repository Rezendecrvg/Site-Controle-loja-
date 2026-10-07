"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Users,
  Phone,
  Edit2,
  Trash2,
  ShoppingBag,
  Shield,
  Loader2,
  MapPin,
  IdCard,
  StickyNote,
  Hash,
  CreditCard,
  Calendar,
  Package,
  AlertCircle,
  Wrench,
} from "lucide-react";

interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  whatsapp: string | null;
  cpf: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  cep: string | null;
  observacoes: string | null;
  criado_em: string;
}

interface ItemCompraDetalhe {
  id: string;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  numeroSerie: string | null;
}

interface CompraDetalhe {
  id: string;
  data: string;
  subtotal: number;
  desconto: number;
  total: number;
  formaPagamento: string;
  vendedorNome: string;
  itens: ItemCompraDetalhe[];
}

interface OSDetalhe {
  id: string;
  numero: number;
  marcaMaquina: string;
  modeloMaquina: string;
  numeroSerie: string | null;
  defeitoInformado: string;
  diagnostico: string | null;
  servicoExecutado: string | null;
  valorMaoObra: number;
  valorPecas: number;
  valorTotal: number;
  status: string;
  dataEntrada: string;
  dataEntrega: string | null;
}

const FORM_VAZIO = {
  id: "",
  nome: "",
  telefone: "",
  whatsapp: "",
  cpf: "",
  endereco: "",
  bairro: "",
  cidade: "",
  cep: "",
  observacoes: "",
};

function corStatusOS(status: string): string {
  if (status === "Entregue") return "bg-emerald-500/10 text-emerald-600";
  if (status === "Cancelada") return "bg-red-500/10 text-red-600";
  if (status === "Pronta para retirada") return "bg-blue-500/10 text-blue-600";
  return "bg-amber-500/10 text-amber-600";
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendasPorCliente, setVendasPorCliente] = useState<Record<string, { qtd: number; total: number; ultima: string | null }>>({});
  const [garantiasPorCliente, setGarantiasPorCliente] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);

  const [clienteDetalhe, setClienteDetalhe] = useState<Cliente | null>(null);
  const [comprasDetalhe, setComprasDetalhe] = useState<CompraDetalhe[]>([]);
  const [osDetalhe, setOsDetalhe] = useState<OSDetalhe[]>([]);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [erroDetalhe, setErroDetalhe] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro(null);

    const [{ data: clientesData, error: clientesErro }, { data: vendasData }, { data: garantiasData }] =
      await Promise.all([
        supabase.from("clientes").select("*").order("nome"),
        supabase.from("vendas").select("cliente_id, total, data").eq("status", "Finalizada"),
        supabase.from("garantias").select("cliente_id").eq("status", "Ativa"),
      ]);

    if (clientesErro) {
      setErro("Não foi possível carregar os clientes: " + clientesErro.message);
      setLoading(false);
      return;
    }

    const vendasMap: Record<string, { qtd: number; total: number; ultima: string | null }> = {};
    for (const v of vendasData ?? []) {
      if (!v.cliente_id) continue;
      if (!vendasMap[v.cliente_id]) vendasMap[v.cliente_id] = { qtd: 0, total: 0, ultima: null };
      vendasMap[v.cliente_id].qtd += 1;
      vendasMap[v.cliente_id].total += Number(v.total);
      if (!vendasMap[v.cliente_id].ultima || v.data > vendasMap[v.cliente_id].ultima!) {
        vendasMap[v.cliente_id].ultima = v.data;
      }
    }

    const garantiasMap: Record<string, number> = {};
    for (const g of garantiasData ?? []) {
      if (!g.cliente_id) continue;
      garantiasMap[g.cliente_id] = (garantiasMap[g.cliente_id] ?? 0) + 1;
    }

    setClientes((clientesData ?? []) as Cliente[]);
    setVendasPorCliente(vendasMap);
    setGarantiasPorCliente(garantiasMap);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const abrirNovo = () => {
    setEditando(false);
    setForm(FORM_VAZIO);
    setErro(null);
    setDialogAberto(true);
  };

  const abrirEdicao = (c: Cliente) => {
    setEditando(true);
    setForm({
      id: c.id,
      nome: c.nome,
      telefone: c.telefone ?? "",
      whatsapp: c.whatsapp ?? "",
      cpf: c.cpf ?? "",
      endereco: c.endereco ?? "",
      bairro: c.bairro ?? "",
      cidade: c.cidade ?? "",
      cep: c.cep ?? "",
      observacoes: c.observacoes ?? "",
    });
    setErro(null);
    setDialogAberto(true);
  };

  const abrirDetalhe = async (c: Cliente) => {
    setClienteDetalhe(c);
    setComprasDetalhe([]);
    setOsDetalhe([]);
    setErroDetalhe(null);
    setLoadingDetalhe(true);

    const [
      { data: vendasData, error: vendasErro },
      { data: osData, error: osErro },
      { data: usuariosData },
    ] = await Promise.all([
      supabase
        .from("vendas")
        .select(
          "id, data, subtotal, desconto, total, forma_pagamento, vendedor_id, itens_venda(id, quantidade, preco_unitario, desconto, numero_serie, produtos(nome))"
        )
        .eq("cliente_id", c.id)
        .eq("status", "Finalizada")
        .order("data", { ascending: false }),
      supabase
        .from("ordens_servico")
        .select(
          "id, numero, marca_maquina, modelo_maquina, numero_serie, defeito_informado, diagnostico, servico_executado, valor_mao_obra, valor_pecas, valor_total, status, data_entrada, data_entrega"
        )
        .eq("cliente_id", c.id)
        .order("data_entrada", { ascending: false }),
      supabase.from("usuarios").select("id, nome"),
    ]);

    if (vendasErro || osErro) {
      setErroDetalhe(
        "Erro ao carregar o histórico: " + (vendasErro?.message ?? osErro?.message ?? "desconhecido")
      );
      setLoadingDetalhe(false);
      return;
    }

    const nomePorUsuario: Record<string, string> = {};
    (usuariosData ?? []).forEach((u: { id: string; nome: string }) => {
      nomePorUsuario[u.id] = u.nome;
    });

    setOsDetalhe(
      ((osData ?? []) as Array<Record<string, unknown>>).map((o) => ({
        id: String(o.id),
        numero: Number(o.numero),
        marcaMaquina: String(o.marca_maquina ?? ""),
        modeloMaquina: String(o.modelo_maquina ?? ""),
        numeroSerie: o.numero_serie ? String(o.numero_serie) : null,
        defeitoInformado: String(o.defeito_informado ?? ""),
        diagnostico: o.diagnostico ? String(o.diagnostico) : null,
        servicoExecutado: o.servico_executado ? String(o.servico_executado) : null,
        valorMaoObra: Number(o.valor_mao_obra ?? 0),
        valorPecas: Number(o.valor_pecas ?? 0),
        valorTotal: Number(o.valor_total ?? 0),
        status: String(o.status ?? "—"),
        dataEntrada: String(o.data_entrada),
        dataEntrega: o.data_entrega ? String(o.data_entrega) : null,
      }))
    );

    setComprasDetalhe(
      ((vendasData ?? []) as unknown as Array<Record<string, unknown>>).map((v) => ({
        id: String(v.id),
        data: String(v.data),
        subtotal: Number(v.subtotal ?? 0),
        desconto: Number(v.desconto ?? 0),
        total: Number(v.total ?? 0),
        formaPagamento: String(v.forma_pagamento ?? "—"),
        vendedorNome: nomePorUsuario[String(v.vendedor_id)] ?? "—",
        itens: (
          (v.itens_venda ?? []) as Array<{
            id: string;
            quantidade: number;
            preco_unitario: number;
            desconto: number;
            numero_serie: string | null;
            produtos: { nome: string } | null;
          }>
        ).map((item) => ({
          id: item.id,
          produtoNome: item.produtos?.nome ?? "Produto removido",
          quantidade: Number(item.quantidade),
          precoUnitario: Number(item.preco_unitario),
          desconto: Number(item.desconto ?? 0),
          numeroSerie: item.numero_serie,
        })),
      }))
    );

    setLoadingDetalhe(false);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!form.nome.trim()) {
      setErro("O nome do cliente é obrigatório.");
      return;
    }

    setSalvando(true);
    const payload = {
      nome: form.nome.trim(),
      telefone: form.telefone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      cpf: form.cpf.trim() || null,
      endereco: form.endereco.trim() || null,
      bairro: form.bairro.trim() || null,
      cidade: form.cidade.trim() || null,
      cep: form.cep.trim() || null,
      observacoes: form.observacoes.trim() || null,
    };

    const query = editando
      ? supabase.from("clientes").update(payload).eq("id", form.id)
      : supabase.from("clientes").insert(payload);

    const { error } = await query;
    setSalvando(false);

    if (error) {
      if (error.message.includes("clientes_cpf_key")) {
        setErro("Já existe um cliente cadastrado com esse CPF.");
      } else {
        setErro("Erro ao salvar: " + error.message);
      }
      return;
    }

    setDialogAberto(false);
    carregarDados();
  };

  const handleExcluir = async (c: Cliente) => {
    if (!confirm(`Excluir o cliente "${c.nome}"? Essa ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("clientes").delete().eq("id", c.id);
    if (error) {
      if (error.message.includes("foreign key") || error.code === "23503") {
        alert(`Não é possível excluir "${c.nome}": existem ordens de serviço ou outros registros vinculados a ele.`);
      } else {
        alert("Erro ao excluir: " + error.message);
      }
      return;
    }
    carregarDados();
  };

  const clientesFiltrados = useMemo(() => {
    const termo = busca.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        (c.telefone ?? "").includes(busca) ||
        (c.cidade ?? "").toLowerCase().includes(termo)
    );
  }, [clientes, busca]);

  const totalClientes = clientes.length;
  const totalGasto = Object.values(vendasPorCliente).reduce((a, v) => a + v.total, 0);
  const comGarantia = Object.keys(garantiasPorCliente).length;

  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
  const inativos = clientes.filter((c) => {
    const ultima = vendasPorCliente[c.id]?.ultima;
    return !ultima || new Date(ultima) < trintaDiasAtras;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Clientes</h1>
          <p className="text-muted-foreground text-sm">Cadastro, histórico e garantias dos clientes</p>
        </div>
        <Button className="gap-2 font-semibold shadow-sm" onClick={abrirNovo}>
          <Plus size={16} /> Novo Cliente
        </Button>
      </div>

      {erro && !dialogAberto && (
        <div className="rounded-md border border-red-900/30 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
          {erro}
        </div>
      )}

      {/* Cards resumo */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Clientes</span>
          </div>
          <p className="text-2xl font-extrabold">{totalClientes}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag size={16} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Compras</span>
          </div>
          <p className="text-lg font-extrabold text-emerald-600">
            R$ {totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-indigo-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Com Garantia</span>
          </div>
          <p className="text-2xl font-extrabold text-indigo-600">{comGarantia}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-amber-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Sem compra &gt;30d</span>
          </div>
          <p className="text-2xl font-extrabold text-amber-500">{inativos}</p>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone ou cidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9 h-11 text-sm"
        />
      </div>

      {/* Tabela de Clientes */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">
            {loading ? "Carregando..." : `${clientesFiltrados.length} cliente(s)`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="animate-spin" size={18} /> Carregando clientes...
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Users size={28} className="opacity-40" />
              <p className="text-sm">Nenhum cliente cadastrado ainda.</p>
              <Button size="sm" variant="outline" className="gap-1.5 mt-2" onClick={abrirNovo}>
                <Plus size={14} /> Cadastrar o primeiro cliente
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs font-bold text-muted-foreground uppercase">
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Contato</th>
                    <th className="px-4 py-3 text-left">Cidade</th>
                    <th className="px-4 py-3 text-right">Compras</th>
                    <th className="px-4 py-3 text-right">Total Gasto</th>
                    <th className="px-4 py-3 text-left">Última Compra</th>
                    <th className="px-4 py-3 text-center">Garantias</th>
                    <th className="px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clientesFiltrados.map((c) => {
                    const vendasInfo = vendasPorCliente[c.id];
                    const garantiasAtivas = garantiasPorCliente[c.id] ?? 0;
                    return (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => abrirDetalhe(c)}
                            className="flex items-center gap-3 text-left group"
                          >
                            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                              {c.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground group-hover:text-primary group-hover:underline transition-colors">
                                {c.nome}
                              </p>
                              <p className="text-[11px] text-muted-foreground">{vendasInfo?.qtd ?? 0} compra(s)</p>
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <Phone size={12} /> {c.telefone || c.whatsapp || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{c.cidade || "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold">{vendasInfo?.qtd ?? 0}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">
                          R$ {(vendasInfo?.total ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {vendasInfo?.ultima ? new Date(vendasInfo.ultima).toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {garantiasAtivas > 0 ? (
                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-none text-[10px] font-bold">
                              {garantiasAtivas} ativa(s)
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Nenhuma</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" title="Editar" onClick={() => abrirEdicao(c)}>
                              <Edit2 size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Excluir" onClick={() => handleExcluir(c)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
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

      {/* Dialog Novo/Editar Cliente */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSalvar}>
            <DialogHeader>
              <DialogTitle>{editando ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
              <DialogDescription>Preencha os dados do cliente.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3.5 py-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Nome completo *</label>
                <Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Telefone</label>
                  <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(21) 99999-9999" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">WhatsApp</label>
                  <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(21) 99999-9999" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">CPF</label>
                <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Endereço</label>
                <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Bairro</label>
                  <Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Cidade</label>
                  <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">CEP</label>
                  <Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Observações</label>
                <Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </div>

              {erro && <p className="text-xs text-destructive">{erro}</p>}
            </div>

            <DialogFooter>
              <DialogClose>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={salvando} className="gap-1.5">
                {salvando && <Loader2 size={14} className="animate-spin" />}
                {editando ? "Salvar alterações" : "Cadastrar cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: detalhes do cliente + histórico de compras */}
      <Dialog open={clienteDetalhe !== null} onOpenChange={(aberto) => !aberto && setClienteDetalhe(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                {clienteDetalhe?.nome.charAt(0).toUpperCase()}
              </div>
              {clienteDetalhe?.nome}
            </DialogTitle>
            <DialogDescription>Dados do cliente e histórico de compras</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {/* Dados do cliente */}
            <div className="rounded-lg border border-border bg-muted/20 p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Phone size={12} className="shrink-0" />
                {clienteDetalhe?.telefone || clienteDetalhe?.whatsapp || "Sem telefone"}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <IdCard size={12} className="shrink-0" />
                {clienteDetalhe?.cpf || "Sem CPF"}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground sm:col-span-2">
                <MapPin size={12} className="shrink-0" />
                {[clienteDetalhe?.endereco, clienteDetalhe?.bairro, clienteDetalhe?.cidade]
                  .filter(Boolean)
                  .join(", ") || "Sem endereço"}
                {clienteDetalhe?.cep ? ` — ${clienteDetalhe.cep}` : ""}
              </div>
              {clienteDetalhe?.observacoes && (
                <div className="flex items-start gap-1.5 text-muted-foreground sm:col-span-2">
                  <StickyNote size={12} className="shrink-0 mt-0.5" />
                  {clienteDetalhe.observacoes}
                </div>
              )}
            </div>

            {/* Resumo rápido */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border p-2.5 text-center">
                <p className="text-lg font-extrabold">{comprasDetalhe.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Compras</p>
              </div>
              <div className="rounded-lg border border-border p-2.5 text-center">
                <p className="text-lg font-extrabold text-emerald-600">
                  R${" "}
                  {comprasDetalhe
                    .reduce((acc, v) => acc + v.total, 0)
                    .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Total gasto</p>
              </div>
              <div className="rounded-lg border border-border p-2.5 text-center">
                <p className="text-lg font-extrabold text-blue-600">{osDetalhe.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Ordens de serviço</p>
              </div>
              <div className="rounded-lg border border-border p-2.5 text-center">
                <p className="text-lg font-extrabold text-indigo-600">
                  {garantiasPorCliente[clienteDetalhe?.id ?? ""] ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Garantias ativas</p>
              </div>
            </div>

            {/* Histórico de compras */}
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                <ShoppingBag size={13} /> Histórico de compras
              </p>

              {erroDetalhe && (
                <div className="flex items-center gap-2 rounded-md border border-red-900/30 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-700 dark:text-red-300 mb-2">
                  <AlertCircle size={13} className="shrink-0" /> {erroDetalhe}
                </div>
              )}

              {loadingDetalhe ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                  <Loader2 className="animate-spin" size={16} /> Carregando compras...
                </div>
              ) : comprasDetalhe.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Este cliente ainda não fez nenhuma compra.
                </p>
              ) : (
                <div className="space-y-3">
                  {comprasDetalhe.map((venda) => (
                    <div key={venda.id} className="rounded-lg border border-border overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/30 px-3 py-2">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 font-semibold">
                            <Calendar size={12} />
                            {new Date(venda.data).toLocaleDateString("pt-BR")}{" "}
                            {new Date(venda.data).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <CreditCard size={12} /> {venda.formaPagamento}
                          </span>
                          <span className="text-muted-foreground">
                            Vendedor(a): {venda.vendedorNome}
                          </span>
                        </div>
                        <span className="font-extrabold text-emerald-600 text-sm">
                          R$ {venda.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="divide-y divide-border">
                        {venda.itens.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Package size={12} className="text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {item.quantidade}x {item.produtoNome}
                                </p>
                                {item.numeroSerie && (
                                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Hash size={10} /> {item.numeroSerie}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="font-semibold shrink-0">
                              R${" "}
                              {(item.precoUnitario * item.quantidade).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        ))}
                      </div>

                      {venda.desconto > 0 && (
                        <div className="px-3 py-1.5 text-[11px] text-muted-foreground border-t border-border bg-muted/10">
                          Desconto aplicado: R${" "}
                          {venda.desconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Histórico de ordens de serviço */}
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                <Wrench size={13} /> Ordens de serviço
              </p>

              {loadingDetalhe ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                  <Loader2 className="animate-spin" size={16} /> Carregando ordens de serviço...
                </div>
              ) : osDetalhe.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Este cliente ainda não tem nenhuma ordem de serviço.
                </p>
              ) : (
                <div className="space-y-3">
                  {osDetalhe.map((os) => (
                    <div key={os.id} className="rounded-lg border border-border overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/30 px-3 py-2">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-semibold">OS #{os.numero}</span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar size={12} />
                            {new Date(os.dataEntrada).toLocaleDateString("pt-BR")}
                          </span>
                          <span className="text-muted-foreground">
                            {os.marcaMaquina} {os.modeloMaquina}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold border-none ${corStatusOS(os.status)}`}
                          >
                            {os.status}
                          </Badge>
                          <span className="font-extrabold text-emerald-600 text-sm">
                            R$ {os.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <div className="px-3 py-2.5 space-y-1.5 text-xs">
                        {os.numeroSerie && (
                          <p className="flex items-center gap-1.5 text-muted-foreground">
                            <Hash size={11} /> Número de série: {os.numeroSerie}
                          </p>
                        )}
                        <p>
                          <span className="font-semibold text-muted-foreground">Defeito informado: </span>
                          {os.defeitoInformado}
                        </p>
                        {os.diagnostico && (
                          <p>
                            <span className="font-semibold text-muted-foreground">Diagnóstico: </span>
                            {os.diagnostico}
                          </p>
                        )}
                        {os.servicoExecutado && (
                          <p>
                            <span className="font-semibold text-muted-foreground">Serviço executado: </span>
                            {os.servicoExecutado}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-muted-foreground">
                          <span>Mão de obra: R$ {os.valorMaoObra.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          <span>Peças: R$ {os.valorPecas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          {os.dataEntrega && (
                            <span>
                              Entregue em {new Date(os.dataEntrega).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setClienteDetalhe(null)}>
              Fechar
            </Button>
            {clienteDetalhe && (
              <Button
                onClick={() => {
                  const c = clienteDetalhe;
                  setClienteDetalhe(null);
                  abrirEdicao(c);
                }}
                className="gap-1.5"
              >
                <Edit2 size={14} /> Editar cliente
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
