"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  TrendingUp,
  Wallet,
  Package,
  Layers,
  Users,
  Wrench,
  Shield,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  PlusCircle,
  Play,
  CheckCircle,
  Clock,
  Printer,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

// Mock data para os gráficos
const salesData = [
  { name: "Seg", vendas: 1200, lucro: 400 },
  { name: "Ter", vendas: 1900, lucro: 650 },
  { name: "Qua", vendas: 1500, lucro: 500 },
  { name: "Qui", vendas: 2400, lucro: 850 },
  { name: "Sex", vendas: 2350, lucro: 800 },
  { name: "Sáb", vendas: 3100, lucro: 1100 },
  { name: "Dom", vendas: 900, lucro: 300 },
];

const categoryData = [
  { name: "Máquinas", faturamento: 12400 },
  { name: "Peças", faturamento: 4500 },
  { name: "Armarinho", faturamento: 2100 },
  { name: "Serviços", faturamento: 3800 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("Hoje");

  if (!user) return null;

  const isAdmin = user.perfil === "Administrador";

  return (
    <div className="space-y-6">
      {/* Top Header com Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Olá, {user.nome.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground text-sm">
            {isAdmin
              ? "Aqui está o resumo financeiro e operacional da West Máquinas."
              : "Bem-vinda à sua Central de Atendimento. O que vamos fazer hoje?"}
          </p>
        </div>

        {/* Filtros rápidos do Dashboard */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card p-1 shadow-sm max-w-fit">
          {["Hoje", "Ontem", "7 dias", "30 dias", "Este mês", "Ano"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === item
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {isAdmin ? (
        /* ==================== DASHBOARD ADMINISTRADOR ==================== */
        <div className="space-y-6">
          {/* Grid de Cards de Indicadores */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card className="shadow-sm border-border bg-card hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Vendas Hoje</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <TrendingUp size={16} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold">R$ 2.350,00</div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold mt-1">
                  <ArrowUpRight size={14} />
                  <span>+18% que ontem</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Vendas Semana</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <TrendingUp size={16} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold">R$ 14.300,00</div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold mt-1">
                  <ArrowUpRight size={14} />
                  <span>+5.2% semana anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Vendas Mês</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                  <TrendingUp size={16} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold">R$ 48.500,00</div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold mt-1">
                  <span>Meta: 80.8% alcançada</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ticket Médio</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                  <Users size={16} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold">R$ 380,00</div>
                <div className="flex items-center gap-1 text-[11px] text-destructive font-semibold mt-1">
                  <ArrowDownRight size={14} />
                  <span>-2.1% ref. mês ant.</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lucro Estimado</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <Layers size={16} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold">R$ 18.250,00</div>
                <div className="text-[11px] text-muted-foreground font-semibold mt-1">
                  Margem média: 37.6%
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Caixa</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Wallet size={16} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold">R$ 450,00</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span className="text-[10px] text-muted-foreground font-bold">Aberto hoje</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seção de Ações Rápidas */}
          <Card className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-none shadow-md overflow-hidden relative">
            <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary via-purple-500 to-slate-900 hidden md:block"></div>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Atalhos e Ações Rápidas</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Acesse rapidamente as ferramentas mais comuns do dia a dia
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2.5">
              <Button size="sm" className="bg-primary hover:bg-primary/95 text-white border-none shadow-sm text-xs font-semibold gap-1.5">
                <PlusCircle size={15} /> Nova Venda
              </Button>
              <Button size="sm" variant="secondary" className="text-xs font-semibold gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border-none">
                <Wrench size={15} /> Nova OS
              </Button>
              <Button size="sm" variant="secondary" className="text-xs font-semibold gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border-none">
                <Users size={15} /> Novo Cliente
              </Button>
              <Button size="sm" variant="secondary" className="text-xs font-semibold gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border-none">
                <Package size={15} /> Novo Produto
              </Button>
              <Button size="sm" variant="secondary" className="text-xs font-semibold gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border-none">
                <Wallet size={15} /> Registrar Movimentação
              </Button>
            </CardContent>
          </Card>

          {/* Gráficos Financeiros e de Categoria */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* Gráfico de Linhas */}
            <Card className="lg:col-span-2 shadow-sm border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-base font-bold">Faturamento vs. Lucro Estimado</CardTitle>
                  <CardDescription className="text-xs">Valores semanais acumulados</CardDescription>
                </div>
                <div className="flex gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5 text-primary">
                    <span className="h-2 w-2 rounded-full bg-primary inline-block"></span> Vendas
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span> Lucro
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                    <Line type="monotone" dataKey="vendas" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="lucro" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Vendas por Categoria */}
            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">Faturamento por Categoria</CardTitle>
                <CardDescription className="text-xs">Distribuição de receita no período</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                    <Bar dataKey="faturamento" fill="oklch(0.205 0 0)" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Produtos e Indicadores de Alerta */}
          <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
            {/* Produtos mais vendidos */}
            <Card className="xl:col-span-2 shadow-sm border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold">Produtos Mais Vendidos</CardTitle>
                  <CardDescription className="text-xs">Produtos campeões de faturamento</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-primary font-bold">Ver todos</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-xs font-bold text-muted-foreground uppercase">
                        <th className="px-4 py-3">Produto</th>
                        <th className="px-4 py-3">Categoria</th>
                        <th className="px-4 py-3 text-right">Qtd. Vendida</th>
                        <th className="px-4 py-3 text-right">Faturamento</th>
                        <th className="px-4 py-3 text-right">Lucro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      <tr>
                        <td className="px-4 py-3 font-semibold text-foreground">Máquina Reta Lanmax</td>
                        <td className="px-4 py-3 text-muted-foreground">Máquinas</td>
                        <td className="px-4 py-3 text-right font-medium">8</td>
                        <td className="px-4 py-3 text-right font-medium">R$ 18.400,00</td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-500">R$ 6.200,00</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-foreground">Bobina Industrial M1</td>
                        <td className="px-4 py-3 text-muted-foreground">Peças</td>
                        <td className="px-4 py-3 text-right font-medium">120</td>
                        <td className="px-4 py-3 text-right font-medium">R$ 2.400,00</td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-500">R$ 950,00</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-foreground">Linha de Costura Premium</td>
                        <td className="px-4 py-3 text-muted-foreground">Armarinho</td>
                        <td className="px-4 py-3 text-right font-medium">85</td>
                        <td className="px-4 py-3 text-right font-medium">R$ 1.275,00</td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-500">R$ 510,00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Notificações e Alertas Inteligentes */}
            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Alertas Operacionais</CardTitle>
                <CardDescription className="text-xs">Pontos de atenção que necessitam de ação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-destructive">Estoque Crítico</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      5 produtos estão abaixo do estoque mínimo configurado.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">Ordens de Serviço Atrasadas</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Existem 3 ordens de serviço atrasadas com prazo estourado.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Garantias Ativas</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Nenhuma garantia de cliente expira nas próximas 24 horas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* ==================== CENTRAL DE ATENDIMENTO DA VENDEDORA ==================== */
        <div className="space-y-6">
          {/* Resumo do Dia no Topo */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
            <Card className="p-4 border-border bg-card text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Caixa</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">Aberto</p>
            </Card>
            <Card className="p-4 border-border bg-card text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vendido Hoje</p>
              <p className="text-lg font-bold text-foreground mt-1">R$ 1.850,00</p>
            </Card>
            <Card className="p-4 border-border bg-card text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vendas Feitas</p>
              <p className="text-lg font-bold text-foreground mt-1">6</p>
            </Card>
            <Card className="p-4 border-border bg-card text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">OS Abertas</p>
              <p className="text-lg font-bold text-foreground mt-1">4</p>
            </Card>
            <Card className="p-4 border-border bg-card text-center col-span-2 md:col-span-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Clientes Atendidos</p>
              <p className="text-lg font-bold text-foreground mt-1">10</p>
            </Card>
          </div>

          {/* Painel Central */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* Ações e Atalhos da Vendedora */}
            <Card className="shadow-sm border-border bg-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-bold">Ações Rápidas de Vendas e Serviços</CardTitle>
                <CardDescription className="text-xs">Inicie um atendimento em poucos cliques</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <Button className="h-16 flex items-center justify-start gap-4 p-4 text-left shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                    <Plus size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Registrar Nova Venda</div>
                    <div className="text-[10px] text-primary-foreground/80 font-normal">Máquinas, peças ou armarinho</div>
                  </div>
                </Button>

                <Button variant="secondary" className="h-16 flex items-center justify-start gap-4 p-4 text-left bg-muted border border-border shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Abrir Ordem de Serviço</div>
                    <div className="text-[10px] text-muted-foreground font-normal">Assistência técnica e reparos</div>
                  </div>
                </Button>

                <Button variant="secondary" className="h-16 flex items-center justify-start gap-4 p-4 text-left bg-muted border border-border shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Cadastrar Novo Cliente</div>
                    <div className="text-[10px] text-muted-foreground font-normal">Cadastro rápido para venda ou OS</div>
                  </div>
                </Button>

                <Button variant="secondary" className="h-16 flex items-center justify-start gap-4 p-4 text-left bg-muted border border-border shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Package size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Consultar Estoque Rápido</div>
                    <div className="text-[10px] text-muted-foreground font-normal">Veja preços e quantidades</div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Pendências e Notificações */}
            <Card className="shadow-sm border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base font-bold">Máquinas Prontas para Retirada</CardTitle>
                <CardDescription className="text-xs">Ordens de serviço finalizadas aguardando o cliente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-xs font-bold">Maria da Silva</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Singer Facilita (OS #102)</p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] font-bold">
                    Pronta
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-xs font-bold">José de Souza</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Lanmax Galoneira (OS #104)</p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] font-bold">
                    Pronta
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Histórico Recente */}
          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Histórico Recente de Atendimentos</CardTitle>
              <CardDescription className="text-xs">Suas últimas ações executadas hoje</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Venda Registrada</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Cliente: Balcão | Total: R$ 45,00</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">15 min atrás</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Ordem de Serviço Aberta</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Cliente: Maria da Silva | Máquina: Singer Facilita</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">1 hora atrás</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
