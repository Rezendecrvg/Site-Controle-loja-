"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, Sparkles, Tag, Phone, Camera, MapPin, Clock, LogIn } from "lucide-react";

const produtosVitrine = [
  { id: 1, nome: "Máquina Reta Lanmax LM-9980D", marca: "Lanmax", categoria: "Máquinas", preco: 2300, precoOriginal: 2600, promocao: true, destaque: true, descricao: "Reta industrial Direct Drive, 9 pontos, velocidade até 5.500 RPM. Ideal para produção em escala.", parcelamento: "12x R$ 191,67" },
  { id: 2, nome: "Overlock Lanmax LM-3800", marca: "Lanmax", categoria: "Máquinas", preco: 1850, precoOriginal: null, promocao: false, destaque: true, descricao: "Overlock 3/4 fios, diferencial com corte automático. Perfeito para acabamentos profissionais.", parcelamento: "10x R$ 185,00" },
  { id: 3, nome: "Singer Facilita Pro 4423", marca: "Singer", categoria: "Máquinas", preco: 1050, precoOriginal: 1200, promocao: true, destaque: false, descricao: "Máquina doméstica robusta, 23 pontos, ideal para costuras pesadas, jeans e couro leve.", parcelamento: "10x R$ 105,00" },
  { id: 4, nome: "Bobina Industrial M1 (unidade)", marca: "Genérica", categoria: "Peças", preco: 20, precoOriginal: null, promocao: false, destaque: false, descricao: "Bobina de alta qualidade compatível com máquinas industriais reta e interlock.", parcelamento: null },
  { id: 5, nome: "Linha de Costura Premium 100m", marca: "Corrente", categoria: "Armarinho", preco: 15, precoOriginal: 18, promocao: true, destaque: false, descricao: "Linha poliéster de alta resistência, cores variadas, para costura industrial e doméstica.", parcelamento: null },
  { id: 6, nome: "Agulha Industrial Pct c/10 un.", marca: "Groz-Beckert", categoria: "Peças", preco: 12, precoOriginal: null, promocao: false, destaque: false, descricao: "Agulhas industriais referência 16x231, para máquinas de costura retas industriais.", parcelamento: null },
  { id: 7, nome: "Óleo Lubrificante Singer 100ml", marca: "Singer", categoria: "Peças", preco: 25, precoOriginal: null, promocao: false, destaque: false, descricao: "Óleo especial para máquinas de costura Singer e similares. Protege e lubrifica.", parcelamento: null },
  { id: 8, nome: "Elástico Chato 3cm (metro)", marca: "Corrente", categoria: "Armarinho", preco: 3.5, precoOriginal: null, promocao: false, destaque: false, descricao: "Elástico chato com 3cm de largura, alta durabilidade, vendido por metro.", parcelamento: null },
];

type Categoria = "Todos" | "Máquinas" | "Peças" | "Armarinho";

