"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, TrendingUp, TrendingDown, AlertTriangle, History } from "lucide-react";

const movimentacoes = [
  { id: 1, produto: "Bobina Industrial M1", tipo: "Entrada", qtd: 100, usuario: "Admin", data: "13/07/2026 09:00", obs: "Reposição de estoque" },
  { id: 2, produto: "Máquina Reta Lanmax LM-9980D", tipo: "Venda", qtd: 1, usuario: "Sarah", data: "13/07/2026 10:15", obs: "Venda #020" },
  { id: 3, produto: "Agulha Industrial Pct c/10", tipo: "Venda", qtd: 5, usuario: "Sarah", data: "13/07/2026 11:00", obs: "Venda #021" },
  { id: 4, produto: "Singer Facilita Pro 4423", tipo: "Ajuste Manual", qtd: -1, usuario: "Admin", data: "12/07/2026 16:30", obs: "Quebra detectada no inventário" },
  { id: 5, produto: "Overlock Lanmax LM-3800", tipo: "Entrada", qtd: 2, usuario: "Admin", data: "11/07/2026 09:30", obs: "Compra fornecedor Lanmax Sul" },
  { id: 6, produto: "Óleo Lubrificante Singer 100ml", tipo: "Ordem de Serviço", qtd: 2, usuario: "Sarah", data: "11/07/2026 14:00", obs: "Utilizado OS #102" },
];

const tipoColors: Record<string, string> = {
  Entrada: "bg-emerald-500/10 text-emerald-600 border-none",
  Venda: "bg-blue-500/10 text-blue-600 border-none",
  "Ajuste Manual": "bg-amber-500/10 text-amber-600 border-none",
  "Ordem de Serviço": "bg-purple-500/10 text-purple-600 border-none",
  Perda: "bg-destructive/10 text-destructive border-none",
};

export default function EstoquePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Controle de Estoque</h1>
        <p className="text-muted-foreground text-sm">Histórico de movimentações, inventário e alertas de reposição</p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Layers size={16} className="text-primary" /><span className="text-[10px] font-bold text-muted-foreground uppercase">Total SKUs</span></div>
          <p className="text-2xl font-extrabold">8</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle size={16} className="text-amber-500" /><span className="text-[10px] font-bold text-muted-foreground uppercase">Abaixo Mínimo</span></div>
          <p className="text-2xl font-extrabold text-amber-500">2</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><TrendingUp size={16} className="text-emerald-500" /><span className="text-[10px] font-bold text-muted-foreground uppercase">Entradas Mês</span></div>
          <p className="text-2xl font-extrabold text-emerald-600">102</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><TrendingDown size={16} className="text-destructive" /><span className="text-[10px] font-bold text-muted-foreground uppercase">Saídas Mês</span></div>
          <p className="text-2xl font-extrabold text-destructive">84</p>
        </Card>
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <History size={16} className="text-primary" /> Histórico de Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-bold text-muted-foreground uppercase">
                  <th className="px-4 py-3 text-left">Produto</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-right">Qtd</th>
                  <th className="px-4 py-3 text-left">Usuário</th>
                  <th className="px-4 py-3 text-left">Data/Hora</th>
                  <th className="px-4 py-3 text-left">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movimentacoes.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{m.produto}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className={`text-[10px] font-bold ${tipoColors[m.tipo]}`}>{m.tipo}</Badge></td>
                    <td className={`px-4 py-3 text-right font-bold text-sm ${m.qtd > 0 ? "text-emerald-600" : "text-destructive"}`}>{m.qtd > 0 ? `+${m.qtd}` : m.qtd}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{m.usuario}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{m.data}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{m.obs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
