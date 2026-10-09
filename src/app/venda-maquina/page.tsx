"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { notificarVendaNova } from "@/lib/notificacoes-service";
import { hojeLocalISO, formatarDataBR } from "@/lib/date-utils";
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
} from "@/components/ui/dialog";
import {
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  Wallet,
  X,
  Printer,
  MessageCircle,
  User2,
  Hash,
  Receipt,
} from "lucide-react";

// ============================================================================
// Tipos
// ============================================================================
interface Maquina {
  id: string;
  nome: string;
  preco_venda: number;
  quantidade: number;
  exige_numero_serie: boolean | null;
  categorias?: { nome: string } | null;
}

interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  whatsapp: string | null;
}

interface Loja {
  nome_loja: string;
  telefone: string | null;
  whatsapp: string | null;
  endereco: string | null;
}

interface ReciboVenda {
  numero: string;
  dataISO: string;
  clienteNome: string;
  maquinaNome: string;
  numeroSerie: string;
  preco: number;
  desconto: number;
  total: number;
  formaPagamento: string;
  garantiaDias: number;
  garantiaFimISO: string | null;
  observacao: string;
  vendedorNome: string;
}

const formasPagamento = ["Dinheiro", "Pix", "Cartão de Débito", "Cartão de Crédito", "Transferência"] as const;

// ============================================================================
// Funções auxiliares
// ============================================================================
const brl = (valor: number) =>
  "R$ " + valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Soma dias a uma data "YYYY-MM-DD" (aritmética de calendário, sem fuso). */
function somarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** Deixa só dígitos e garante o DDI 55 do Brasil. */
function normalizarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  if (!digitos) return "";
  if (digitos.startsWith("55") && digitos.length >= 12) return digitos;
  return "55" + digitos;
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function montarMensagemWhatsApp(r: ReciboVenda, loja: Loja | null): string {
  const linhas: string[] = [
    `*${loja?.nome_loja ?? "West Máquinas"}*`,
    "Recibo de venda de máquina",
    "",
    `Recibo nº: ${r.numero}`,
    `Data: ${formatarDataBR(r.dataISO)}`,
    `Cliente: ${r.clienteNome}`,
    "",
    `Máquina: ${r.maquinaNome}`,
    `Nº de série: ${r.numeroSerie}`,
    "",
    `Valor: ${brl(r.preco)}`,
  ];

  if (r.desconto > 0) {
    linhas.push(`Desconto: - ${brl(r.desconto)}`);
    linhas.push(`*Total: ${brl(r.total)}*`);
  } else {
    linhas[linhas.length - 1] = `*Total: ${brl(r.total)}*`;
  }

  linhas.push(`Pagamento: ${r.formaPagamento}`);

  if (r.garantiaDias > 0 && r.garantiaFimISO) {
    linhas.push(`Garantia: ${r.garantiaDias} dias (até ${formatarDataBR(r.garantiaFimISO)})`);
  } else {
    linhas.push("Garantia: sem garantia");
  }

  if (r.observacao) {
    linhas.push("", `Obs.: ${r.observacao}`);
  }

  linhas.push("", `Vendedor(a): ${r.vendedorNome}`);
  linhas.push("", "Obrigado pela preferência! 🧵");

  return linhas.join("\n");
}

