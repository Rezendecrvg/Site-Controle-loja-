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
  Plus,
  Search,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Edit2,
  Timer,
  Loader2,
  X,
} from "lucide-react";

type StatusOS =
  | "Recebida"
  | "Em análise"
  | "Aguardando aprovação"
  | "Aguardando peças"
  | "Em manutenção"
  | "Teste"
  | "Pronta para retirada"
  | "Entregue"
  | "Cancelada";

const STATUS_OPCOES: StatusOS[] = [
  "Recebida",
  "Em análise",
  "Aguardando aprovação",
  "Aguardando peças",
  "Em manutenção",
  "Teste",
  "Pronta para retirada",
  "Entregue",
  "Cancelada",
];

const statusColors: Record<StatusOS, string> = {
  Recebida: "bg-slate-500/10 text-slate-600 border-none",
  "Em análise": "bg-blue-500/10 text-blue-600 border-none",
  "Aguardando aprovação": "bg-amber-500/10 text-amber-600 border-none",
  "Aguardando peças": "bg-orange-500/10 text-orange-600 border-none",
  "Em manutenção": "bg-indigo-500/10 text-indigo-600 border-none",
  Teste: "bg-purple-500/10 text-purple-600 border-none",
  "Pronta para retirada": "bg-emerald-500/10 text-emerald-600 border-none",
  Entregue: "bg-slate-200 text-slate-500 border-none",
  Cancelada: "bg-destructive/10 text-destructive border-none",
};

interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
}

interface OS {
  id: string;
  numero: number;
  cliente_id: string;
  marca_maquina: string;
  modelo_maquina: string;
  numero_serie: string | null;
  cor_maquina: string | null;
  estado_geral: string | null;
  acessorios_entregues: string | null;
  defeito_informado: string;
  diagnostico: string | null;
  servico_executado: string | null;
  valor_mao_obra: number;
  valor_pecas: number;
  valor_total: number;
  status: StatusOS;
  data_entrada: string;
  previsao_entrega: string | null;
  data_entrega: string | null;
  garantia_dias: number;
  clientes?: { nome: string; telefone: string | null } | null;
}

const FORM_NOVA_VAZIO = {
  cliente_id: "",
  marca_maquina: "",
  modelo_maquina: "",
  numero_serie: "",
  cor_maquina: "",
  estado_geral: "",
  acessorios_entregues: "",
  defeito_informado: "",
  previsao_entrega: "",
  garantia_dias: "30",
};

