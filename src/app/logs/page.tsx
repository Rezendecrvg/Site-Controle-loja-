"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

const logs = [
  { id: 1, usuario: "Admin", acao: "Fechamento de Caixa", detalhes: "Saldo R$ 2.350,00 — Sem divergência", data: "13/07/2026 18:30" },
  { id: 2, usuario: "Sarah", acao: "Registro de Venda", detalhes: "Venda #021 — R$ 45,00 — Pix", data: "13/07/2026 11:05" },
  { id: 3, usuario: "Admin", acao: "Alteração de Preço", detalhes: "Produto: Lanmax LM-9980D — R$ 2.200 → R$ 2.300", data: "12/07/2026 16:45" },
  { id: 4, usuario: "Sarah", acao: "Abertura de OS", detalhes: "OS #105 — Fernanda Lima — Brother CS6000i", data: "12/07/2026 09:00" },
  { id: 5, usuario: "Admin", acao: "Ajuste de Estoque", detalhes: "Singer Facilita -1 un. — Motivo: Quebra no inventário", data: "12/07/2026 08:30" },
  { id: 6, usuario: "Sarah", acao: "Cadastro de Cliente", detalhes: "Novo cliente: Fernanda Lima Santos", data: "11/07/2026 14:30" },
  { id: 7, usuario: "Admin", acao: "Entrada de Estoque", detalhes: "Bobina Industrial M1 +100 un. — Fornecedor Lanmax Sul", data: "11/07/2026 09:30" },
];

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Logs de Auditoria</h1>
        <p className="text-muted-foreground text-sm">Registro completo de todas as ações realizadas no sistema</p>
      </div>
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-3"><CardTitle className="text-base font-bold flex items-center gap-2"><History size={16} className="text-primary" />{logs.length} registros de auditoria</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b border-border bg-muted/30 text-xs font-bold text-muted-foreground uppercase"><th className="px-4 py-3 text-left">Data/Hora</th><th className="px-4 py-3 text-left">Usuário</th><th className="px-4 py-3 text-left">Ação</th><th className="px-4 py-3 text-left">Detalhes</th></tr></thead>
              <tbody className="divide-y divide-border">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{l.data}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] font-bold border-none ${l.usuario === "Admin" ? "bg-primary/10 text-primary" : "bg-purple-500/10 text-purple-600"}`}>{l.usuario}</Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-sm">{l.acao}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{l.detalhes}</td>
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
