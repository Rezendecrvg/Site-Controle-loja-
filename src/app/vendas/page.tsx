"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  CheckCircle,
  Clock,
  X,
  Trash2,
  ShoppingCart,
  User2,
} from "lucide-react";

interface ProdutoCarrinho {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  estoque: number;
}

const produtosMock = [
  { id: "1", nome: "Máquina Reta Lanmax LM-9980D", preco: 2300, estoque: 5, categoria: "Máquinas" },
  { id: "2", nome: "Overlock Lanmax LM-3800", preco: 1850, estoque: 3, categoria: "Máquinas" },
  { id: "3", nome: "Singer Facilita Pro 4423", preco: 1200, estoque: 8, categoria: "Máquinas" },
  { id: "4", nome: "Bobina Industrial M1", preco: 20, estoque: 200, categoria: "Peças" },
  { id: "5", nome: "Linha de Costura Premium 100m", preco: 15, estoque: 500, categoria: "Armarinho" },
  { id: "6", nome: "Agulha Industrial Pacote c/10", preco: 12, estoque: 150, categoria: "Peças" },
  { id: "7", nome: "Óleo Lubrificante Singer 100ml", preco: 25, estoque: 60, categoria: "Peças" },
  { id: "8", nome: "Elástico Chato 3cm (metro)", preco: 3.5, estoque: 1000, categoria: "Armarinho" },
];

const formasPagamento = ["Dinheiro", "Pix", "Cartão de Débito", "Cartão de Crédito", "Transferência"];

export default function VendasPage() {
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<ProdutoCarrinho[]>([]);
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
  const [desconto, setDesconto] = useState(0);
  const [clienteNome, setClienteNome] = useState("");
  const [vendaFinalizada, setVendaFinalizada] = useState(false);

  const produtosFiltrados = produtosMock.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.categoria.toLowerCase().includes(busca.toLowerCase())
  );

  const adicionarAoCarrinho = (produto: (typeof produtosMock)[0]) => {
    setCarrinho((prev) => {
      const existente = prev.find((c) => c.id === produto.id);
      if (existente) {
        if (existente.quantidade >= produto.estoque) return prev;
        return prev.map((c) =>
          c.id === produto.id ? { ...c, quantidade: c.quantidade + 1 } : c
        );
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
  };

  const removerDoCarrinho = (id: string) => {
    setCarrinho((prev) => prev.filter((c) => c.id !== id));
  };

  const alterarQuantidade = (id: string, delta: number) => {
    setCarrinho((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, quantidade: c.quantidade + delta } : c))
        .filter((c) => c.quantidade > 0)
    );
  };

  const subtotal = carrinho.reduce((acc, c) => acc + c.preco * c.quantidade, 0);
  const total = subtotal - desconto;

  const finalizarVenda = () => {
    if (carrinho.length === 0) return;
    setVendaFinalizada(true);
    setTimeout(() => {
      setCarrinho([]);
      setDesconto(0);
      setClienteNome("");
      setFormaPagamento("Dinheiro");
      setVendaFinalizada(false);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registro de Vendas</h1>
          <p className="text-muted-foreground text-sm">Adicione produtos ao carrinho e finalize a venda</p>
        </div>
        <div className="flex gap-4 text-xs">
          <Card className="px-4 py-2 flex items-center gap-2 shadow-sm">
            <TrendingUp size={16} className="text-emerald-500" />
            <div>
              <p className="text-muted-foreground">Hoje</p>
              <p className="font-bold text-sm">R$ 2.350,00</p>
            </div>
          </Card>
          <Card className="px-4 py-2 flex items-center gap-2 shadow-sm">
            <ShoppingCart size={16} className="text-primary" />
            <div>
              <p className="text-muted-foreground">Vendas</p>
              <p className="font-bold text-sm">6</p>
            </div>
          </Card>
        </div>
      </div>

      {vendaFinalizada && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800/40 p-4 shadow-sm animate-in fade-in-0 slide-in-from-top-2">
          <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0" />
          <div>
            <p className="font-bold text-emerald-700 dark:text-emerald-400">Venda Finalizada com Sucesso!</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
              Total: R$ {total.toFixed(2).replace(".", ",")} — Forma: {formaPagamento}. Carrinho limpo.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
        {/* COLUNA ESQUERDA — Catálogo de Produtos */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto por nome ou categoria..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-9 h-10 text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
                {produtosFiltrados.map((produto) => (
                  <div
                    key={produto.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors group"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="font-semibold text-sm text-foreground truncate">{produto.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0">{produto.categoria}</Badge>
                        <span className="text-[11px] text-muted-foreground">
                          Estoque: {produto.estoque} un.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-sm text-primary">
                        R$ {produto.preco.toFixed(2).replace(".", ",")}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => adicionarAoCarrinho(produto)}
                        className="h-8 w-8 p-0 rounded-lg text-xs shadow-sm"
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA DIREITA — Carrinho e Pagamento */}
        <div className="lg:col-span-2 space-y-4">
          {/* Identificação do Cliente */}
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <User2 size={16} className="text-primary" /> Identificação do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="Nome do cliente (opcional)"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                className="h-9 text-sm"
              />
              <Button variant="secondary" className="w-full h-9 text-xs font-semibold gap-1.5">
                <Users size={14} /> Buscar cliente cadastrado
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                Ou deixe em branco para venda Balcão (sem cadastro)
              </p>
            </CardContent>
          </Card>

          {/* Carrinho */}
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShoppingCart size={16} className="text-primary" /> Carrinho ({carrinho.length} itens)
              </CardTitle>
              {carrinho.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCarrinho([])}
                  className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive px-2"
                >
                  <Trash2 size={12} className="mr-1" /> Limpar
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {carrinho.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ShoppingCart size={32} className="mb-2 opacity-30" />
                  <p className="text-xs">Nenhum produto adicionado</p>
                </div>
              ) : (
                <div className="divide-y divide-border max-h-56 overflow-y-auto">
                  {carrinho.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs truncate">{item.nome}</p>
                        <p className="text-[10px] text-muted-foreground">
                          R$ {item.preco.toFixed(2).replace(".", ",")} un.
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => alterarQuantidade(item.id, -1)}
                          className="h-5 w-5 rounded border border-border text-xs hover:bg-muted flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-6 text-center">{item.quantidade}</span>
                        <button
                          onClick={() => alterarQuantidade(item.id, 1)}
                          className="h-5 w-5 rounded border border-border text-xs hover:bg-muted flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs font-bold w-16 text-right shrink-0">
                        R$ {(item.preco * item.quantidade).toFixed(2).replace(".", ",")}
                      </span>
                      <button
                        onClick={() => removerDoCarrinho(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                      >
                        <X size={14} />
                      </button>
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
                <DollarSign size={16} className="text-primary" /> Forma de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-1.5">
                {formasPagamento.map((fp) => (
                  <button
                    key={fp}
                    onClick={() => setFormaPagamento(fp)}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all ${
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
                  <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                </div>
                {desconto > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                    <span>Desconto</span>
                    <span>- R$ {desconto.toFixed(2).replace(".", ",")}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold border-t border-border pt-1.5 mt-1.5">
                  <span>Total</span>
                  <span className="text-primary text-base">R$ {total.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>

              <Button
                onClick={finalizarVenda}
                disabled={carrinho.length === 0 || vendaFinalizada}
                className="w-full h-11 text-sm font-bold shadow-md gap-2"
              >
                <CheckCircle size={16} />
                Finalizar Venda
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