function imprimirRecibo(r: ReciboVenda, loja: Loja | null) {
  const janela = window.open("", "_blank", "width=720,height=900");
  if (!janela) {
    alert("O navegador bloqueou a janela de impressão. Libere pop-ups para este site e tente de novo.");
    return;
  }

  const linha = (rotulo: string, valor: string) =>
    `<tr><td class="r">${escaparHtml(rotulo)}</td><td>${escaparHtml(valor)}</td></tr>`;

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Recibo ${escaparHtml(r.numero)}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { color: #555; font-size: 13px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  td { padding: 7px 4px; border-bottom: 1px solid #ddd; vertical-align: top; }
  td.r { width: 38%; color: #555; }
  .total td { font-size: 17px; font-weight: bold; border-bottom: 2px solid #111; }
  .rodape { margin-top: 36px; font-size: 12px; color: #555; text-align: center; }
  .assin { margin-top: 56px; display: flex; gap: 40px; }
  .assin div { flex: 1; border-top: 1px solid #111; text-align: center; font-size: 12px; padding-top: 4px; }
</style>
</head>
<body>
  <h1>${escaparHtml(loja?.nome_loja ?? "West Máquinas")}</h1>
  <div class="sub">
    ${escaparHtml([loja?.endereco, loja?.whatsapp ?? loja?.telefone].filter(Boolean).join(" · "))}
  </div>
  <h2 style="font-size:16px;margin:0 0 10px">Recibo de venda de máquina nº ${escaparHtml(r.numero)}</h2>
  <table>
    ${linha("Data", formatarDataBR(r.dataISO))}
    ${linha("Cliente", r.clienteNome)}
    ${linha("Máquina", r.maquinaNome)}
    ${linha("Nº de série", r.numeroSerie)}
    ${linha("Valor", brl(r.preco))}
    ${r.desconto > 0 ? linha("Desconto", "- " + brl(r.desconto)) : ""}
    <tr class="total"><td class="r">Total</td><td>${escaparHtml(brl(r.total))}</td></tr>
    ${linha("Pagamento", r.formaPagamento)}
    ${linha(
      "Garantia",
      r.garantiaDias > 0 && r.garantiaFimISO
        ? `${r.garantiaDias} dias (até ${formatarDataBR(r.garantiaFimISO)})`
        : "Sem garantia"
    )}
    ${r.observacao ? linha("Observação", r.observacao) : ""}
    ${linha("Vendedor(a)", r.vendedorNome)}
  </table>
  <div class="assin"><div>Assinatura do cliente</div><div>Assinatura da loja</div></div>
  <div class="rodape">Obrigado pela preferência!</div>
</body>
</html>`;

  janela.document.write(html);
  janela.document.close();
  janela.focus();
  setTimeout(() => janela.print(), 300);
}

// ============================================================================
// Página
// ============================================================================
export default function VendaMaquinaPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loja, setLoja] = useState<Loja | null>(null);
  const [caixaAberto, setCaixaAberto] = useState(false);

  // Formulário
  const [buscaMaquina, setBuscaMaquina] = useState("");
  const [maquinaSel, setMaquinaSel] = useState<Maquina | null>(null);
  const [numeroSerie, setNumeroSerie] = useState("");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteSel, setClienteSel] = useState<Cliente | null>(null);
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false);
  const [dataVenda, setDataVenda] = useState(hojeLocalISO());
  const [preco, setPreco] = useState("");
  const [desconto, setDesconto] = useState("0");
  const [formaPagamento, setFormaPagamento] = useState<(typeof formasPagamento)[number]>("Dinheiro");
  const [garantiaDias, setGarantiaDias] = useState("90");
  const [observacao, setObservacao] = useState("");

  // Recibo
  const [recibo, setRecibo] = useState<ReciboVenda | null>(null);
  const [telefoneEnvio, setTelefoneEnvio] = useState("");
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);

    const [
      { data: produtosData, error: produtosErro },
      { data: clientesData },
      { data: caixaData },
      { data: configData },
    ] = await Promise.all([
      supabase
        .from("produtos")
        .select("id, nome, preco_venda, quantidade, exige_numero_serie, categorias(nome)")
        .eq("ativo", true)
        .gt("quantidade", 0)
        .order("nome"),
      supabase.from("clientes").select("id, nome, telefone, whatsapp").order("nome"),
      supabase.from("caixa").select("id").eq("status", "Aberto").limit(1),
      supabase
        .from("configuracoes")
        .select("nome_loja, telefone, whatsapp, endereco, prazo_garantia_maquina_dias")
        .limit(1)
        .maybeSingle(),
    ]);

    if (produtosErro) {
      setErro("Erro ao carregar as máquinas: " + produtosErro.message);
      setLoading(false);
      return;
    }

    const todos = (produtosData ?? []) as unknown as Maquina[];
    setMaquinas(todos.filter((p) => p.categorias?.nome === "Máquinas" || p.exige_numero_serie));
    setClientes((clientesData ?? []) as Cliente[]);
    setCaixaAberto((caixaData ?? []).length > 0);

    if (configData) {
      setLoja({
        nome_loja: configData.nome_loja,
        telefone: configData.telefone,
        whatsapp: configData.whatsapp,
        endereco: configData.endereco,
      });
      setGarantiaDias(String(configData.prazo_garantia_maquina_dias ?? 90));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // ---------------------------------------------------------------------------
  // Derivados
  // ---------------------------------------------------------------------------
  const hoje = hojeLocalISO();
  const ehHoje = dataVenda === hoje;

  const precoNum = Number(preco) || 0;
  const descontoNum = Number(desconto) || 0;
  const total = Math.max(0, precoNum - descontoNum);
  const garantiaNum = Math.max(0, Math.floor(Number(garantiaDias) || 0));
  const garantiaFim = garantiaNum > 0 && dataVenda ? somarDias(dataVenda, garantiaNum) : null;

  const maquinasFiltradas = useMemo(() => {
    const termo = buscaMaquina.trim().toLowerCase();
    if (!termo) return maquinas;
    return maquinas.filter((m) => m.nome.toLowerCase().includes(termo));
  }, [maquinas, buscaMaquina]);

  const clientesFiltrados = useMemo(() => {
    const termo = buscaCliente.trim().toLowerCase();
    if (!termo) return [];
    return clientes.filter((c) => c.nome.toLowerCase().includes(termo)).slice(0, 6);
  }, [clientes, buscaCliente]);

  // ---------------------------------------------------------------------------
  // Ações
  // ---------------------------------------------------------------------------
  const selecionarMaquina = (m: Maquina) => {
    setMaquinaSel(m);
    setPreco(String(Number(m.preco_venda)));
    setBuscaMaquina("");
    setErro(null);
  };

  const limparMaquina = () => {
    setMaquinaSel(null);
    setPreco("");
    setNumeroSerie("");
  };

  const selecionarCliente = (c: Cliente) => {
    setClienteSel(c);
    setBuscaCliente(c.nome);
    setMostrarListaClientes(false);
  };

  const limparCliente = () => {
    setClienteSel(null);
    setBuscaCliente("");
  };

  const limparFormulario = () => {
    setMaquinaSel(null);
    setNumeroSerie("");
    setBuscaMaquina("");
    limparCliente();
    setDataVenda(hojeLocalISO());
    setPreco("");
    setDesconto("0");
    setFormaPagamento("Dinheiro");
    setObservacao("");
  };

  const validar = (): string | null => {
    if (!maquinaSel) return "Escolha a máquina que foi vendida.";
    if (!numeroSerie.trim()) return "Informe o número de série da máquina.";
    if (!clienteSel) return "Escolha o cliente da venda.";
    if (!dataVenda) return "Informe a data da venda.";
    if (dataVenda > hoje) return "A data da venda não pode ser no futuro.";
    if (precoNum <= 0) return "Informe o preço da máquina.";
    if (descontoNum < 0 || descontoNum > precoNum) return "O desconto não pode ser maior que o preço.";
    if (ehHoje && !caixaAberto) return "Abra o caixa antes de registrar uma venda de hoje.";
    return null;
  };

  const registrarVenda = async () => {
    if (!user || !maquinaSel || !clienteSel) return;

    const msgValidacao = validar();
    if (msgValidacao) {
      setErro(msgValidacao);
      return;
    }

    setErro(null);
    setSalvando(true);

    const { data, error } = await supabase.rpc("vender_maquina", {
      p_cliente_id: clienteSel.id,
      p_vendedor_id: user.id,
      p_produto_id: maquinaSel.id,
      p_numero_serie: numeroSerie.trim(),
      p_preco: precoNum,
      p_desconto: descontoNum,
      p_forma_pagamento: formaPagamento,
      p_data_venda: dataVenda,
      p_prazo_garantia_dias: garantiaNum,
      p_observacao: observacao.trim() || null,
    });

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    const vendaId = String(data ?? "");

    setRecibo({
      numero: vendaId.slice(0, 8).toUpperCase(),
      dataISO: dataVenda,
      clienteNome: clienteSel.nome,
      maquinaNome: maquinaSel.nome,
      numeroSerie: numeroSerie.trim(),
      preco: precoNum,
      desconto: descontoNum,
      total,
      formaPagamento,
      garantiaDias: garantiaNum,
      garantiaFimISO: garantiaFim,
      observacao: observacao.trim(),
      vendedorNome: user.nome,
    });
    setTelefoneEnvio(clienteSel.whatsapp || clienteSel.telefone || "");
    setErroEnvio(null);

    // Avisa os administradores (não bloqueia a tela)
    notificarVendaNova(clienteSel.nome, total);

    limparFormulario();
    carregar();
  };

  const enviarWhatsApp = () => {
    if (!recibo) return;
    const numero = normalizarTelefone(telefoneEnvio);
    if (!numero) {
      setErroEnvio("Informe o WhatsApp do cliente para enviar o recibo.");
      return;
    }
    setErroEnvio(null);
    const texto = montarMensagemWhatsApp(recibo, loja);
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Venda de Máquina</h1>
        <p className="text-muted-foreground text-sm">
          Registre a venda com número de série, garantia e recibo para o cliente
        </p>
      </div>

      {erro && (
        <div className="flex items-center gap-2 rounded-md border border-red-900/30 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
          <AlertCircle size={16} className="shrink-0" /> {erro}
        </div>
      )}

      {!loading && ehHoje && !caixaAberto && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/40 shadow-sm">
          <CardContent className="pt-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Wallet size={16} /> Caixa fechado
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                Para registrar uma venda de hoje, abra o caixa primeiro. Vendas de data passada não precisam do caixa.
              </p>
            </div>
            <Button size="sm" onClick={() => router.push("/ponto-venda")} className="shrink-0">
              Abrir caixa
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="animate-spin" size={20} /> Carregando...
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
          {/* Coluna esquerda: máquina e cliente */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Receipt size={16} className="text-primary" /> Máquina
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {maquinaSel ? (
                  <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{maquinaSel.nome}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Preço de tabela: {brl(Number(maquinaSel.preco_venda))}
                      </p>
                    </div>
                    <button
                      onClick={limparMaquina}
                      className="text-muted-foreground hover:text-destructive ml-2 shrink-0"
                      title="Trocar máquina"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar máquina em estoque..."
                        value={buscaMaquina}
                        onChange={(e) => setBuscaMaquina(e.target.value)}
                        className="pl-9 h-10 text-sm"
                      />
                    </div>
                    {maquinasFiltradas.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Nenhuma máquina disponível em estoque.
                      </p>
                    ) : (
                      <div className="divide-y divide-border rounded-lg border border-border max-h-64 overflow-y-auto">
                        {maquinasFiltradas.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => selecionarMaquina(m)}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{m.nome}</p>
                              <p className="text-[11px] text-muted-foreground">{m.quantidade} un. em estoque</p>
                            </div>
                            <span className="font-bold text-sm text-primary ml-3 shrink-0">
                              {brl(Number(m.preco_venda))}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Hash size={12} /> Número de série *
                  </label>
                  <Input
                    value={numeroSerie}
                    onChange={(e) => setNumeroSerie(e.target.value)}
                    placeholder="Ex.: SN123456"
                    className="h-9 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <User2 size={16} className="text-primary" /> Cliente *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 relative">
                <div className="relative">
                  <Input
                    placeholder="Buscar cliente pelo nome..."
                    value={buscaCliente}
                    onChange={(e) => {
                      setBuscaCliente(e.target.value);
                      setClienteSel(null);
                      setMostrarListaClientes(true);
                    }}
                    onFocus={() => setMostrarListaClientes(true)}
                    className="h-9 text-sm pr-8"
                  />
                  {clienteSel && (
                    <button
                      onClick={limparCliente}
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {mostrarListaClientes && clientesFiltrados.length > 0 && (
                  <div className="absolute z-10 left-4 right-4 mt-0.5 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                    {clientesFiltrados.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selecionarCliente(c)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center justify-between"
                      >
                        <span className="font-medium">{c.nome}</span>
                        <span className="text-muted-foreground text-[10px]">{c.whatsapp || c.telefone}</span>
                      </button>
                    ))}
                  </div>
                )}

                {clienteSel ? (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                    ✓ {clienteSel.nome}
                  </Badge>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    O cliente é obrigatório: a venda e a garantia ficam no perfil dele.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna direita: dados da venda */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Dados da venda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Data da venda</label>
                  <Input
                    type="date"
                    value={dataVenda}
                    max={hoje}
                    onChange={(e) => setDataVenda(e.target.value)}
                    className="h-9 text-sm"
                  />
                  {!ehHoje && dataVenda && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-500">
                      Venda de data passada: entra no relatório de {formatarDataBR(dataVenda)} e não soma no caixa de hoje.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Preço (R$)</label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={preco}
                      onChange={(e) => setPreco(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Desconto (R$)</label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={desconto}
                      onChange={(e) => setDesconto(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Forma de pagamento</label>
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
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Garantia (dias)</label>
                  <Input
                    type="number"
                    min={0}
                    value={garantiaDias}
                    onChange={(e) => setGarantiaDias(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {garantiaFim
                      ? `Garantia até ${formatarDataBR(garantiaFim)}`
                      : "Sem garantia (0 dias)"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Observação</label>
                  <textarea
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Ex.: entregue com acessórios, combinado de revisão..."
                    className="w-full min-h-[72px] rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Vendedor(a)</span>
                    <span className="font-semibold text-foreground">{user.nome}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold border-t border-border pt-1.5 mt-1.5">
                    <span>Total</span>
                    <span className="text-primary text-base">{brl(total)}</span>
                  </div>
                </div>

                <Button
                  onClick={registrarVenda}
                  disabled={salvando}
                  className="w-full h-11 text-sm font-bold shadow-md gap-2"
                >
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Registrar venda
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recibo */}
      <Dialog open={!!recibo} onOpenChange={(aberto) => !aberto && setRecibo(null)}>
        <DialogContent className="sm:max-w-md">
          {recibo && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-500" /> Venda registrada
                </DialogTitle>
                <DialogDescription>Recibo nº {recibo.numero}</DialogDescription>
              </DialogHeader>

              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-semibold">{formatarDataBR(recibo.dataISO)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-semibold text-right">{recibo.clienteNome}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Máquina</span>
                  <span className="font-semibold text-right">{recibo.maquinaNome}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Nº de série</span>
                  <span className="font-semibold">{recibo.numeroSerie}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Pagamento</span>
                  <span className="font-semibold">{recibo.formaPagamento}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Garantia</span>
                  <span className="font-semibold text-right">
                    {recibo.garantiaDias > 0 && recibo.garantiaFimISO
                      ? `${recibo.garantiaDias} dias (até ${formatarDataBR(recibo.garantiaFimISO)})`
                      : "Sem garantia"}
                  </span>
                </div>
                {recibo.observacao && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Obs.</span>
                    <span className="font-semibold text-right">{recibo.observacao}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-1.5 mt-1.5 text-sm">
                  <span className="font-bold">Total</span>
                  <span className="font-extrabold text-primary">{brl(recibo.total)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">WhatsApp do cliente</label>
                <Input
                  value={telefoneEnvio}
                  onChange={(e) => setTelefoneEnvio(e.target.value)}
                  placeholder="(21) 99999-9999"
                  className="h-9 text-sm"
                />
                {erroEnvio && <p className="text-xs text-destructive">{erroEnvio}</p>}
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => imprimirRecibo(recibo, loja)} className="gap-2">
                  <Printer size={14} /> Imprimir
                </Button>
                <Button onClick={enviarWhatsApp} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                  <MessageCircle size={14} /> Enviar pelo WhatsApp
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
