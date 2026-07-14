"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Store, Bell, Shield, HardDrive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-2xl font-bold tracking-tight">Configurações Gerais</h1>
        <p className="text-muted-foreground text-sm">Dados da empresa, parametrizações e saúde do sistema</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4"><CardTitle className="flex items-center gap-2 text-base"><Store size={16} className="text-primary" />Informações da Loja</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">Nome da Loja</label><Input defaultValue="West Máquinas" className="h-9" /></div>
          <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">CNPJ</label><Input defaultValue="12.345.678/0001-90" className="h-9" /></div>
          <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">WhatsApp</label><Input defaultValue="(21) 97235-8383" className="h-9" /></div>
          <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">E-mail</label><Input defaultValue="contato@westmaquinas.com.br" className="h-9" /></div>
          <div className="space-y-1.5 md:col-span-2"><label className="text-xs font-semibold text-muted-foreground">Endereço completo</label><Input defaultValue="Rua Rodolfo de Melo, Loja 10 – Santíssimo – Rio de Janeiro/RJ" className="h-9" /></div>
          <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">Instagram</label><Input defaultValue="@westmaquinas" className="h-9" /></div>
          <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">Facebook</label><Input defaultValue="facebook.com/westmaquinas" className="h-9" /></div>
          <div className="md:col-span-2"><Button className="font-semibold gap-2 text-sm shadow-sm"><Settings size={14} /> Salvar Configurações</Button></div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-4"><CardTitle className="flex items-center gap-2 text-base"><Shield size={16} className="text-primary" />Parametrizações Operacionais</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">Garantia Máquina (dias)</label><Input type="number" defaultValue={90} className="h-9" /></div>
          <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">Garantia Serviço (dias)</label><Input type="number" defaultValue={30} className="h-9" /></div>
          <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">Estoque Mínimo Padrão</label><Input type="number" defaultValue={5} className="h-9" /></div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-4"><CardTitle className="flex items-center gap-2 text-base"><HardDrive size={16} className="text-primary" />Saúde do Sistema</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="rounded-lg border border-border p-3"><p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Armazenamento</p><p className="font-bold text-sm">48 MB / 1 GB</p></div>
          <div className="rounded-lg border border-border p-3"><p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Sem Foto</p><p className="font-bold text-sm text-amber-500">3 produtos</p></div>
          <div className="rounded-lg border border-border p-3"><p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Sem Categoria</p><p className="font-bold text-sm text-emerald-600">0 produtos</p></div>
          <div className="rounded-lg border border-border p-3"><p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Versão ERP</p><p className="font-bold text-sm">v1.0.0</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