export default function OSPage() {
  const [ordens, setOrdens] = useState<OS[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusOS | "todos">("todos");

  // Dialog Nova OS
  const [dialogNovaAberto, setDialogNovaAberto] = useState(false);
  const [salvandoNova, setSalvandoNova] = useState(false);
  const [formNova, setFormNova] = useState(FORM_NOVA_VAZIO);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false);

  // Dialog Atualizar/Detalhes
  const [osSelecionada, setOsSelecionada] = useState<OS | null>(null);
  const [dialogDetalheAberto, setDialogDetalheAberto] = useState(false);
  const [salvandoDetalhe, setSalvandoDetalhe] = useState(false);
  const [formDetalhe, setFormDetalhe] = useState({
    status: "Recebida" as StatusOS,
    diagnostico: "",
    servico_executado: "",
    valor_mao_obra: "0",
    valor_pecas: "0",
    previsao_entrega: "",
  });

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro(null);

    const [{ data: osData, error: osErro }, { data: clientesData }] = await Promise.all([
      supabase
        .from("ordens_servico")
        .select("*, clientes(nome, telefone)")
        .order("data_entrada", { ascending: false }),
      supabase.from("clientes").select("id, nome, telefone").order("nome"),
    ]);

    if (osErro) {
      setErro("Não foi possível carregar as ordens de serviço: " + osErro.message);
      setLoading(false);
      return;
    }

    setOrdens((osData ?? []) as unknown as OS[]);
    setClientes((clientesData ?? []) as Cliente[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const clientesFiltrados = useMemo(() => {
    if (!buscaCliente.trim()) return [];
    const termo = buscaCliente.toLowerCase();
    return clientes.filter((c) => c.nome.toLowerCase().includes(termo)).slice(0, 6);
  }, [clientes, buscaCliente]);

  const abrirNovaOS = () => {
    setFormNova(FORM_NOVA_VAZIO);
    setClienteSelecionado(null);
    setBuscaCliente("");
    setErro(null);
    setDialogNovaAberto(true);
  };

  const selecionarCliente = (c: Cliente) => {
    setClienteSelecionado(c);
    setBuscaCliente(c.nome);
    setMostrarListaClientes(false);
  };

  const handleCriarOS = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!clienteSelecionado) {
      setErro("Selecione o cliente dono da máquina.");
      return;
    }
    if (!formNova.marca_maquina.trim() || !formNova.modelo_maquina.trim() || !formNova.defeito_informado.trim()) {
      setErro("Marca, modelo e defeito informado são obrigatórios.");
      return;
    }

    setSalvandoNova(true);
    const { error } = await supabase.from("ordens_servico").insert({
      cliente_id: clienteSelecionado.id,
      marca_maquina: formNova.marca_maquina.trim(),
      modelo_maquina: formNova.modelo_maquina.trim(),
      numero_serie: formNova.numero_serie.trim() || null,
      cor_maquina: formNova.cor_maquina.trim() || null,
      estado_geral: formNova.estado_geral.trim() || null,
      acessorios_entregues: formNova.acessorios_entregues.trim() || null,
      defeito_informado: formNova.defeito_informado.trim(),
      previsao_entrega: formNova.previsao_entrega || null,
      garantia_dias: Number(formNova.garantia_dias) || 30,
    });

    setSalvandoNova(false);
    if (error) {
      setErro("Erro ao criar OS: " + error.message);
      return;
    }
    setDialogNovaAberto(false);
    carregarDados();
  };

  const abrirDetalhe = (os: OS) => {
    setOsSelecionada(os);
    setFormDetalhe({
      status: os.status,
      diagnostico: os.diagnostico ?? "",
      servico_executado: os.servico_executado ?? "",
      valor_mao_obra: String(os.valor_mao_obra),
      valor_pecas: String(os.valor_pecas),
      previsao_entrega: os.previsao_entrega ? os.previsao_entrega.slice(0, 10) : "",
    });
    setErro(null);
    setDialogDetalheAberto(true);
  };

  const handleSalvarDetalhe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osSelecionada) return;
    setErro(null);
    setSalvandoDetalhe(true);

    const maoObra = Number(formDetalhe.valor_mao_obra) || 0;
    const pecas = Number(formDetalhe.valor_pecas) || 0;
    const total = maoObra + pecas;
    const passandoParaEntregue = formDetalhe.status === "Entregue" && osSelecionada.status !== "Entregue";

    const payload: Record<string, unknown> = {
      status: formDetalhe.status,
      diagnostico: formDetalhe.diagnostico.trim() || null,
      servico_executado: formDetalhe.servico_executado.trim() || null,
      valor_mao_obra: maoObra,
      valor_pecas: pecas,
      valor_total: total,
      previsao_entrega: formDetalhe.previsao_entrega || null,
    };

    if (passandoParaEntregue) {
      payload.data_entrega = new Date().toISOString();
    }

    const { error } = await supabase.from("ordens_servico").update(payload).eq("id", osSelecionada.id);

    if (error) {
      setSalvandoDetalhe(false);
      setErro("Erro ao salvar: " + error.message);
      return;
    }

    // Ao entregar, gera automaticamente a garantia do serviço
    if (passandoParaEntregue) {
      const dataFim = new Date();
      dataFim.setDate(dataFim.getDate() + (osSelecionada.garantia_dias || 30));
      await supabase.from("garantias").insert({
        cliente_id: osSelecionada.cliente_id,
        origem: "Ordem de Serviço",
        origem_id: osSelecionada.id,
        tipo: "Serviço",
        data_fim: dataFim.toISOString().slice(0, 10),
        status: "Ativa",
      });
    }

    setSalvandoDetalhe(false);
    setDialogDetalheAberto(false);
    carregarDados();
  };

  const osFiltradas = ordens.filter((os) => {
    const termo = busca.toLowerCase();
    const matchBusca =
      (os.clientes?.nome ?? "").toLowerCase().includes(termo) ||
      os.marca_maquina.toLowerCase().includes(termo) ||
      os.modelo_maquina.toLowerCase().includes(termo) ||
      String(os.numero).includes(busca);
    const matchStatus = filtroStatus === "todos" || os.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const abertas = ordens.filter((os) => os.status !== "Entregue" && os.status !== "Cancelada").length;
  const prontas = ordens.filter((os) => os.status === "Pronta para retirada").length;
  const emManutencao = ordens.filter((os) => os.status === "Em manutenção" || os.status === "Aguardando peças").length;

  const hojeStr = new Date().toDateString();
  const entreguesHoje = ordens.filter((os) => os.data_entrega && new Date(os.data_entrega).toDateString() === hojeStr).length;

  const diasAberta = (os: OS) => {
    const fim = os.data_entrega ? new Date(os.data_entrega) : new Date();
    const inicio = new Date(os.data_entrada);
    return Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ordens de Serviço</h1>
          <p className="text-muted-foreground text-sm">Assistência técnica e acompanhamento de manutenções</p>
        </div>
        <Button className="gap-2 font-semibold shadow-sm" onClick={abrirNovaOS}>
          <Plus size={16} /> Nova Ordem de Serviço
        </Button>
      </div>

      {erro && !dialogNovaAberto && !dialogDetalheAberto && (
        <div className="rounded-md border border-red-900/30 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
          {erro}
        </div>
      )}

      {/* Cards de Status */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Wrench size={16} className="text-indigo-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">OS Abertas</span>
          </div>
          <p className="text-2xl font-extrabold text-indigo-600">{abertas}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Prontas p/ Retirada</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{prontas}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Timer size={16} className="text-amber-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Em Manutenção</span>
          </div>
          <p className="text-2xl font-extrabold text-amber-500">{emManutencao}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-slate-400" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Entregues Hoje</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-500">{entreguesHoje}</p>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nº OS, cliente, marca ou modelo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["todos", "Pronta para retirada", "Em manutenção", "Aguardando peças", "Em análise"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFiltroStatus(s as StatusOS | "todos")}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                    filtroStatus === s
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s === "todos" ? "Todas" : s}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de OS em Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="animate-spin" size={18} /> Carregando ordens de serviço...
        </div>
      ) : osFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
          <Wrench size={28} className="opacity-40" />
          <p className="text-sm">Nenhuma ordem de serviço encontrada.</p>
          <Button size="sm" variant="outline" className="gap-1.5 mt-2" onClick={abrirNovaOS}>
            <Plus size={14} /> Criar a primeira OS
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {osFiltradas.map((os) => (
            <Card
              key={os.id}
              className={`shadow-sm border-border hover:shadow-md transition-shadow ${
                os.status === "Pronta para retirada" ? "ring-1 ring-emerald-500/30" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-primary text-sm">OS #{os.numero}</span>
                      {diasAberta(os) > 7 && os.status !== "Entregue" && os.status !== "Cancelada" && (
                        <AlertTriangle size={12} className="text-amber-500" />
                      )}
                    </div>
                    <p className="font-semibold text-sm text-foreground mt-0.5">{os.clientes?.nome ?? "—"}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-bold shrink-0 ${statusColors[os.status]}`}>
                    {os.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <Wrench size={14} className="text-muted-foreground shrink-0" />
                  <span className="font-semibold">{os.marca_maquina} {os.modelo_maquina}</span>
                </div>
                <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">
                  &quot;{os.defeito_informado}&quot;
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="text-[11px]">
                    <p className="text-muted-foreground">Entrada</p>
                    <p className="font-semibold">{new Date(os.data_entrada).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="text-[11px]">
                    <p className="text-muted-foreground">Previsão</p>
                    <p className="font-semibold">
                      {os.previsao_entrega ? new Date(os.previsao_entrega).toLocaleDateString("pt-BR") : "—"}
                    </p>
                  </div>
                </div>
                {os.valor_total > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-xs text-muted-foreground font-semibold">Total da OS</span>
                    <span className="text-sm font-extrabold text-primary">
                      R$ {Number(os.valor_total).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={() => abrirDetalhe(os)}>
                    <Edit2 size={12} /> Ver / Atualizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Nova OS */}
      <Dialog open={dialogNovaAberto} onOpenChange={setDialogNovaAberto}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleCriarOS}>
            <DialogHeader>
              <DialogTitle>Nova Ordem de Serviço</DialogTitle>
              <DialogDescription>Registre a entrada de uma máquina para manutenção.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3.5 py-4 max-h-[65vh] overflow-y-auto pr-1">
              <div className="space-y-1.5 relative">
                <label className="text-xs font-semibold text-muted-foreground">Cliente *</label>
                <div className="relative">
                  <Input
                    placeholder="Buscar cliente cadastrado..."
                    value={buscaCliente}
                    onChange={(e) => {
                      setBuscaCliente(e.target.value);
                      setClienteSelecionado(null);
                      setMostrarListaClientes(true);
                    }}
                    onFocus={() => setMostrarListaClientes(true)}
                    className="pr-8"
                  />
                  {clienteSelecionado && (
                    <button
                      type="button"
                      onClick={() => { setClienteSelecionado(null); setBuscaCliente(""); }}
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {mostrarListaClientes && clientesFiltrados.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-0.5 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                    {clientesFiltrados.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => selecionarCliente(c)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center justify-between"
                      >
                        <span className="font-medium">{c.nome}</span>
                        <span className="text-muted-foreground">{c.telefone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Marca *</label>
                  <Input required value={formNova.marca_maquina} onChange={(e) => setFormNova({ ...formNova, marca_maquina: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Modelo *</label>
                  <Input required value={formNova.modelo_maquina} onChange={(e) => setFormNova({ ...formNova, modelo_maquina: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Número de série</label>
                  <Input value={formNova.numero_serie} onChange={(e) => setFormNova({ ...formNova, numero_serie: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Cor</label>
                  <Input value={formNova.cor_maquina} onChange={(e) => setFormNova({ ...formNova, cor_maquina: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Estado geral da máquina</label>
                <Input value={formNova.estado_geral} onChange={(e) => setFormNova({ ...formNova, estado_geral: e.target.value })} placeholder="Ex: Riscos na base, sem tampa lateral" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Acessórios entregues junto</label>
                <Input value={formNova.acessorios_entregues} onChange={(e) => setFormNova({ ...formNova, acessorios_entregues: e.target.value })} placeholder="Ex: Pedal, cabo, maleta" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Defeito informado pelo cliente *</label>
                <Input required value={formNova.defeito_informado} onChange={(e) => setFormNova({ ...formNova, defeito_informado: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Previsão de entrega</label>
                  <Input type="date" value={formNova.previsao_entrega} onChange={(e) => setFormNova({ ...formNova, previsao_entrega: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Garantia do serviço (dias)</label>
                  <Input type="number" min="0" value={formNova.garantia_dias} onChange={(e) => setFormNova({ ...formNova, garantia_dias: e.target.value })} />
                </div>
              </div>

              {erro && <p className="text-xs text-destructive">{erro}</p>}
            </div>

            <DialogFooter>
              <DialogClose>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={salvandoNova} className="gap-1.5">
                {salvandoNova && <Loader2 size={14} className="animate-spin" />}
                Criar OS
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhe / Atualizar Status */}
      <Dialog open={dialogDetalheAberto} onOpenChange={setDialogDetalheAberto}>
        <DialogContent className="sm:max-w-lg">
          {osSelecionada && (
            <form onSubmit={handleSalvarDetalhe}>
              <DialogHeader>
                <DialogTitle>OS #{osSelecionada.numero} — {osSelecionada.clientes?.nome}</DialogTitle>
                <DialogDescription>
                  {osSelecionada.marca_maquina} {osSelecionada.modelo_maquina} · Defeito: &quot;{osSelecionada.defeito_informado}&quot;
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3.5 py-4 max-h-[60vh] overflow-y-auto pr-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Status</label>
                  <select
                    value={formDetalhe.status}
                    onChange={(e) => setFormDetalhe({ ...formDetalhe, status: e.target.value as StatusOS })}
                    className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {STATUS_OPCOES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {formDetalhe.status === "Entregue" && osSelecionada.status !== "Entregue" && (
                    <p className="text-[11px] text-emerald-600">
                      ✓ Ao salvar, a garantia de {osSelecionada.garantia_dias} dias será gerada automaticamente para o cliente.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Diagnóstico técnico</label>
                  <Input value={formDetalhe.diagnostico} onChange={(e) => setFormDetalhe({ ...formDetalhe, diagnostico: e.target.value })} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Serviço executado</label>
                  <Input value={formDetalhe.servico_executado} onChange={(e) => setFormDetalhe({ ...formDetalhe, servico_executado: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Valor mão de obra (R$)</label>
                    <Input type="number" step="0.01" min="0" value={formDetalhe.valor_mao_obra} onChange={(e) => setFormDetalhe({ ...formDetalhe, valor_mao_obra: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Valor peças (R$)</label>
                    <Input type="number" step="0.01" min="0" value={formDetalhe.valor_pecas} onChange={(e) => setFormDetalhe({ ...formDetalhe, valor_pecas: e.target.value })} />
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 px-3 py-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Total da OS</span>
                  <span className="text-sm font-extrabold text-primary">
                    R$ {((Number(formDetalhe.valor_mao_obra) || 0) + (Number(formDetalhe.valor_pecas) || 0)).toFixed(2).replace(".", ",")}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Previsão de entrega</label>
                  <Input type="date" value={formDetalhe.previsao_entrega} onChange={(e) => setFormDetalhe({ ...formDetalhe, previsao_entrega: e.target.value })} />
                </div>

                {erro && <p className="text-xs text-destructive">{erro}</p>}
              </div>

              <DialogFooter>
                <DialogClose>
                  <Button type="button" variant="outline">Fechar</Button>
                </DialogClose>
                <Button type="submit" disabled={salvandoDetalhe} className="gap-1.5">
                  {salvandoDetalhe && <Loader2 size={14} className="animate-spin" />}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
