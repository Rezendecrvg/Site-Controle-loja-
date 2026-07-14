"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Filter,
  Package,
  AlertTriangle,
  Edit2,
  Eye,
  Star,
  Tag,
} from "lucide-react";

const produtosMock = [
  { id: 1, nome: "Máquina Reta Lanmax LM-9980D", categoria: "Máquinas", marca: "Lanmax", modelo: "LM-9980D", preco: 2300, custo: 1550, qtd: 5, minimo: 2, ativo: true, destaque: true, promocao: false },
  { id: 2, nome: "Overlock Lanmax LM-3800", categoria: "Máquinas", marca: "Lanmax", modelo: "LM-3800", preco: 1850, custo: 1200, qtd: 3, minimo: 1, ativo: true, destaque: false, promocao: true },
  { id: 3, nome: "Singer Facilita Pro 4423", categoria: "Máquinas", marca: "Singer", modelo: "4423", preco: 1200, custo: 780, qtd: 8, minimo: 2, ativo: true, destaque: true, promocao: false },
  { id: 4, nome: "Bobina Industrial M1", categoria: "Peças", marca: "Genérica", modelo: "M1", preco: 20, custo: 8, qtd: 200, minimo: 50, ativo: true, destaque: false, promocao: false },
  { id: 5, nome: "Linha de Costura Premium 100m", categoria: "Armarinho", marca: "Corrente", modelo: "100m", preco: 15, custo: 5, qtd: 500, minimo: 100, ativo: true, destaque: false, promocao: true },
  { id: 6, nome: "Agulha Industrial Pacote c/10", categoria: "Peças", marca: "Groz-Beckert", modelo: "16x231", preco: 12, custo: 4.5, qtd: 2, minimo: 20, ativo: true, destaque: false, promocao: false },
  { id: 7, nome: "Óleo Lubrificante Singer 100ml", categoria: "Peças", marca: "Singer", modelo: "100ml", preco: 25, custo: 9, qtd: 60, minimo: 15, ativo: true, destaque: false, promocao: false },
  { id: 8, nome: "Elástico Chato 3cm (metro)", categoria: "Armarinho", marca: "Corrente", modelo: "3cm", preco: 3.5, custo: 1.2, qtd: 1000, minimo: 200, ativo: true, destaque: false, promocao: false },
];

type Filtro = "todos" | "Máquinas" | "Peças" | "Armarinho";

export default function ProdutosPage() {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const produtosFiltrados = produtosMock.filter((p) => {
    const matchBusca =
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.marca.toLowerCase().includes(busca.toLowerCase());
    const matchFiltro = filtro === "todos" || p.categoria === filtro;
    return matchBusca && matchFiltro;
  });

  const totalProdutos = produtosMock.length;
  const emAlerta = produtosMock.filter((p) => p.qtd <= p.minimo).length;
  const emPromocao = produtosMock.filter((p) => p.promocao).length;
  const valorEstoque = produtosMock.reduce((a, p) => a + p.custo * p.qtd, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Produtos</h1>
          <p className="text-muted-foreground text-sm">Cadastro, estoque e preços de todos os itens da loja</p>
        </div>
        <Button className="gap-2 font-semibold shadow-sm">
          <Plus size={16} /> Novo Produto
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-primary" />
            <span className="text-xs font-bold text-muted-foreground uppercase">Total Produtos</span>
          </div>
          <p className="text-2xl font-extrabold">{totalProdutos}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-xs font-bold text-muted-foreground uppercase">Estoque Mínimo</span>
          </div>
          <p className="text-2xl font-extrabold text-amber-500">{emAlerta}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Tag size={16} className="text-emerald-500" />
            <span className="text-xs font-bold text-muted-foreground uppercase">Em Promoção</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{emPromocao}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-indigo-500" />
            <span className="text-xs font-bold text-muted-foreground uppercase">Valor em Estoque</span>
          </div>
          <p className="text-xl font-extrabold">R$ {valorEstoque.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card className="shadow-sm border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, marca ou modelo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>
            <div className="flex gap-1.5 p-1 bg-muted rounded-lg">
              {(["todos", "Máquinas", "Peças", "Armarinho"] as Filtro[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    filtro === f
                      ? "bg-card shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "todos" ? "Todos" : f}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Produtos */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold">
            {produtosFiltrados.length} produto(s) encontrado(s)
          </CardTitle>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
            <Filter size={14} /> Filtros avançados
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-bold text-muted-foreground uppercase">
                  <th className="px-4 py-3 text-left">Produto</th>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-right">Custo</th>
                  <th className="px-4 py-3 text-right">Venda</th>
                  <th className="px-4 py-3 text-right">Margem</th>
                  <th className="px-4 py-3 text-right">Estoque</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {produtosFiltrados.map((p) => {
                  const margem = (((p.preco - p.custo) / p.preco) * 100).toFixed(1);
                  const estoqueBaixo = p.qtd <= p.minimo;
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {p.destaque && <Star size={12} className="text-amber-400 shrink-0" />}
                          <div>
                            <p className="font-semibold text-foreground">{p.nome}</p>
                            <p className="text-[11px] text-muted-foreground">{p.marca} — {p.modelo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] font-semibold">{p.categoria}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-muted-foreground">
                        R$ {p.custo.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        R$ {p.preco.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-bold ${parseFloat(margem) > 30 ? "text-emerald-600" : "text-amber-600"}`}>
                          {margem}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {estoqueBaixo && <AlertTriangle size={12} className="text-amber-500" />}
                          <span className={`font-bold text-sm ${estoqueBaixo ? "text-destructive" : "text-foreground"}`}>
                            {p.qtd}
                          </span>
                          <span className="text-[10px] text-muted-foreground">/ mín {p.minimo}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {p.promocao && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-emerald-500/10 text-emerald-600 border-none font-bold">Promoção</Badge>
                          )}
                          {p.destaque && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-600 border-none font-bold">Destaque</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <Eye size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                            <Edit2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
