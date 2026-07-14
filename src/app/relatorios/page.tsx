"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Layers, Wrench, Printer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Button } from "@/components/ui/button";

const vendasMensais = [
  { mes: "Jan", faturamento: 38000, lucro: 14200 },
  { mes: "Fev", faturamento: 42000, lucro: 15800 },
  { mes: "Mar", faturamento: 51000, lucro: 19200 },
  { mes: "Abr", faturamento: 45000, lucro: 16900 },
  { mes: "Mai", faturamento: 39000, lucro: 14600 },
  { mes: "Jun", faturamento: 48000, lucro: 18100 },
  { mes: "Jul", faturamento: 48500, lucro: 18250 },
];

const vendedoras = [
  { nome: "Admin", vendas: 28, total: 42000 },
  { nome: "Sarah", vendas: 45, total: 36500 },
];

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState("Mês atual");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Relatórios e Business Intelligence</h1>
          <p className="text-muted-foreground text-sm">Análises financeiras, de vendas e operacionais</p>
        </div>
        <Button variant="outline" className="gap-2 text-xs font-semibold"><Printer size={14} /> Imprimir</Button>
      </div>

      <div className="flex gap-1.5 p-1 bg-muted rounded-lg w-fit">
        {["Hoje", "Semana", "Mês atual", "Ano"].map(p => (
          <button key={p} onClick={() => setPeriodo(p)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${periodo === p ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{p}</button>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="p-4 shadow-sm"><div className="flex items-center gap-2 mb-1"><TrendingUp size={16} className="text-primary" /><span className="text-[10px] font-bold text-muted-foreground uppercase">Faturamento</span></div><p className="text-xl font-extrabold">R$ 48.500</p><p className="text-[11px] text-emerald-500 font-semibold">↑ +4.2% vs mês ant.</p></Card>
        <Card className="p-4 shadow-sm"><div className="flex items-center gap-2 mb-1"><FileText size={16} className="text-emerald-500" /><span className="text-[10px] font-bold text-muted-foreground uppercase">Lucro Líquido</span></div><p className="text-xl font-extrabold text-emerald-600">R$ 18.250</p><p className="text-[11px] text-muted-foreground">Margem: 37.6%</p></Card>
        <Card className="p-4 shadow-sm"><div className="flex items-center gap-2 mb-1"><Layers size={16} className="text-indigo-500" /><span className="text-[10px] font-bold text-muted-foreground uppercase">Total Vendas</span></div><p className="text-xl font-extrabold">73</p><p className="text-[11px] text-muted-foreground">Ticket médio: R$ 664</p></Card>
        <Card className="p-4 shadow-sm"><div className="flex items-center gap-2 mb-1"><Wrench size={16} className="text-purple-500" /><span className="text-[10px] font-bold text-muted-foreground uppercase">OS Concluídas</span></div><p className="text-xl font-extrabold">18</p><p className="text-[11px] text-muted-foreground">Faturamento: R$ 6.840</p></Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base font-bold">Faturamento vs. Lucro Mensal (2026)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vendasMensais} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px" }} />
                <Line type="monotone" dataKey="faturamento" stroke="oklch(0.488 0.243 264.376)" strokeWidth={2.5} dot={{ r: 3 }} name="Faturamento" />
                <Line type="monotone" dataKey="lucro" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name="Lucro" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base font-bold">Desempenho por Colaboradora</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {vendedoras.map(v => (
                <div key={v.nome} className="flex items-center gap-4 px-4 py-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">{v.nome.charAt(0)}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{v.nome}</p>
                    <p className="text-xs text-muted-foreground">{v.vendas} vendas realizadas</p>
                  </div>
                  <p className="font-extrabold text-sm text-emerald-600">R$ {v.total.toLocaleString("pt-BR")}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
