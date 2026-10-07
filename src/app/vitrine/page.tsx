"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ShoppingCart,
  X,
  Plus,
  Minus,
  CheckCircle,
  Loader2,
  AlertCircle,
  Star,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco_venda: number;
  quantidade: number;
  destaque: boolean;
  em_promocao: boolean;
  categoria_id: string | null;
  categorias?: { nome: string } | null;
}

interface Categoria {
  id: string;
  nome: string;
}

interface ItemCarrinho {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  estoqueDisponivel: number;
}

const formasPagamento = ["Dinheiro", "Pix", "Cartão de Débito", "Cartão de Crédito", "Transferência"] as const;

export default function VitrinePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<(typeof formasPagamento)[number]>("Pix");
  const [desconto, setDesconto] = useState(0);

  const [finalizando, setFinalizando] = useState(false);
  const [compraFinalizada, setCompraFinalizada] = useState(false);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro(null);

    try {
      // Buscar categorias (excluindo Armarinho)
      const { data: categoriasData, error: categoriasErro } = await supabase
        .from("categorias")
        .select("id, nome")
        .neq("nome", "Armarinho")
        .order("nome");

      if (categoriasErro) throw categoriasErro;

      const categoriaIds = (categoriasData ?? []).map((c: any) => c.id);

      // Buscar produtos ativos das categorias válidas
      const { data: produtosData, error: produtosErro } = await supabase
        .from("produtos")
        .select("*, categorias(nome)")
        .eq("ativo", true)
        .in("categoria_id", categoriaIds.length > 0 ? categoriaIds : [null])
        .order("destaque", { ascending: false })
        .order("nome");

      if (produtosErro) throw produtosErro;

      setProdutos((produtosData ?? []) as unknown as Produto[]);
      setCategorias((categoriasData ?? []) as Categoria[]);
    } catch (error: any) {
      setErro("Erro ao carregar produtos: " + (error?.message ?? "Erro desconhecido"));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase();
    return produtos.filter((p) => {
      const matchBusca =
        p.nome.toLowerCase().includes(termo) || (p.descricao ?? "").toLowerCase().includes(termo);
      const matchCategoria = filtroCategoria === "todos" || p.categoria_id === filtroCategoria;
      return matchBusca && matchCategoria;
    });
  }, [produtos, busca, filtroCategoria]);

  const adicionarAoCarrinho = (produto: Produto) => {
    setErro(null);
    setCarrinho((prev) => {
      const existente = prev.find((c) => c.id === produto.id);
      if (existente) {
        if (existente.quantidade >= produto.quantidade) {
          setErro("Estoque insuficiente para adicionar mais unidades.");
          return prev;
        }
        return prev.map((c) => (c.id === produto.id ? { ...c, quantidade: c.quantidade + 1 } : c));
      }
      if (produto.quantidade <= 0) {
        setErro("Produto sem estoque disponível.");
        return prev;
      }
      return [...prev, {
        id: produto.id,
        nome: produto.nome,
        preco: Number(produto.preco_venda),
        quantidade: 1,
        estoqueDisponivel: produto.quantidade,
      }];
    });
  };

  const removerDoCarrinho = (id: string) => setCarrinho((prev) => prev.filter((c) => c.id !== id));

  const alterarQuantidade = (id: string, delta: number) => {
    setCarrinho((prev) =>
      prev
        .map((c) => {
          if (c.id !== id) return c;
          const novaQtd = c.quantidade + delta;
          if (novaQtd > c.estoqueDisponivel) return c;
          return { ...c, quantidade: novaQtd };
        })
        .filter((c) => c.quantidade > 0)
    );
  };

  const subtotal = carrinho.reduce((acc, c) => acc + c.preco * c.quantidade, 0);
  const total = Math.max(0, subtotal - desconto);

  const finalizarCompra = async () => {
    if (carrinho.length === 0 || !nome.trim() || !telefone.trim()) {
      setErro("Preencha seu nome, telefone e adicione produtos ao carrinho.");
      return;
    }
    setErro(null);
    setFinalizando(true);

    // Criar cliente se não existir
    let clienteId: string | null = null;
    const { data: clienteExistente } = await supabase
      .from("clientes")
      .select("id")
      .eq("telefone", telefone.trim())
      .maybeSingle();

    if (clienteExistente) {
      clienteId = clienteExistente.id;
    } else {
      const { data: clienteNovo, error: erroCliente } = await supabase
        .from("clientes")
        .insert({
          nome: nome.trim(),
          telefone: telefone.trim(),
          email: email.trim() || null,
          endereco: endereco.trim() || null,
        })
        .select("id")
        .single();

      if (erroCliente) {
        setFinalizando(false);
        setErro("Erro ao criar conta do cliente: " + erroCliente.message);
        return;
      }
      clienteId = clienteNovo?.id ?? null;
    }

    // Finalizar venda como vendedor do sistema (ou sem vendedor)
    const itens = carrinho.map((c) => ({
      produto_id: c.id,
      quantidade: c.quantidade,
      preco_unitario: c.preco,
      desconto: 0,
    }));

    const { error: erroVenda } = await supabase.rpc("finalizar_venda", {
      p_cliente_id: clienteId,
      p_vendedor_id: null,
      p_forma_pagamento: formaPagamento,
      p_desconto: desconto,
      p_itens: itens,
    });

    setFinalizando(false);

    if (erroVenda) {
      setErro(erroVenda.message.replace(/^.*?:\s*/, ""));
      return;
    }

    setCompraFinalizada(true);
    setCarrinho([]);
    setNome("");
    setTelefone("");
    setEmail("");
    setEndereco("");
    setDesconto(0);
    setFormaPagamento("Pix");
    setCarrinhoAberto(false);
    carregarDados();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg">W</div>
              <h1 className="text-2xl font-bold tracking-tight">West Máquinas</h1>
            </div>
            <button
              onClick={() => setCarrinhoAberto(true)}
              className="relative inline-flex items-center justify-center p-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all shadow-md hover:shadow-lg gap-2 font-bold"
            >
              <ShoppingCart size={20} />
              <span className="text-sm">Carrinho</span>
              {carrinho.length > 0 && (
                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-extrabold flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {carrinho.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {compraFinalizada && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
            <CheckCircle className="text-emerald-600 shrink-0" size={24} />
            <div>
              <p className="font-bold text-emerald-700 dark:text-emerald-400">Compra finalizada com sucesso!</p>
              <p className="text-sm text-emerald-600 dark:text-emerald-500">Obrigado por comprar na West Máquinas. Em breve entraremos em contato para confirmar a entrega.</p>
            </div>
          </div>
        </div>
      )}

      {erro && (
        <div className="bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
            <AlertCircle className="text-red-600 shrink-0" size={24} />
            <p className="text-red-700 dark:text-red-400">{erro}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Busca e Filtros */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar máquinas, peças, armarinho..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-12 h-12 text-base border-slate-200 dark:border-slate-800"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroCategoria("todos")}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                filtroCategoria === "todos"
                  ? "bg-primary text-white shadow-md"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              Todos
            </button>
            {categorias.map((c) => (
              <button
                key={c.id}
                onClick={() => setFiltroCategoria(c.id)}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                  filtroCategoria === c.id
                    ? "bg-primary text-white shadow-md"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {c.nome}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Produtos */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
            <Loader2 className="animate-spin" size={20} /> Carregando produtos...
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
            <ShoppingCart size={32} className="opacity-40" />
            <p className="text-lg font-medium">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {produtosFiltrados.map((produto) => (
              <Card
                key={produto.id}
                className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              >
                <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 h-48 flex items-center justify-center">
                  <div className="text-slate-400 text-sm font-medium">Imagem não disponível</div>
                  {produto.destaque && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-400 text-white px-2 py-1 rounded-full text-xs font-bold">
                      <Star size={12} fill="currentColor" /> Destaque
                    </div>
                  )}
                  {produto.em_promocao && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      Em Promoção
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm line-clamp-2">{produto.nome}</h3>
                    {produto.categorias?.nome && (
                      <Badge variant="outline" className="text-[10px] mt-1">
                        {produto.categorias.nome}
                      </Badge>
                    )}
                  </div>

                  {produto.descricao && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{produto.descricao}</p>
                  )}

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-primary">
                      R$ {Number(produto.preco_venda).toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {produto.quantidade > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Em estoque</span>
                    ) : (
                      <span className="text-slate-500">Fora de estoque</span>
                    )}
                  </div>

                  <Button
                    onClick={() => adicionarAoCarrinho(produto)}
                    disabled={produto.quantidade === 0}
                    className="w-full gap-2 font-semibold"
                  >
                    <ShoppingCart size={16} /> Adicionar ao Carrinho
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog do Carrinho */}
      <Dialog open={carrinhoAberto} onOpenChange={setCarrinhoAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Seu Carrinho ({carrinho.length} itens)</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Lista de Produtos */}
            {carrinho.length > 0 ? (
              <div className="space-y-3">
                {carrinho.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.nome}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        R$ {item.preco.toFixed(2).replace(".", ",")} cada
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => alterarQuantidade(item.id, -1)}
                        className="h-6 w-6 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-sm"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold w-5 text-center">{item.quantidade}</span>
                      <button
                        onClick={() => alterarQuantidade(item.id, 1)}
                        className="h-6 w-6 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-sm"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-sm font-bold w-20 text-right">
                      R$ {(item.preco * item.quantidade).toFixed(2).replace(".", ",")}
                    </span>
                    <button
                      onClick={() => removerDoCarrinho(item.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                <ShoppingCart size={28} className="mb-2 opacity-40" />
                <p className="text-sm">Carrinho vazio</p>
              </div>
            )}

            {/* Divisor */}
            {carrinho.length > 0 && <div className="border-t border-slate-200 dark:border-slate-700"></div>}

            {/* Dados do Cliente - SEMPRE VISÍVEL */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm">Dados para Entrega</h3>
              <Input placeholder="Seu nome *" value={nome} onChange={(e) => setNome(e.target.value)} className="h-9 text-sm" />
              <Input
                placeholder="Telefone/WhatsApp *"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="h-9 text-sm"
              />
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 text-sm" />
              <Input
                placeholder="Endereço de entrega"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="h-9 text-sm"
              />

              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  {formasPagamento.map((fp) => (
                    <button
                      key={fp}
                      onClick={() => setFormaPagamento(fp)}
                      className={`py-2 rounded-lg border text-xs font-semibold transition-all ${
                        formaPagamento === fp
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {fp}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold w-24">Desconto (R$)</label>
                <Input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={desconto}
                  onChange={(e) => setDesconto(Number(e.target.value))}
                  className="h-9 text-sm"
                />
              </div>

              {carrinho.length > 0 && (
                <div className="space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                  </div>
                  {desconto > 0 && (
                    <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Desconto</span>
                      <span>- R$ {desconto.toFixed(2).replace(".", ",")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold border-t border-slate-200 dark:border-slate-700 pt-2 mt-1">
                    <span>Total</span>
                    <span className="text-lg">R$ {total.toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCarrinhoAberto(false)}>
              Continuar Comprando
            </Button>
            <Button
              onClick={finalizarCompra}
              disabled={carrinho.length === 0 || finalizando}
              className="gap-2"
            >
              {finalizando ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Finalizar Compra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
