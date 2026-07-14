"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Users,
  Phone,
  Eye,
  Edit2,
  ShoppingBag,
  Wrench,
  Shield,
} from "lucide-react";

const clientesMock = [
  { id: 1, nome: "Maria da Silva", telefone: "(21) 99999-1111", whatsapp: "(21) 99999-1111", cidade: "Rio de Janeiro", compras: 5, gastoTotal: 4850.0, ultimaCompra: "10/07/2026", garantiasAtivas: 2 },
  { id: 2, nome: "José de Souza", telefone: "(21) 98888-2222", whatsapp: "(21) 98888-2222", cidade: "Niterói", compras: 2, gastoTotal: 1200.0, ultimaCompra: "05/07/2026", garantiasAtivas: 1 },
  { id: 3, nome: "Ana Paula Ferreira", telefone: "(21) 97777-3333", whatsapp: "(21) 97777-3333", cidade: "Duque de Caxias", compras: 8, gastoTotal: 9200.0, ultimaCompra: "12/07/2026", garantiasAtivas: 3 },
  { id: 4, nome: "Pedro Alves Costa", telefone: "(21) 96666-4444", whatsapp: "(21) 96666-4444", cidade: "Rio de Janeiro", compras: 1, gastoTotal: 350.0, ultimaCompra: "01/06/2026", garantiasAtivas: 0 },
  { id: 5, nome: "Fernanda Lima Santos", telefone: "(21) 95555-5555", whatsapp: "(21) 95555-5555", cidade: "Nova Iguaçu", compras: 3, gastoTotal: 2850.0, ultimaCompra: "08/07/2026", garantiasAtivas: 1 },
  { id: 6, nome: "Roberto Carvalho", telefone: "(21) 94444-6666", whatsapp: "(21) 94444-6666", cidade: "São Gonçalo", compras: 12, gastoTotal: 15400.0, ultimaCompra: "13/07/2026", garantiasAtivas: 4 },
];

export default function ClientesPage() {
  const [busca, setBusca] = useState("");

  const clientesFiltrados = clientesMock.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.telefone.includes(busca) ||
      c.cidade.toLowerCase().includes(busca.toLowerCase())
  );

  const totalClientes = clientesMock.length;
  const totalGasto = clientesMock.reduce((a, c) => a + c.gastoTotal, 0);
  const comGarantia = clientesMock.filter((c) => c.garantiasAtivas > 0).length;
  const inativos = clientesMock.filter((c) => c.ultimaCompra < "01/06/2026").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Clientes</h1>
          <p className="text-muted-foreground text-sm">Cadastro, histórico e garantias dos clientes</p>
        </div>
        <Button className="gap-2 font-semibold shadow-sm">
          <Plus size={16} /> Novo Cliente
        </Button>
      </div>

      {/* Cards resumo */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Clientes</span>
          </div>
          <p className="text-2xl font-extrabold">{totalClientes}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag size={16} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Compras</span>
          </div>
          <p className="text-lg font-extrabold text-emerald-600">
            R$ {totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-indigo-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Com Garantia</span>
          </div>
          <p className="text-2xl font-extrabold text-indigo-600">{comGarantia}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-amber-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Inativos &gt;30d</span>
          </div>
          <p className="text-2xl font-extrabold text-amber-500">{inativos}</p>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone ou cidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9 h-11 text-sm"
        />
      </div>

      {/* Tabela de Clientes */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">{clientesFiltrados.length} cliente(s)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-bold text-muted-foreground uppercase">
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Contato</th>
                  <th className="px-4 py-3 text-left">Cidade</th>
                  <th className="px-4 py-3 text-right">Compras</th>
                  <th className="px-4 py-3 text-right">Total Gasto</th>
                  <th className="px-4 py-3 text-left">Última Compra</th>
                  <th className="px-4 py-3 text-center">Garantias</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clientesFiltrados.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                          {c.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{c.nome}</p>
                          <p className="text-[11px] text-muted-foreground">{c.compras} compra(s)</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <Phone size={12} /> {c.telefone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{c.cidade}</td>
                    <td className="px-4 py-3 text-right font-semibold">{c.compras}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">
                      R$ {c.gastoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{c.ultimaCompra}</td>
                    <td className="px-4 py-3 text-center">
                      {c.garantiasAtivas > 0 ? (
                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-none text-[10px] font-bold">
                          {c.garantiasAtivas} ativa(s)
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Nenhuma</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Ver perfil">
                          <Eye size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" title="Editar">
                          <Edit2 size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-blue-500" title="Ver OS">
                          <Wrench size={14} />
                        </Button>
                      </div>
                    </td>
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
