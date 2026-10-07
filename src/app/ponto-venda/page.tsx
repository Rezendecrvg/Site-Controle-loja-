"use client";

import React, { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { notificarVendaNova } from "@/lib/notificacoes-service";
import {
  hojeLocalISO,
  inicioDoDiaLocalISO,
  intervaloDoDiaLocalISO,
  dataLocalISO,
  formatarDataBR,
} from "@/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  CheckCircle,
  CheckCircle2,
  X,
  Trash2,
  ShoppingCart,
  ShoppingBag,
  User2,
  UserPlus,
  Loader2,
  AlertCircle,
  Clock,
  LogOut,
  RefreshCw,
  Shield,
  Hash,
  CalendarDays,
  History,
  CreditCard,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ============================================================
// INTERFACES COMPARTILHADAS
// ============================================================
interface Produto {
  id: string;
  nome: string;
  preco_venda: number;
  quantidade: number;
  exige_cliente: boolean;
  gera_garantia: boolean;
  exige_numero_serie: boolean;
  categorias?: { nome: string } | null;
}

interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
}

interface ItemCarrinho {
  linhaId: string;
  produtoId: string;
  nome: string;
  preco: number;
  quantidade: number;
  estoqueDisponivel: number;
  exigeCliente: boolean;
  geraGarantia: boolean;
  exigeSerie: boolean;
  numeroSerie: string;
}

interface CaixaAtual {
  id: string;
  data: string;
  valor_abertura: number;
  status: string;
  criado_em: string;
  usuario_abertura_id: string;
}

interface VendaDoDia {
  id: string;
  total: number;
  data: string;
  forma_pagamento: string;
  vendedor_id: string;
  vendedorNome: string;
}

interface MovimentacaoCaixa {
  id: string;
  tipo: string;
  valor: number;
  motivo: string;
  data: string;
  responsavelNome: string;
}

const formasPagamento = [
  "Dinheiro",
  "Pix",
  "Cartão de Débito",
  "Cartão de Crédito",
  "Transferência",
] as const;

const SEM_CATEGORIA = "Sem categoria";

function moeda(valor: number): string {
  return valor.toFixed(2).replace(".", ",");
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// COMPONENTE PRINCIPAL — controla as abas
// ============================================================
export default function PontoVendaPage() {
  return (
    <Suspense fallback={null}>
      <PontoVendaInner />
    </Suspense>
  );
}

function PontoVendaInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const abaInicial = searchParams.get("aba") === "caixa" ? "caixa" : "pdv";
  const [abaAtiva, setAbaAtiva] = useState<"pdv" | "caixa">(abaInicial);

  const trocarAba = (aba: "pdv" | "caixa") => {
    setAbaAtiva(aba);
    router.replace(`/ponto-venda${aba === "caixa" ? "?aba=caixa" : ""}`, { scroll: false });
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Caixa / PDV</h1>
          <p className="text-muted-foreground text-sm">
            Tela principal de atendimento: venda no balcão e controle do caixa
          </p>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl border border-border bg-muted/40 w-fit">
        <button
          onClick={() => trocarAba("pdv")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            abaAtiva === "pdv"
              ? "bg-background text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-background/60"
          }`}
        >
          <ShoppingCart size={15} />
          Venda (PDV)
        </button>
        <button
          onClick={() => trocarAba("caixa")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            abaAtiva === "caixa"
              ? "bg-background text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-background/60"
          }`}
        >
          <Wallet size={15} />
          Caixa
        </button>
      </div>

      {abaAtiva === "pdv" ? <AbaPDV irParaCaixa={() => trocarAba("caixa")} /> : <AbaCaixa />}
    </div>
  );
}

