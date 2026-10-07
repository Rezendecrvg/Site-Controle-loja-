"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Package, Users, ShoppingCart, AlertCircle } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface DashboardData {
  vendas: number;
  faturamento: number;
  produtosAtivos: number;
  clientesCadastrados: number;
  estoqueBaixo: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [dados, setDados] = useState<DashboardData>({
    vendas: 0,
    faturamento: 0,
    produtosAtivos: 0,
    clientesCadastrados: 0,
    estoqueBaixo: 0,
  });

  const [vendasHoje, setVendasHoje] = useState<any[]>([]);
  const [estoqueBaixo, setEstoqueBaixoList] = useState<any[]>([]);
  const [produtosCategoria, setProdutosCategoria] = useState<any[]>([]);
  const [vendidosPorDia, setVendidosPorDia] = useState<any[]>([]);

  const carregarDashboard = useCallback(async () => {
    setLoading(true);
    setErro(null);

    try {
      // Contar vendas
      const { data: vendas, error: erroVendas } = await supabase
        .from("vendas")
        .select("*", { count: "exact" });

      if (erroVendas) throw erroVendas;

      // Calcular faturamento
      const faturamentoTotal = vendas?.reduce((sum, v) => sum + (v.total || 0), 0) || 0;

      // Produtos ativos
      const { data: produtos, error: erroProd } = await supabase
        .from("produtos")
        .select("*, fotos_produtos(*)", { count: "exact" })
        .eq("ativo", true);

      if (erroProd) throw erroProd;

      // Clientes cadastrados
      const { data: clientes, error: erroClientes } = await supabase
        .from("clientes")
        .select("*", { count: "exact" });

      if (erroClientes) throw erroClientes;

      // Estoque baixo
      const { data: produtosEstoque } = await supabase
        .from("produtos")
        .select("nome, quantidade, estoque_minimo")
        .gte("estoque_minimo", supabase.rpc("quantidade"))
        .limit(5);

      // Produtos por categoria
      const { data: categorias } = await supabase
        .from("categorias")
        .select("id, nome", { count: "exact" });

      const produtosPerCateg: { [key: string]: number } = {};
      for (const cat of categorias || []) {
        const { count } = await supabase
          .from("produtos")
          .select("*", { count: "exact", head: true })
          .eq("categoria_id", cat.id);

        if (count) produtosPerCateg[cat.nome] = count;
      }

      const categoriasArray = Object.entries(produtosPerCateg).map(([name, value]) => ({
        name,
        value,
      }));

      // Vendas nos últimos 7 dias
      const ultimosDias = Array.from({ length: 7 }, (_, i) => {
        const data = new Date();
        data.setDate(data.getDate() - (6 - i));
        return data.toISOString().split("T")[0];
      });

      const vendidosPorDiaData: { [key: string]: number } = {};
      ultimosDias.forEach((dia) => {
        vendidosPorDiaData[dia] = 0;
      });

      vendas?.forEach((v: any) => {
        const dia = v.data?.split("T")[0];
        if (dia && vendidosPorDiaData[dia] !== undefined) {
          vendidosPorDiaData[dia] += v.total || 0;
        }
      });

      const vendidosArray = ultimosDias.map((dia) => ({
        dia: new Date(dia).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" }),
        vendas: vendidosPorDiaData[dia],
      }));

      // Estoque abaixo do mínimo
      const estoqueBaixoList = (produtos || [])
        .filter((p: any) => p.quantidade <= p.estoque_minimo)
        .slice(0, 5)
        .map((p: any) => ({
          nome: p.nome,
          quantidade: p.quantidade,
          minimo: p.estoque_minimo,
          imagem: p.fotos_produtos?.[0]?.url,
        }));

      setDados({
        vendas: vendas?.length || 0,
        faturamento: faturamentoTotal,
        produtosAtivos: produtos?.length || 0,
        clientesCadastrados: clientes?.length || 0,
        estoqueBaixo: estoqueBaixoList.length,
      });

      setVendasHoje(vendas?.slice(0, 10) || []);
      setEstoqueBaixoList(estoqueBaixoList);
      setProdutosCategoria(categoriasArray);
      setVendidosPorDia(vendidosArray);
    } catch (error: any) {
      setErro("Erro ao carregar dashboard: " + (error?.message ?? "Erro desconhecido"));
      console.error(error);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    carregarDashboard();
  }, [carregarDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando dashboard...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-lg">
        {erro}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio em tempo real</p>
      </div>

      {/* Cards KPI */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Faturamento</p>
              <p className="text-2xl font-bold">R$ {(dados.faturamento / 1000).toFixed(1)}k</p>
            </div>
            <TrendingUp className="text-primary" size={24} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Vendas</p>
              <p className="text-2xl font-bold">{dados.vendas}</p>
            </div>
            <ShoppingCart className="text-emerald-500" size={24} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Produtos Ativos</p>
              <p className="text-2xl font-bold">{dados.produtosAtivos}</p>
            </div>
            <Package className="text-indigo-500" size={24} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Clientes</p>
              <p className="text-2xl font-bold">{dados.clientesCadastrados}</p>
            </div>
            <Users className="text-purple-500" size={24} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Estoque Baixo</p>
              <p className="text-2xl font-bold text-red-600">{dados.estoqueBaixo}</p>
            </div>
            <AlertCircle className="text-red-500" size={24} />
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Vendas últimos 7 dias */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vendas - Últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={vendidosPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="dia" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: "8px" }} />
                <Area type="monotone" dataKey="vendas" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Produtos por categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produtos por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={produtosCategoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {produtosCategoria.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {estoqueBaixo.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-yellow-900">
              <AlertCircle size={18} />
              Produtos com Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {estoqueBaixo.map((produto, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{produto.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {produto.quantidade} em estoque (mínimo: {produto.minimo})
                    </p>
                  </div>
                  <button className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors">
                    Repor
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
