"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit2,
  Timer,
} from "lucide-react";

type StatusOS =
  | "Recebida"
  | "Em análise"
  | "Aguardando aprovação"
  | "Aguardando peças"
  | "Em manutenção"
  | "Teste"
  | "Pronta para retirada"
  | "Entregue"
  | "Cancelada";

const statusColors: Record<StatusOS, string> = {
  Recebida: "bg-slate-500/10 text-slate-600 border-none",
  "Em análise": "bg-blue-500/10 text-blue-600 border-none",
  "Aguardando aprovação": "bg-amber-500/10 text-amber-600 border-none",
  "Aguardando peças": "bg-orange-500/10 text-orange-600 border-none",
  "Em manutenção": "bg-indigo-500/10 text-indigo-600 border-none",
  Teste: "bg-purple-500/10 text-purple-600 border-none",
  "Pronta para retirada": "bg-emerald-500/10 text-emerald-600 border-none",
  Entregue: "bg-slate-200 text-slate-500 border-none",
  Cancelada: "bg-destructive/10 text-destructive border-none",
};

const osMock = [
  { id: 101, cliente: "Maria da Silva", marca: "Singer", modelo: "Facilita Pro 4423", defeito: "Não faz ponto, pula pontos", status: "Pronta para retirada" as StatusOS, entrada: "08/07/2026", previsao: "12/07/2026", total: 180.0, diasAberta: 5 },
  { id: 102, cliente: "José de Souza", marca: "Lanmax", modelo: "LM-9980D Reta", defeito: "Barulho no motor, travamento", status: "Em manutenção" as StatusOS, entrada: "10/07/2026", previsao: "15/07/2026", total: 350.0, diasAberta: 3 },
  { id: 103, cliente: "Ana Paula Ferreira", marca: "Singer", modelo: "Promise 1512", defeito: "Quebrando linha constantemente", status: "Aguardando peças" as StatusOS, entrada: "05/07/2026", previsao: "14/07/2026", total: 0, diasAberta: 8 },
  { id: 104, cliente: "Pedro Alves Costa", marca: "Lanmax", modelo: "LM-3800 Overlock", defeito: "Tensão irregular, regulagem de looper", status: "Pronta para retirada" as StatusOS, entrada: "09/07/2026", previsao: "13/07/2026", total: 220.0, diasAberta: 4 },
  { id: 105, cliente: "Fernanda Lima Santos", marca: "Brother", modelo: "CS6000i", defeito: "Display apagado, problema elétrico", status: "Em análise" as StatusOS, entrada: "12/07/2026", previsao: "16/07/2026", total: 0, diasAberta: 1 },
  { id: 106, cliente: "Roberto Carvalho", marca: "Juki", modelo: "DDL-8700", defeito: "Manutenção preventiva completa", status: "Entregue" as StatusOS, entrada: "01/07/2026", previsao: "07/07/2026", total: 450.0, diasAberta: 0 },
];

export default function OSPage() {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusOS | "todos">("todos");

  const osFiltradas = osMock.filter((os) => {
    const matchBusca =
      os.cliente.toLowerCase().includes(busca.toLowerCase()) ||
      os.marca.toLowerCase().includes(busca.toLowerCase()) ||
      String(os.id).includes(busca);
    const matchStatus = filtroStatus === "todos" || os.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const abertas = osMock.filter((os) => os.status !== "Entregue" && os.status !== "Cancelada").length;
  const prontas = osMock.filter((os) => os.status === "Pronta para retirada").length;
  const emManutencao = osMock.filter((os) => os.status === "Em manutenção" || os.status === "Aguardando peças").length;
  const entregues = osMock.filter((os) => os.status === "Entregue").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ordens de Serviço</h1>
          <p className="text-muted-foreground text-sm">Assistência técnica e acompanhamento de manutenções</p>
        </div>
        <Button className="gap-2 font-semibold shadow-sm">
          <Plus size={16} /> Nova Ordem de Serviço
        </Button>
      </div>

      {/* Cards de Status */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Wrench size={16} className="text-indigo-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">OS Abertas</span>
          </div>
          <p className="text-2xl font-extrabold text-indigo-600">{abertas}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Prontas p/ Retirada</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{prontas}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Timer size={16} className="text-amber-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Em Manutenção</span>
          </div>
          <p className="text-2xl font-extrabold text-amber-500">{emManutencao}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-slate-400" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Entregues Hoje</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-500">{entregues}</p>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nº OS, cliente, marca ou modelo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["todos", "Pronta para retirada", "Em manutenção", "Aguardando peças", "Em análise"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFiltroStatus(s as StatusOS | "todos")}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                    filtroStatus === s
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s === "todos" ? "Todas" : s}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de OS em Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {osFiltradas.map((os) => (
          <Card
            key={os.id}
            className={`shadow-sm border-border hover:shadow-md transition-shadow ${
              os.status === "Pronta para retirada" ? "ring-1 ring-emerald-500/30" : ""
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-primary text-sm">OS #{os.id}</span>
                    {os.diasAberta > 7 && (
                      <AlertTriangle size={12} className="text-amber-500" title="OS com mais de 7 dias" />
                    )}
                  </div>
                  <p className="font-semibold text-sm text-foreground mt-0.5">{os.cliente}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] font-bold shrink-0 ${statusColors[os.status]}`}>
                  {os.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Wrench size={14} className="text-muted-foreground shrink-0" />
                <span className="font-semibold">{os.marca} {os.modelo}</span>
              </div>
              <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">
                "{os.defeito}"
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="text-[11px]">
                  <p className="text-muted-foreground">Entrada</p>
                  <p className="font-semibold">{os.entrada}</p>
                </div>
                <div className="text-[11px]">
                  <p className="text-muted-foreground">Previsão</p>
                  <p className="font-semibold">{os.previsao}</p>
                </div>
              </div>
              {os.total > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-xs text-muted-foreground font-semibold">Total da OS</span>
                  <span className="text-sm font-extrabold text-primary">
                    R$ {os.total.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button variant="secondary" size="sm" className="flex-1 h-8 text-xs gap-1.5">
                  <Eye size={12} /> Ver Detalhes
                </Button>
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1.5">
                  <Edit2 size={12} /> Atualizar Status
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