// ============================================================
// ABA 1: PONTO DE VENDA
// ============================================================
function AbaPDV({ irParaCaixa }: { irParaCaixa: () => void }) {
  const { user } = useAuth();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [finalizando, setFinalizando] = useState(false);

  const [buscaProduto, setBuscaProduto] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("Todos");
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [formaPagamento, setFormaPagamento] =
    useState<(typeof formasPagamento)[number]>("Dinheiro");
  const [desconto, setDesconto] = useState(0);

  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false);

  const [dialogNovoCliente, setDialogNovoCliente] = useState(false);
  const [novoCliente, setNovoCliente] = useState({ nome: "", telefone: "", cpf: "" });
  const [salvandoCliente, setSalvandoCliente] = useState(false);
  const [erroCliente, setErroCliente] = useState<string | null>(null);

  const [vendaFinalizada, setVendaFinalizada] = useState(false);
  const [resumoHoje, setResumoHoje] = useState({ total: 0, qtd: 0 });

  const [caixaAberto, setCaixaAberto] = useState(false);
  const [dialogAbrirCaixaAberto, setDialogAbrirCaixaAberto] = useState(false);
  const [valorAbertura, setValorAbertura] = useState("0");
  const [abrindoCaixa, setAbrindoCaixa] = useState(false);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro(null);

    const inicioHojeISO = inicioDoDiaLocalISO();

    const [
      { data: produtosData, error: produtosErro },
      { data: clientesData },
      { data: caixaData },
      { data: vendasHojeData },
    ] = await Promise.all([
      supabase
        .from("produtos")
        .select(
          "id, nome, preco_venda, quantidade, exige_cliente, gera_garantia, exige_numero_serie, categorias(nome)"
        )
        .eq("ativo", true)
        .order("nome"),
      supabase.from("clientes").select("id, nome, telefone").order("nome"),
      supabase.from("caixa").select("*").eq("status", "Aberto").maybeSingle(),
      supabase
        .from("vendas")
        .select("total, data")
        .eq("status", "Finalizada")
        .gte("data", inicioHojeISO),
    ]);

    if (produtosErro) {
      setErro("Erro ao carregar produtos: " + produtosErro.message);
      setLoading(false);
      return;
    }

    setProdutos((produtosData ?? []) as unknown as Produto[]);
    setClientes((clientesData ?? []) as Cliente[]);
    setCaixaAberto(Boolean(caixaData));

    setResumoHoje({
      total: (vendasHojeData ?? []).reduce((a, v) => a + Number(v.total), 0),
      qtd: (vendasHojeData ?? []).length,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // --------------------------------------------------------
  // Categorias (lado esquerdo)
  // --------------------------------------------------------
  const categorias = useMemo(() => {
    const nomes = new Set<string>();
    produtos.forEach((p) => nomes.add(p.categorias?.nome ?? SEM_CATEGORIA));
    return ["Todos", ...Array.from(nomes).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    const termo = buscaProduto.toLowerCase().trim();
    return produtos.filter((p) => {
      if (p.quantidade <= 0) return false;
      const categoriaProduto = p.categorias?.nome ?? SEM_CATEGORIA;
      if (categoriaAtiva !== "Todos" && categoriaProduto !== categoriaAtiva) return false;
      if (!termo) return true;
      return (
        p.nome.toLowerCase().includes(termo) || categoriaProduto.toLowerCase().includes(termo)
      );
    });
  }, [produtos, buscaProduto, categoriaAtiva]);

  const clientesFiltrados = useMemo(() => {
    if (!buscaCliente.trim()) return [];
    const termo = buscaCliente.toLowerCase();
    return clientes.filter((c) => c.nome.toLowerCase().includes(termo)).slice(0, 6);
  }, [clientes, buscaCliente]);

  // --------------------------------------------------------
  // Carrinho
  // --------------------------------------------------------
  const quantidadeNoCarrinho = useCallback(
    (produtoId: string) =>
      carrinho.filter((c) => c.produtoId === produtoId).reduce((acc, c) => acc + c.quantidade, 0),
    [carrinho]
  );

  const adicionarAoCarrinho = (produto: Produto) => {
    setErro(null);

    const jaNoCarrinho = quantidadeNoCarrinho(produto.id);
    if (jaNoCarrinho >= produto.quantidade) {
      setErro(`Estoque insuficiente para "${produto.nome}".`);
      return;
    }

    // Produtos com número de série são vendidos por unidade:
    // cada unidade vira uma linha própria, com o seu próprio número.
    if (produto.exige_numero_serie) {
      setCarrinho((prev) => [
        ...prev,
        {
          linhaId: `${produto.id}-${Date.now()}-${prev.length}`,
          produtoId: produto.id,
          nome: produto.nome,
          preco: Number(produto.preco_venda),
          quantidade: 1,
          estoqueDisponivel: produto.quantidade,
          exigeCliente: produto.exige_cliente,
          geraGarantia: produto.gera_garantia,
          exigeSerie: true,
          numeroSerie: "",
        },
      ]);
      return;
    }

    setCarrinho((prev) => {
      const existente = prev.find((c) => c.produtoId === produto.id);
      if (existente) {
        return prev.map((c) =>
          c.produtoId === produto.id ? { ...c, quantidade: c.quantidade + 1 } : c
        );
      }
      return [
        ...prev,
        {
          linhaId: `${produto.id}-${Date.now()}`,
          produtoId: produto.id,
          nome: produto.nome,
          preco: Number(produto.preco_venda),
          quantidade: 1,
          estoqueDisponivel: produto.quantidade,
          exigeCliente: produto.exige_cliente,
          geraGarantia: produto.gera_garantia,
          exigeSerie: false,
          numeroSerie: "",
        },
      ];
    });
  };

  const removerDoCarrinho = (linhaId: string) =>
    setCarrinho((prev) => prev.filter((c) => c.linhaId !== linhaId));

  const alterarQuantidade = (linhaId: string, delta: number) => {
    setErro(null);
    setCarrinho((prev) =>
      prev
        .map((c) => {
          if (c.linhaId !== linhaId) return c;
          if (c.exigeSerie) return c; // sempre 1 unidade por linha
          const novaQtd = c.quantidade + delta;
          if (novaQtd > c.estoqueDisponivel) return c;
          return { ...c, quantidade: novaQtd };
        })
        .filter((c) => c.quantidade > 0)
    );
  };

  const definirNumeroSerie = (linhaId: string, valor: string) =>
    setCarrinho((prev) =>
      prev.map((c) => (c.linhaId === linhaId ? { ...c, numeroSerie: valor } : c))
    );

  const subtotal = carrinho.reduce((acc, c) => acc + c.preco * c.quantidade, 0);
  const total = Math.max(0, subtotal - desconto);

  const exigeCliente = carrinho.some((c) => c.exigeCliente);
  const geraGarantia = carrinho.some((c) => c.geraGarantia);
  const seriesPendentes = carrinho.filter((c) => c.exigeSerie && !c.numeroSerie.trim()).length;

  // --------------------------------------------------------
  // Cliente
  // --------------------------------------------------------
  const selecionarCliente = (c: Cliente) => {
    setClienteSelecionado(c);
    setBuscaCliente(c.nome);
    setMostrarListaClientes(false);
  };

  const limparCliente = () => {
    setClienteSelecionado(null);
    setBuscaCliente("");
  };

  const abrirDialogNovoCliente = () => {
    setNovoCliente({ nome: buscaCliente.trim(), telefone: "", cpf: "" });
    setErroCliente(null);
    setDialogNovoCliente(true);
  };

  const salvarNovoCliente = async () => {
    if (!novoCliente.nome.trim()) {
      setErroCliente("Informe o nome do cliente.");
      return;
    }

    setSalvandoCliente(true);
    setErroCliente(null);

    const { data, error } = await supabase
      .from("clientes")
      .insert({
        nome: novoCliente.nome.trim(),
        telefone: novoCliente.telefone.trim() || null,
        whatsapp: novoCliente.telefone.trim() || null,
        cpf: novoCliente.cpf.trim() || null,
      })
      .select("id, nome, telefone")
      .single();

    setSalvandoCliente(false);

    if (error || !data) {
      setErroCliente("Erro ao cadastrar cliente: " + (error?.message ?? "tente novamente"));
      return;
    }

    const cliente = data as Cliente;
    setClientes((prev) =>
      [...prev, cliente].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    );
    selecionarCliente(cliente);
    setDialogNovoCliente(false);
  };

  // --------------------------------------------------------
  // Caixa
  // --------------------------------------------------------
  const abrirCaixa = async () => {
    if (!user) return;
    setErro(null);
    setAbrindoCaixa(true);

    const { error } = await supabase.from("caixa").insert({
      usuario_abertura_id: user.id,
      valor_abertura: Number(valorAbertura),
      status: "Aberto",
      data: hojeLocalISO(),
    });

    setAbrindoCaixa(false);

    if (error) {
      setErro("Erro ao abrir caixa: " + error.message);
      return;
    }

    setDialogAbrirCaixaAberto(false);
    setValorAbertura("0");
    carregarDados();
  };

  // --------------------------------------------------------
  // Finalizar venda
  // --------------------------------------------------------
  const finalizarVenda = async () => {
    if (carrinho.length === 0 || !user) return;

    if (!caixaAberto) {
      setErro("É necessário abrir o caixa antes de fazer vendas.");
      return;
    }

    if (exigeCliente && !clienteSelecionado) {
      setErro(
        "Esta venda tem produto que exige cliente identificado. Selecione ou cadastre o cliente."
      );
      return;
    }

    if (seriesPendentes > 0) {
      setErro("Informe o número de série de todos os produtos que exigem.");
      return;
    }

    setErro(null);
    setFinalizando(true);

    const itens = carrinho.map((c) => ({
      produto_id: c.produtoId,
      quantidade: c.quantidade,
      preco_unitario: c.preco,
      desconto: 0,
      numero_serie: c.exigeSerie ? c.numeroSerie.trim() : null,
    }));

    const { error } = await supabase.rpc("finalizar_venda", {
      p_cliente_id: clienteSelecionado?.id ?? null,
      p_vendedor_id: user.id,
      p_forma_pagamento: formaPagamento,
      p_desconto: desconto,
      p_itens: itens,
    });

    setFinalizando(false);

    if (error) {
      setErro(error.message.replace(/^.*?:\s*/, ""));
      return;
    }

    const nomeCliente = clienteSelecionado?.nome || "Cliente de Balcão";
    notificarVendaNova(nomeCliente, total, user.id);

    setVendaFinalizada(true);
    setCarrinho([]);
    setDesconto(0);
    limparCliente();
    setFormaPagamento("Dinheiro");
    carregarDados();

    setTimeout(() => setVendaFinalizada(false), 3000);
  };

  return (
    <>
      {/* Mini-resumo do dia */}
      <div className="flex gap-4 text-xs flex-wrap">
        <Card className="px-4 py-2 flex items-center gap-2 shadow-sm">
          <Wallet size={16} className={caixaAberto ? "text-emerald-500" : "text-muted-foreground"} />
          <div>
            <p className="text-muted-foreground">Caixa</p>
            <p className="font-bold text-sm">{caixaAberto ? "Aberto" : "Fechado"}</p>
          </div>
        </Card>
        <Card className="px-4 py-2 flex items-center gap-2 shadow-sm">
          <TrendingUp size={16} className="text-emerald-500" />
          <div>
            <p className="text-muted-foreground">Vendido Hoje</p>
            <p className="font-bold text-sm">
              R$ {resumoHoje.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </Card>
        <Card className="px-4 py-2 flex items-center gap-2 shadow-sm">
          <ShoppingBag size={16} className="text-primary" />
          <div>
            <p className="text-muted-foreground">Vendas</p>
            <p className="font-bold text-sm">{resumoHoje.qtd}</p>
          </div>
        </Card>
      </div>

      {vendaFinalizada && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800/40 p-4 shadow-sm mt-4">
          <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0" />
          <div>
            <p className="font-bold text-emerald-700 dark:text-emerald-400">Venda Finalizada!</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
              Estoque atualizado, garantia gerada quando aplicável e venda registrada no caixa.
            </p>
          </div>
        </div>
      )}

      {erro && (
        <div className="flex items-center gap-2 rounded-md border border-red-900/30 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 text-sm text-red-700 dark:text-red-300 mt-4">
          <AlertCircle size={16} className="shrink-0" /> {erro}
        </div>
      )}

      {!caixaAberto && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/40 shadow-sm mt-4">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-amber-700 dark:text-amber-400">Caixa Fechado</p>
                <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                  Abra o caixa para começar a vender
                </p>
              </div>
              <Button onClick={() => setDialogAbrirCaixaAberto(true)} className="gap-2">
                <Clock size={16} /> Abrir Caixa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-5 mt-6">
        {/* ------------------ LADO ESQUERDO: PRODUTOS ------------------ */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3 space-y-3">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>

              {/* Categorias */}
              <div className="flex flex-wrap gap-1.5">
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaAtiva(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      categoriaAtiva === cat
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                  <Loader2 className="animate-spin" size={18} /> Carregando...
                </div>
              ) : produtosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                  <ShoppingCart size={24} className="opacity-40" />
                  <p className="text-sm">Nenhum produto encontrado</p>
                </div>
              ) : (
                <div className="divide-y divide-border max-h-[560px] overflow-y-auto">
                  {produtosFiltrados.map((produto) => {
                    const restante = produto.quantidade - quantidadeNoCarrinho(produto.id);
                    return (
                      <div
                        key={produto.id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="font-semibold text-sm">{produto.nome}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge variant="outline" className="text-[10px]">
                              {produto.categorias?.nome ?? SEM_CATEGORIA}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {restante} un. disponível(is)
                            </span>
                            {produto.exige_cliente && (
                              <Badge
                                variant="outline"
                                className="text-[9px] bg-blue-500/10 text-blue-600 border-none font-bold"
                              >
                                Exige cliente
                              </Badge>
                            )}
                            {produto.exige_numero_serie && (
                              <Badge
                                variant="outline"
                                className="text-[9px] bg-purple-500/10 text-purple-600 border-none font-bold"
                              >
                                Nº de série
                              </Badge>
                            )}
                            {produto.gera_garantia && (
                              <Badge
                                variant="outline"
                                className="text-[9px] bg-emerald-500/10 text-emerald-600 border-none font-bold"
                              >
                                Garantia
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-sm text-primary">
                            R$ {moeda(Number(produto.preco_venda))}
                          </span>
                          <Button
                            size="sm"
                            disabled={restante <= 0}
                            onClick={() => adicionarAoCarrinho(produto)}
                            className="h-8 w-8 p-0 rounded-lg text-xs shadow-sm"
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ------------------ LADO DIREITO: CARRINHO ------------------ */}
        <div className="lg:col-span-2 space-y-4">
          {/* Cliente */}
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <User2 size={16} className="text-primary" /> Cliente
                {exigeCliente && (
                  <Badge
                    variant="outline"
                    className="text-[9px] bg-blue-500/10 text-blue-600 border-none font-bold"
                  >
                    Obrigatório
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={abrirDialogNovoCliente}
                className="h-7 text-xs px-2 gap-1"
              >
                <UserPlus size={13} /> Novo
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 relative">
              <div className="relative">
                <Input
                  placeholder="Buscar cliente por nome..."
                  value={buscaCliente}
                  onChange={(e) => {
                    setBuscaCliente(e.target.value);
                    setClienteSelecionado(null);
                    setMostrarListaClientes(true);
                  }}
                  onFocus={() => setMostrarListaClientes(true)}
                  className={`h-9 text-sm pr-8 ${
                    exigeCliente && !clienteSelecionado ? "border-blue-400" : ""
                  }`}
                />
                {clienteSelecionado && (
                  <button
                    onClick={limparCliente}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {mostrarListaClientes && buscaCliente.trim() && !clienteSelecionado && (
                <div className="absolute z-10 left-4 right-4 mt-0.5 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  {clientesFiltrados.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selecionarCliente(c)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center justify-between"
                    >
                      <span className="font-medium">{c.nome}</span>
                      <span className="text-muted-foreground text-[10px]">{c.telefone}</span>
                    </button>
                  ))}
                  <button
                    onClick={abrirDialogNovoCliente}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-primary hover:bg-muted transition-colors flex items-center gap-1.5 border-t border-border"
                  >
                    <UserPlus size={13} /> Cadastrar &quot;{buscaCliente.trim()}&quot;
                  </button>
                </div>
              )}

              {clienteSelecionado ? (
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-none text-[10px] font-bold"
                >
                  ✓ {clienteSelecionado.nome}
                </Badge>
              ) : exigeCliente ? (
                <p className="text-[11px] text-blue-600 font-semibold">
                  Há produto no carrinho que exige cliente cadastrado.
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Venda de balcão — cliente é opcional.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Carrinho */}
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold">Carrinho ({carrinho.length})</CardTitle>
              {carrinho.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCarrinho([])}
                  className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2"
                >
                  <Trash2 size={12} className="mr-1" /> Limpar
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {carrinho.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ShoppingCart size={28} className="mb-2 opacity-30" />
                  <p className="text-xs">Carrinho vazio</p>
                </div>
              ) : (
                <div className="divide-y divide-border max-h-72 overflow-y-auto">
                  {carrinho.map((item) => (
                    <div key={item.linhaId} className="px-4 py-2.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs truncate">{item.nome}</p>
                          <p className="text-[10px] text-muted-foreground">
                            R$ {moeda(item.preco)}
                          </p>
                        </div>

                        {item.exigeSerie ? (
                          <span className="text-[10px] font-bold text-muted-foreground px-2">
                            1 un.
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => alterarQuantidade(item.linhaId, -1)}
                              className="h-5 w-5 rounded border border-border text-xs hover:bg-muted flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold w-5 text-center">
                              {item.quantidade}
                            </span>
                            <button
                              onClick={() => alterarQuantidade(item.linhaId, 1)}
                              className="h-5 w-5 rounded border border-border text-xs hover:bg-muted flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>
                        )}

                        <span className="text-xs font-bold w-16 text-right shrink-0">
                          R$ {moeda(item.preco * item.quantidade)}
                        </span>
                        <button
                          onClick={() => removerDoCarrinho(item.linhaId)}
                          className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {item.exigeSerie && (
                        <div className="flex items-center gap-1.5">
                          <Hash size={12} className="text-muted-foreground shrink-0" />
                          <Input
                            placeholder="Número de série *"
                            value={item.numeroSerie}
                            onChange={(e) => definirNumeroSerie(item.linhaId, e.target.value)}
                            className={`h-7 text-xs ${
                              item.numeroSerie.trim() ? "" : "border-purple-400"
                            }`}
                          />
                        </div>
                      )}

                      {item.geraGarantia && (
                        <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Shield size={11} /> Gera garantia automaticamente
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagamento */}
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <DollarSign size={16} className="text-primary" /> Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-1.5">
                {formasPagamento.map((fp) => (
                  <button
                    key={fp}
                    onClick={() => setFormaPagamento(fp)}
                    className={`py-1.5 px-2 rounded-lg border text-[10px] font-semibold transition-all ${
                      formaPagamento === fp
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {fp}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground w-20 shrink-0">Desconto R$</label>
                <Input
                  type="number"
                  min={0}
                  max={subtotal}
                  value={desconto}
                  onChange={(e) => setDesconto(Number(e.target.value))}
                  className="h-8 text-sm"
                />
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span>R$ {moeda(subtotal)}</span>
                </div>
                {desconto > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                    <span>Desconto</span>
                    <span>- R$ {moeda(desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold border-t border-border pt-1.5 mt-1.5">
                  <span>Total</span>
                  <span className="text-primary text-base">R$ {moeda(total)}</span>
                </div>
              </div>

              {geraGarantia && clienteSelecionado && (
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Shield size={12} /> Garantia será registrada para {clienteSelecionado.nome}
                </p>
              )}

              <Button
                onClick={finalizarVenda}
                disabled={carrinho.length === 0 || finalizando || !caixaAberto}
                className="w-full h-11 text-sm font-bold shadow-md gap-2"
              >
                {finalizando ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                Finalizar Venda
              </Button>

              {!caixaAberto && (
                <Button variant="outline" onClick={irParaCaixa} className="w-full h-9 text-xs gap-2">
                  <Wallet size={14} /> Ir para o Caixa
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog: abrir caixa */}
      <Dialog open={dialogAbrirCaixaAberto} onOpenChange={setDialogAbrirCaixaAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Abrir Caixa</DialogTitle>
            <DialogDescription>Quanto havia em caixa no início do dia?</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Valor Inicial (R$)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={valorAbertura}
                onChange={(e) => setValorAbertura(e.target.value)}
                className="text-lg"
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAbrirCaixaAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={abrirCaixa} disabled={abrindoCaixa} className="gap-2">
              {abrindoCaixa && <Loader2 size={14} className="animate-spin" />}
              Abrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: novo cliente durante a venda */}
      <Dialog open={dialogNovoCliente} onOpenChange={setDialogNovoCliente}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Cadastro rápido — os demais dados podem ser completados depois na aba Clientes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Nome *</label>
              <Input
                value={novoCliente.nome}
                onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Telefone</label>
                <Input
                  value={novoCliente.telefone}
                  onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">CPF</label>
                <Input
                  value={novoCliente.cpf}
                  onChange={(e) => setNovoCliente({ ...novoCliente, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            {erroCliente && <p className="text-xs text-destructive">{erroCliente}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogNovoCliente(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarNovoCliente} disabled={salvandoCliente} className="gap-2">
              {salvandoCliente && <Loader2 size={14} className="animate-spin" />}
              Cadastrar e usar na venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================
// ABA 2: CAIXA — abrir, fechar, entradas, saídas e movimentações
// ============================================================
function AbaCaixa() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [caixa, setCaixa] = useState<CaixaAtual | null>(null);
  const [vendasHoje, setVendasHoje] = useState<VendaDoDia[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoCaixa[]>([]);

  // abertura
  const [dialogAbrir, setDialogAbrir] = useState(false);
  const [valorAbertura, setValorAbertura] = useState("0");
  const [abrindo, setAbrindo] = useState(false);

  // entrada / saída
  const [dialogMovimentacao, setDialogMovimentacao] = useState<null | "Entrada" | "Saída">(null);
  const [formMov, setFormMov] = useState({ valor: "", motivo: "" });
  const [salvandoMov, setSalvandoMov] = useState(false);
  const [erroMov, setErroMov] = useState<string | null>(null);

  // fechamento
  const [dialogFechar, setDialogFechar] = useState(false);
  const [valorConferido, setValorConferido] = useState("0");
  const [fechando, setFechando] = useState(false);
  const [erroFechar, setErroFechar] = useState<string | null>(null);

  const isAdmin = user?.perfil === "Administrador";

  const carregar = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErro(null);

    const inicioHojeISO = inicioDoDiaLocalISO();

    try {
      const [{ data: caixaData }, { data: vendasData }, { data: usuariosData }] = await Promise.all([
        supabase
          .from("caixa")
          .select("*")
          .eq("status", "Aberto")
          .order("data", { ascending: false })
          .maybeSingle(),
        supabase
          .from("vendas")
          .select("id, total, data, forma_pagamento, vendedor_id")
          .eq("status", "Finalizada")
          .gte("data", inicioHojeISO)
          .order("data", { ascending: false }),
        supabase.from("usuarios").select("id, nome"),
      ]);

      const nomePorUsuario: Record<string, string> = {};
      (usuariosData ?? []).forEach((u: { id: string; nome: string }) => {
        nomePorUsuario[u.id] = u.nome;
      });

      setCaixa((caixaData ?? null) as CaixaAtual | null);

      setVendasHoje(
        ((vendasData ?? []) as Array<Record<string, unknown>>).map((v) => ({
          id: String(v.id),
          total: Number(v.total),
          data: String(v.data),
          forma_pagamento: String(v.forma_pagamento ?? "—"),
          vendedor_id: String(v.vendedor_id),
          vendedorNome: nomePorUsuario[String(v.vendedor_id)] ?? "—",
        }))
      );

      // Movimentações do caixa aberto (ou do dia, quando não há caixa aberto)
      let query = supabase
        .from("movimentacoes_caixa")
        .select("*")
        .order("data", { ascending: false });

      if (caixaData) {
        query = query.eq("caixa_id", (caixaData as { id: string }).id);
      } else {
        query = query.gte("data", inicioHojeISO);
      }

      const { data: movsData } = await query;

      setMovimentacoes(
        ((movsData ?? []) as Array<Record<string, unknown>>).map((m) => ({
          id: String(m.id),
          tipo: String(m.tipo ?? "Saída"),
          valor: Math.abs(Number(m.valor)),
          motivo: String(m.motivo ?? "Sem descrição"),
          data: String(m.data),
          responsavelNome: nomePorUsuario[String(m.responsavel_id)] ?? "—",
        }))
      );
    } catch (e) {
      setErro("Erro ao carregar o caixa: " + ((e as Error)?.message ?? "erro desconhecido"));
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // --------------------------------------------------------
  // Totais
  // --------------------------------------------------------
  const minhasVendas = useMemo(
    () => vendasHoje.filter((v) => v.vendedor_id === user?.id),
    [vendasHoje, user]
  );

  const totalVendasLoja = vendasHoje.reduce((acc, v) => acc + v.total, 0);
  const totalMinhasVendas = minhasVendas.reduce((acc, v) => acc + v.total, 0);
  const totalEntradas = movimentacoes
    .filter((m) => m.tipo === "Entrada")
    .reduce((acc, m) => acc + m.valor, 0);
  const totalSaidas = movimentacoes
    .filter((m) => m.tipo === "Saída")
    .reduce((acc, m) => acc + m.valor, 0);

  const valorAberturaCaixa = Number(caixa?.valor_abertura ?? 0);
  const valorEsperado = valorAberturaCaixa + totalVendasLoja + totalEntradas - totalSaidas;

  // --------------------------------------------------------
  // Ações
  // --------------------------------------------------------
  const abrirCaixa = async () => {
    if (!user) return;
    setAbrindo(true);
    setErro(null);

    const { error } = await supabase.from("caixa").insert({
      usuario_abertura_id: user.id,
      valor_abertura: Number(valorAbertura),
      status: "Aberto",
      data: hojeLocalISO(),
    });

    setAbrindo(false);

    if (error) {
      setErro("Erro ao abrir caixa: " + error.message);
      return;
    }

    setDialogAbrir(false);
    setValorAbertura("0");
    carregar();
  };

  const abrirDialogMovimentacao = (tipo: "Entrada" | "Saída") => {
    setFormMov({ valor: "", motivo: "" });
    setErroMov(null);
    setDialogMovimentacao(tipo);
  };

  const salvarMovimentacao = async () => {
    if (!user || !caixa || !dialogMovimentacao) return;

    const valor = Number(formMov.valor);
    if (!valor || valor <= 0) {
      setErroMov("Informe um valor maior que zero.");
      return;
    }
    if (!formMov.motivo.trim()) {
      setErroMov("Informe o motivo da movimentação.");
      return;
    }

    setSalvandoMov(true);
    setErroMov(null);

    const { error } = await supabase.from("movimentacoes_caixa").insert({
      caixa_id: caixa.id,
      tipo: dialogMovimentacao,
      valor,
      motivo: formMov.motivo.trim(),
      responsavel_id: user.id,
    });

    setSalvandoMov(false);

    if (error) {
      setErroMov("Erro ao registrar: " + error.message);
      return;
    }

    setDialogMovimentacao(null);
    carregar();
  };

  const abrirDialogFechar = () => {
    setValorConferido(valorEsperado.toFixed(2));
    setErroFechar(null);
    setDialogFechar(true);
  };

  const confirmarFecharCaixa = async () => {
    if (!caixa) return;
    setFechando(true);
    setErroFechar(null);

    const conferido = Number(valorConferido);
    const diferenca = conferido - valorEsperado;

    const { error } = await supabase
      .from("caixa")
      .update({
        status: "Fechado",
        valor_fechamento: conferido,
        valor_conferido: conferido,
        diferenca,
        fechado_em: new Date().toISOString(),
      })
      .eq("id", caixa.id);

    setFechando(false);

    if (error) {
      setErroFechar("Erro ao fechar caixa: " + error.message);
      return;
    }

    setDialogFechar(false);
    carregar();
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">Caixa do dia</p>
          <p className="text-muted-foreground text-xs">
            Abertura, fechamento, entradas, saídas e movimentações
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => carregar()}
          disabled={loading}
          className="gap-2 shrink-0"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Atualizar
        </Button>
      </div>

      {erro && (
        <div className="flex items-center gap-2 rounded-md border border-red-900/30 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
          <AlertCircle size={16} className="shrink-0" /> {erro}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="animate-spin" size={20} /> Carregando...
        </div>
      ) : !caixa ? (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/40 shadow-sm">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-amber-600" />
              <p className="font-bold text-amber-700 dark:text-amber-400">Nenhum caixa aberto</p>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-500">
              Abra o caixa informando o valor inicial para começar o dia.
            </p>
            <Button size="sm" className="gap-2" onClick={() => setDialogAbrir(true)}>
              <Clock size={15} /> Abrir Caixa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Resumo do caixa */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={15} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Valor inicial
                </span>
              </div>
              <p className="text-xl font-extrabold">R$ {moeda(valorAberturaCaixa)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Aberto às {hora(caixa.criado_em)}
              </p>
            </Card>

            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={15} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Vendas
                </span>
              </div>
              <p className="text-xl font-extrabold text-emerald-600">R$ {moeda(totalVendasLoja)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {vendasHoje.length} venda(s)
              </p>
            </Card>

            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Plus size={15} className="text-blue-500" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Entradas
                </span>
              </div>
              <p className="text-xl font-extrabold text-blue-600">R$ {moeda(totalEntradas)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">reforços / recebimentos</p>
            </Card>

            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={15} className="text-red-500" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Saídas
                </span>
              </div>
              <p className="text-xl font-extrabold text-red-600">R$ {moeda(totalSaidas)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">sangrias / despesas</p>
            </Card>
          </div>

          {/* Saldo + ações */}
          <Card className="shadow-sm">
            <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Saldo esperado em caixa</p>
                <p className="text-2xl font-extrabold text-primary">R$ {moeda(valorEsperado)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  inicial + vendas + entradas − saídas
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => abrirDialogMovimentacao("Entrada")}
                >
                  <Plus size={14} /> Registrar entrada
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => abrirDialogMovimentacao("Saída")}
                >
                  <TrendingDown size={14} /> Registrar saída
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={abrirDialogFechar}
                >
                  <LogOut size={14} /> Fechar caixa
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Vendas */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShoppingBag size={16} className="text-primary" />
                  {isAdmin ? "Vendas de hoje" : "Vendas do dia"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isAdmin && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-border">
                    <div>
                      <p className="text-2xl font-extrabold text-primary">
                        R$ {moeda(totalMinhasVendas)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {minhasVendas.length} venda(s) suas hoje
                      </p>
                    </div>
                    <TrendingUp size={28} className="text-primary/40" />
                  </div>
                )}

                {vendasHoje.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    Nenhuma venda registrada hoje.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {vendasHoje.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between text-xs p-2 rounded border border-border/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{v.forma_pagamento}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {v.vendedorNome} • {hora(v.data)}
                          </p>
                        </div>
                        <p className="font-bold text-emerald-600 ml-2 shrink-0">
                          R$ {moeda(v.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Movimentações */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Wallet size={16} className="text-muted-foreground" /> Movimentações do caixa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {movimentacoes.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    Nenhuma entrada ou saída registrada.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {movimentacoes.map((m) => (
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
          </div>
        </>
      )}

      {/* Histórico por dia — somente Administrador */}
      {isAdmin && <HistoricoCaixaAdmin />}

      {/* Dialog: abrir caixa */}
      <Dialog open={dialogAbrir} onOpenChange={setDialogAbrir}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Abrir Caixa</DialogTitle>
            <DialogDescription>Quanto havia em caixa no início do dia?</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <label className="text-sm font-semibold">Valor Inicial (R$)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={valorAbertura}
              onChange={(e) => setValorAbertura(e.target.value)}
              className="text-lg"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAbrir(false)}>
              Cancelar
            </Button>
            <Button onClick={abrirCaixa} disabled={abrindo} className="gap-2">
              {abrindo && <Loader2 size={14} className="animate-spin" />}
              Abrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: entrada / saída */}
      <Dialog
        open={dialogMovimentacao !== null}
        onOpenChange={(aberto) => !aberto && setDialogMovimentacao(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMovimentacao === "Entrada" ? "Registrar Entrada" : "Registrar Saída"}
            </DialogTitle>
            <DialogDescription>
              {dialogMovimentacao === "Entrada"
                ? "Dinheiro que entrou no caixa fora de uma venda (troco, reforço, recebimento)."
                : "Dinheiro que saiu do caixa (sangria, pagamento, despesa)."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Valor (R$) *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formMov.valor}
                onChange={(e) => setFormMov({ ...formMov, valor: e.target.value })}
                className="text-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Motivo *</label>
              <Input
                value={formMov.motivo}
                onChange={(e) => setFormMov({ ...formMov, motivo: e.target.value })}
                placeholder="Ex: sangria para o banco, compra de material"
              />
            </div>

            {erroMov && <p className="text-xs text-destructive">{erroMov}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMovimentacao(null)}>
              Cancelar
            </Button>
            <Button onClick={salvarMovimentacao} disabled={salvandoMov} className="gap-2">
              {salvandoMov && <Loader2 size={14} className="animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: fechar caixa */}
      <Dialog open={dialogFechar} onOpenChange={setDialogFechar}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fechar Caixa</DialogTitle>
            <DialogDescription>
              Confira o dinheiro na gaveta e informe o valor total encontrado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor de abertura</span>
                <span className="font-semibold">R$ {moeda(valorAberturaCaixa)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendas do dia</span>
                <span className="font-semibold text-emerald-600">R$ {moeda(totalVendasLoja)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entradas</span>
                <span className="font-semibold text-blue-600">+ R$ {moeda(totalEntradas)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saídas</span>
                <span className="font-semibold text-red-600">- R$ {moeda(totalSaidas)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 mt-1.5">
                <span className="font-bold">Valor esperado no caixa</span>
                <span className="font-extrabold">R$ {moeda(valorEsperado)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Valor conferido na gaveta (R$) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={valorConferido}
                onChange={(e) => setValorConferido(e.target.value)}
                className="text-lg"
              />
            </div>

            {Number(valorConferido) !== valorEsperado && (
              <p
                className={`text-xs font-semibold ${
                  Number(valorConferido) > valorEsperado ? "text-emerald-600" : "text-red-600"
                }`}
              >
                Diferença: {Number(valorConferido) > valorEsperado ? "+" : ""}
                R$ {moeda(Number(valorConferido) - valorEsperado)}
              </p>
            )}

            {erroFechar && <p className="text-xs text-destructive">{erroFechar}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogFechar(false)} disabled={fechando}>
              Cancelar
            </Button>
            <Button
              onClick={confirmarFecharCaixa}
              disabled={fechando}
              variant="destructive"
              className="gap-2"
            >
              {fechando ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Confirmar fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// HISTÓRICO DE CAIXA POR DIA (Administrador)
// Calendário para puxar qualquer dia: abertura, fechamento,
// vendas e movimentações daquele caixa.
// ============================================================
interface CaixaHistorico {
  id: string;
  dia: string;
  status: string;
  valorAbertura: number;
  valorFechamento: number | null;
  diferenca: number | null;
  abertoEm: string;
  fechadoEm: string | null;
  responsavelNome: string;
}

function HistoricoCaixaAdmin() {
  const [diaSelecionado, setDiaSelecionado] = useState<string>(hojeLocalISO());
  const [caixas, setCaixas] = useState<CaixaHistorico[]>([]);
  const [vendasDia, setVendasDia] = useState<VendaDoDia[]>([]);
  const [movsDia, setMovsDia] = useState<MovimentacaoCaixa[]>([]);
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Carrega a lista de caixas (para os atalhos de dias) uma vez
  const carregarCaixas = useCallback(async () => {
    const [{ data: caixasData, error: caixasErro }, { data: usuariosData }] = await Promise.all([
      supabase.from("caixa").select("*").order("criado_em", { ascending: false }),
      supabase.from("usuarios").select("id, nome"),
    ]);

    if (caixasErro) {
      setErro("Erro ao carregar o histórico: " + caixasErro.message);
      return;
    }

    const nomePorUsuario: Record<string, string> = {};
    (usuariosData ?? []).forEach((u: { id: string; nome: string }) => {
      nomePorUsuario[u.id] = u.nome;
    });
    setNomes(nomePorUsuario);

    setCaixas(
      ((caixasData ?? []) as Array<Record<string, unknown>>).map((c) => ({
        id: String(c.id),
        dia: dataLocalISO(String(c.criado_em ?? c.data)),
        status: String(c.status ?? "—"),
        valorAbertura: Number(c.valor_abertura ?? 0),
        valorFechamento: c.valor_fechamento === null ? null : Number(c.valor_fechamento),
        diferenca: c.diferenca === null ? null : Number(c.diferenca),
        abertoEm: String(c.criado_em),
        fechadoEm: c.fechado_em ? String(c.fechado_em) : null,
        responsavelNome: nomePorUsuario[String(c.usuario_abertura_id)] ?? "—",
      }))
    );
  }, []);

  // Carrega vendas e movimentações do dia escolhido no calendário
  const carregarDia = useCallback(
    async (dia: string) => {
      setLoading(true);
      setErro(null);

      const { inicio, fim } = intervaloDoDiaLocalISO(dia);

      const [{ data: vendasData, error: vendasErro }, { data: movsData, error: movsErro }] =
        await Promise.all([
          supabase
            .from("vendas")
            .select("id, total, data, forma_pagamento, vendedor_id")
            .eq("status", "Finalizada")
            .gte("data", inicio)
            .lte("data", fim)
            .order("data", { ascending: false }),
          supabase
            .from("movimentacoes_caixa")
            .select("*")
            .gte("data", inicio)
            .lte("data", fim)
            .order("data", { ascending: false }),
        ]);

      if (vendasErro || movsErro) {
        setErro(
          "Erro ao carregar o dia: " + (vendasErro?.message ?? movsErro?.message ?? "desconhecido")
        );
        setLoading(false);
        return;
      }

      setVendasDia(
        ((vendasData ?? []) as Array<Record<string, unknown>>).map((v) => ({
          id: String(v.id),
          total: Number(v.total),
          data: String(v.data),
          forma_pagamento: String(v.forma_pagamento ?? "—"),
          vendedor_id: String(v.vendedor_id),
          vendedorNome: "",
        }))
      );

      setMovsDia(
        ((movsData ?? []) as Array<Record<string, unknown>>).map((m) => ({
          id: String(m.id),
          tipo: String(m.tipo ?? "Saída"),
          valor: Math.abs(Number(m.valor)),
          motivo: String(m.motivo ?? "Sem descrição"),
          data: String(m.data),
          responsavelNome: String(m.responsavel_id ?? ""),
        }))
      );

      setLoading(false);
    },
    []
  );

  useEffect(() => {
    carregarCaixas();
  }, [carregarCaixas]);

  useEffect(() => {
    carregarDia(diaSelecionado);
  }, [carregarDia, diaSelecionado]);

  // Os nomes chegam junto com a lista de caixas; resolvemos na hora de exibir
  const nomeDe = (id: string) => nomes[id] ?? "—";

  const diasComCaixa = useMemo(() => {
    const dias = new Set<string>();
    caixas.forEach((c) => dias.add(c.dia));
    return Array.from(dias).sort().reverse();
  }, [caixas]);

  const caixasDoDia = useMemo(
    () => caixas.filter((c) => c.dia === diaSelecionado),
    [caixas, diaSelecionado]
  );

  const totais = useMemo(() => {
    const valorInicial = caixasDoDia.reduce((acc, c) => acc + c.valorAbertura, 0);
    const totalVendido = vendasDia.reduce((acc, v) => acc + v.total, 0);
    const entradas = movsDia.filter((m) => m.tipo === "Entrada").reduce((a, m) => a + m.valor, 0);
    const saidas = movsDia.filter((m) => m.tipo === "Saída").reduce((a, m) => a + m.valor, 0);
    const saldoFinal = valorInicial + totalVendido + entradas - saidas;

    const temFechamento = caixasDoDia.some((c) => c.valorFechamento !== null);
    const valorConferido = caixasDoDia.reduce((acc, c) => acc + (c.valorFechamento ?? 0), 0);
    const diferenca = caixasDoDia.reduce((acc, c) => acc + (c.diferenca ?? 0), 0);

    // Formas de pagamento do dia
    const pagamentos: Record<string, { total: number; qtd: number }> = {};
    vendasDia.forEach((v) => {
      if (!pagamentos[v.forma_pagamento]) pagamentos[v.forma_pagamento] = { total: 0, qtd: 0 };
      pagamentos[v.forma_pagamento].total += v.total;
      pagamentos[v.forma_pagamento].qtd += 1;
    });

    return {
      valorInicial,
      totalVendido,
      entradas,
      saidas,
      saldoFinal,
      temFechamento,
      valorConferido,
      diferenca,
      pagamentos: Object.entries(pagamentos).map(([forma, dados]) => ({ forma, ...dados })),
    };
  }, [caixasDoDia, vendasDia, movsDia]);

  const dataPorExtenso = formatarDataBR(diaSelecionado, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-2 border-t border-border pt-6">
        <History size={16} className="text-muted-foreground" />
        <div>
          <p className="font-semibold text-sm">Histórico de caixa por dia</p>
          <p className="text-muted-foreground text-xs">
            Escolha uma data para ver abertura, fechamento e toda a movimentação daquele dia
          </p>
        </div>
      </div>

      {/* Calendário + atalhos */}
      <Card className="shadow-sm">
        <CardContent className="pt-6 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <CalendarDays size={13} /> Data
            </label>
            <Input
              type="date"
              value={diaSelecionado}
              max={hojeLocalISO()}
              onChange={(e) => setDiaSelecionado(e.target.value)}
              className="max-w-[200px]"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setDiaSelecionado(hojeLocalISO())}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                diaSelecionado === hojeLocalISO()
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              Hoje
            </button>
            {diasComCaixa
              .filter((dia) => dia !== hojeLocalISO())
              .slice(0, 7)
              .map((dia) => (
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

      {erro && (
        <div className="flex items-center gap-2 rounded-md border border-red-900/30 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
          <AlertCircle size={16} className="shrink-0" /> {erro}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
          <Loader2 className="animate-spin" size={18} /> Carregando {dataPorExtenso}...
        </div>
      ) : caixasDoDia.length === 0 && vendasDia.length === 0 && movsDia.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhum caixa aberto e nenhum movimento em {dataPorExtenso}.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Abertura e fechamento */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock size={15} className="text-muted-foreground" /> Abertura e fechamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {caixasDoDia.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  Nenhum caixa foi aberto neste dia (movimentos avulsos abaixo).
                </p>
              ) : (
                caixasDoDia.map((c) => (
                  <div key={c.id} className="rounded-lg border border-border/60 p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold">
                        Aberto por {c.responsavelNome} às {hora(c.abertoEm)}
                      </p>
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

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                          Abertura
                        </p>
                        <p className="font-bold">R$ {moeda(c.valorAbertura)}</p>
                        <p className="text-[10px] text-muted-foreground">{hora(c.abertoEm)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                          Fechamento
                        </p>
                        <p className="font-bold">
                          {c.valorFechamento === null ? "—" : `R$ ${moeda(c.valorFechamento)}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {c.fechadoEm ? hora(c.fechadoEm) : "em aberto"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                          Diferença
                        </p>
                        <p
                          className={`font-bold ${
                            c.diferenca === null
                              ? ""
                              : c.diferenca === 0
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {c.diferenca === null
                            ? "—"
                            : `${c.diferenca > 0 ? "+" : ""}R$ ${moeda(c.diferenca)}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                          Tempo aberto
                        </p>
                        <p className="font-bold">
                          {c.fechadoEm
                            ? `${hora(c.abertoEm)} — ${hora(c.fechadoEm)}`
                            : `desde ${hora(c.abertoEm)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Totais do dia */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            <Card className="p-4 shadow-sm">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Valor inicial</p>
              <p className="text-lg font-extrabold">R$ {moeda(totais.valorInicial)}</p>
            </Card>
            <Card className="p-4 shadow-sm">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Total vendido</p>
              <p className="text-lg font-extrabold text-emerald-600">
                R$ {moeda(totais.totalVendido)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {vendasDia.length} venda(s)
              </p>
            </Card>
            <Card className="p-4 shadow-sm">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Entradas</p>
              <p className="text-lg font-extrabold text-blue-600">R$ {moeda(totais.entradas)}</p>
            </Card>
            <Card className="p-4 shadow-sm">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Saídas</p>
              <p className="text-lg font-extrabold text-red-600">R$ {moeda(totais.saidas)}</p>
            </Card>
            <Card className="p-4 shadow-sm">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Saldo final</p>
              <p className="text-lg font-extrabold text-primary">R$ {moeda(totais.saldoFinal)}</p>
              {totais.temFechamento && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  conferido R$ {moeda(totais.valorConferido)}
                </p>
              )}
            </Card>
          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Movimentações do dia */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Wallet size={15} className="text-muted-foreground" /> Movimentações do dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                {movsDia.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhuma entrada ou saída neste dia.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {movsDia.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-xs p-2 rounded border border-border/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{m.motivo}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {m.tipo} • {nomeDe(m.responsavelNome)} • {hora(m.data)}
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
                {totais.pagamentos.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhuma venda neste dia.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {totais.pagamentos.map((p) => {
                      const percentual =
                        totais.totalVendido > 0 ? (p.total / totais.totalVendido) * 100 : 0;
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
          </div>

          {/* Vendas do dia */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShoppingBag size={15} className="text-primary" /> Vendas de {dataPorExtenso}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {vendasDia.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Nenhuma venda registrada neste dia.
                </p>
              ) : (
                <div className="divide-y divide-border max-h-80 overflow-y-auto">
                  {vendasDia.map((v) => (
                    <div key={v.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{v.forma_pagamento}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {nomeDe(v.vendedor_id)} • {hora(v.data)}
                        </p>
                      </div>
                      <p className="font-bold text-emerald-600 ml-2 shrink-0">
                        R$ {moeda(v.total)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
