"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const garantias = [
  { id: 1, cliente: "Maria da Silva", tipo: "Máquina", produto: "Singer Facilita Pro 4423", inicio: "10/07/2026", fim: "07/10/2026", dias: 87, status: "Ativa" },
  { id: 2, cliente: "José de Souza", tipo: "Serviço", produto: "OS #98 — Manutenção Overlock", inicio: "05/06/2026", fim: "05/07/2026", dias: -8, status: "Vencida" },
  { id: 3, cliente: "Ana Paula Ferreira", tipo: "Máquina", produto: "Lanmax LM-9980D", inicio: "15/04/2026", fim: "14/07/2026", dias: 1, status: "Ativa" },
  { id: 4, cliente: "Roberto Carvalho", tipo: "Máquina", produto: "Juki DDL-8700", inicio: "01/04/2026", fim: "01/07/2026", dias: -12, status: "Vencida" },
  { id: 5, cliente: "Fernanda Lima Santos", tipo: "Serviço", produto: "OS #95 — Regulagem Reta", inicio: "20/06/2026", fim: "20/07/2026", dias: 7, status: "Ativa" },
];

export default function GarantiasPage() {
  const ativas = garantias.filter(g => g.status === "Ativa").length;
  const vencidas = garantias.filter(g => g.status === "Vencida").length;
  const vencendoEm7dias = garantias.filter(g => g.status === "Ativa" && g.dias <= 7).length;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Controle de Garantias</h1>
        <p className="text-muted-foreground text-sm">Acompanhe todas as garantias de máquinas e serviços</p>
      </div>
      <div className="grid gap-4 grid-cols-3">
        <Card className="p-4 shadow-sm"><div className="flex items-center gap-2 mb-1"><Shield size={16} className="text-emerald-500" /><span className="text-[10px] font-bold text-muted-foreground uppercase">Ativas</span></div><p className="text-2xl font-extrabold text-emerald-600">{ativas}</p></Card>
        <Card className="p-4 shadow-sm"><div className="flex items-center gap-2 mb-1"><AlertTriangle size={16} className="text-amber-500" /><span className="text-[10px] font-bold text-muted-foreground uppercase">Vencendo em 7 dias</span></div><p className="text-2xl font-extrabold text-amber-500">{vencendoEm7dias}</p></Card>
        <Card className="p-4 shadow-sm"><div className="flex items-center gap-2 mb-1"><Clock size={16} className="text-muted-foreground" /><span className="text-[10px] font-bold text-muted-foreground uppercase">Vencidas</span></div><p className="text-2xl font-extrabold text-muted-foreground">{vencidas}</p></Card>
      </div>
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-3"><CardTitle className="text-base font-bold">Todas as Garantias</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b border-border bg-muted/30 text-xs font-bold text-muted-foreground uppercase"><th className="px-4 py-3 text-left">Cliente</th><th className="px-4 py-3 text-left">Produto / Serviço</th><th className="px-4 py-3 text-left">Tipo</th><th className="px-4 py-3 text-left">Início</th><th className="px-4 py-3 text-left">Fim</th><th className="px-4 py-3 text-right">Dias Rest.</th><th className="px-4 py-3 text-center">Status</th></tr></thead>
              <tbody className="divide-y divide-border">
                {garantias.map(g => (
                  <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold">{g.cliente}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{g.produto}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className={`text-[10px] font-bold border-none ${g.tipo === "Máquina" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"}`}>{g.tipo}</Badge></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{g.inicio}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{g.fim}</td>
                    <td className={`px-4 py-3 text-right font-bold text-sm ${g.dias <= 0 ? "text-destructive" : g.dias <= 7 ? "text-amber-500" : "text-emerald-600"}`}>{g.dias <= 0 ? "Vencida" : `${g.dias}d`}</td>
                    <td className="px-4 py-3 text-center"><Badge variant="outline" className={`text-[10px] font-bold border-none ${g.status === "Ativa" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>{g.status}</Badge></td>
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