export default function Home() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Todos");

  const whatsappBase = "5521972358383";

  const produtosFiltrados = produtosVitrine.filter((p) => {
    const matchBusca =
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.marca.toLowerCase().includes(busca.toLowerCase());
    const matchCat = categoria === "Todos" || p.categoria === categoria;
    return matchBusca && matchCat;
  });

  const abrirWhatsApp = (produto: (typeof produtosVitrine)[0]) => {
    const mensagem = encodeURIComponent(
      `Olá! Tenho interesse no seguinte produto: *${produto.nome}* (${produto.marca}).\nPreço: R$ ${produto.preco.toFixed(2).replace(".", ",")}.\nGostaria de saber se ele ainda está disponível!`
    );
    window.open(`https://wa.me/${whatsappBase}?text=${mensagem}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER DA VITRINE */}
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-extrabold text-lg shadow-sm">W</div>
            <div>
              <p className="font-extrabold text-sm leading-none">West Máquinas</p>
              <p className="text-[10px] text-muted-foreground">Rio de Janeiro/RJ</p>
            </div>
          </div>
          <div className="relative flex-1 max-w-lg hidden sm:block">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar máquinas, peças, armarinho..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://wa.me/${whatsappBase}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#20b859] text-white px-3 py-2 text-xs font-bold shadow-sm transition-colors"
            >
              <MessageCircle size={14} /> Fale conosco
            </a>
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg border border-input hover:bg-muted text-foreground px-3 py-2 text-xs font-bold shadow-sm transition-colors bg-card"
            >
              <LogIn size={13} />
              <span>Entrar no Sistema</span>
            </Link>
          </div>
        </div>
      </header>

      {/* BANNER HERO */}
      <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white py-14 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary via-purple-500 to-transparent"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs mb-3">🎉 Promoções especiais de julho!</Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">
            West Máquinas<br />
            <span className="text-primary">Costura com qualidade</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto mb-6">
            Especializada na venda, troca, manutenção, revisão e avaliação de máquinas de costura domésticas e industriais no Rio de Janeiro/RJ.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={`https://wa.me/${whatsappBase}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#20b859] text-white px-6 py-3 text-sm font-bold shadow-md transition-colors">
              <MessageCircle size={16} /> Solicitar via WhatsApp
            </a>
            <button onClick={() => document.getElementById("produtos-section")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 px-6 py-3 text-sm font-bold transition-colors">
              Ver Catálogo Completo
            </button>
          </div>
        </div>
      </section>

      {/* FILTROS DE CATEGORIA */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-3 justify-center">
          {(["Todos", "Máquinas", "Peças", "Armarinho"] as Categoria[]).map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all ${
                categoria === c
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* PRODUTOS EM PROMOÇÃO */}
      {categoria === "Todos" && (
        <section className="max-w-7xl mx-auto px-4 pb-8">
          <div className="flex items-center gap-2 mb-4">
            <Tag size={18} className="text-primary" />
            <h2 className="text-lg font-bold">Produtos em Promoção</h2>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {produtosVitrine.filter(p => p.promocao).map(p => (
              <div key={p.id} className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/20 p-4 hover:shadow-md transition-shadow">
                <Badge className="bg-emerald-500 text-white text-[10px] font-bold mb-2">PROMOÇÃO</Badge>
                <p className="font-bold text-sm">{p.nome}</p>
                <div className="flex items-end gap-2 mt-1.5">
                  <span className="text-xl font-extrabold text-primary">R$ {p.preco.toFixed(2).replace(".", ",")}</span>
                  {p.precoOriginal && <span className="text-sm text-muted-foreground line-through">R$ {p.precoOriginal.toFixed(2).replace(".", ",")}</span>}
                </div>
                <button
                  onClick={() => abrirWhatsApp(p)}
                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#20b859] text-white py-2 text-xs font-bold transition-colors"
                >
                  <MessageCircle size={13} /> Solicitar pelo WhatsApp
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GRID PRINCIPAL DE PRODUTOS */}
      <section id="produtos-section" className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{produtosFiltrados.length} produto(s) encontrado(s)</h2>
          {busca && (
            <button onClick={() => setBusca("")} className="text-xs text-primary hover:underline font-semibold">Limpar busca</button>
          )}
        </div>
        {/* Busca mobile */}
        <div className="relative mb-4 sm:hidden">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar produto..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9 h-11" />
        </div>
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {produtosFiltrados.map((p) => (
            <div key={p.id} className="group rounded-xl border border-border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden">
              {/* Placeholder da imagem */}
              <div className="h-44 bg-gradient-to-br from-muted/80 to-muted flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background/60 text-muted-foreground">
                  <Search size={24} />
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    {p.destaque && <Sparkles size={12} className="text-amber-400 mb-0.5" />}
                    <p className="font-bold text-sm leading-snug">{p.nome}</p>
                    <p className="text-[11px] text-muted-foreground">{p.marca}</p>
                  </div>
                  {p.promocao && (
                    <Badge className="bg-emerald-500 text-white text-[9px] font-bold shrink-0">PROMO</Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{p.descricao}</p>
                <div>
                  <div className="flex items-end gap-1.5">
                    <span className="text-lg font-extrabold text-primary">R$ {p.preco.toFixed(2).replace(".", ",")}</span>
                    {p.precoOriginal && <span className="text-xs text-muted-foreground line-through">R$ {p.precoOriginal}</span>}
                  </div>
                  {p.parcelamento && <p className="text-[10px] text-muted-foreground">{p.parcelamento} sem juros</p>}
                </div>
                <button
                  onClick={() => abrirWhatsApp(p)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#20b859] text-white py-2.5 text-xs font-bold transition-colors shadow-sm mt-1"
                >
                  <MessageCircle size={14} /> Solicitar pelo WhatsApp
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="border-t border-border bg-muted/30 py-10 px-4">
        <div className="max-w-7xl mx-auto grid gap-6 grid-cols-1 md:grid-cols-3 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-extrabold text-sm">W</div>
              <p className="font-bold">West Máquinas</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Especialistas na venda, troca, manutenção, revisão e avaliação de máquinas de costura domésticas e industriais. Peças, acessórios e equipamentos de qualidade no Rio de Janeiro/RJ.
            </p>
          </div>
          <div>
            <p className="font-bold mb-3">Informações</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><MapPin size={13} /> Rua Rodolfo de Melo, Loja 10 – Santíssimo – Rio de Janeiro/RJ</div>
              <div className="flex items-center gap-2"><Phone size={13} /> (21) 97235-8383 / (21) 3404-3121</div>
              <div className="flex items-center gap-2"><Clock size={13} /> Seg–Sex: 08h–18h | Sáb e Dom: Fechado</div>
            </div>
          </div>
          <div>
            <p className="font-bold mb-3">Redes Sociais</p>
            <div className="flex gap-3">
              <a href="#" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"><Camera size={14} /> @westmaquinas</a>
            </div>
            <a href={`https://wa.me/${whatsappBase}`} target="_blank" rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#20b859] text-white py-2.5 text-xs font-bold transition-colors">
              <MessageCircle size={14} /> Chamar no WhatsApp
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-border text-center text-[11px] text-muted-foreground">
          © 2026 West Máquinas — Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
