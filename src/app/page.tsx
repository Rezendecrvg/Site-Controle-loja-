"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, Sparkles, Tag, Phone, Camera, MapPin, Clock, LogIn, Loader2, AlertCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Produto {
  id: string;
  nome: string;
  preco_venda: number;
  preco_custo?: number;
  quantidade: number;
  destaque: boolean;
  em_promocao: boolean;
  descricao?: string;
  categorias?: { nome: string } | null;
}

interface ProdutoExibicao {
  id: string;
  nome: string;
  marca: string;
  categoria: string;
  preco: number;
  precoOriginal?: number;
  promocao: boolean;
  destaque: boolean;
  descricao: string;
  quantidade: number;
  imagem?: string;
}

type Categoria = "Todos" | "Máquinas" | "Peças";

export default function Home() {
  const [produtos, setProdutos] = useState<ProdutoExibicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Todos");
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoExibicao | null>(null);

  const whatsappBase = "5521972358383";

  const carregarProdutos = useCallback(async () => {
    setLoading(true);
    setErro(null);

    try {
      // Buscar produtos ativos do banco
      const { data, error } = await supabase
        .from("produtos")
        .select("id, nome, marca, descricao, preco_venda, preco_custo, quantidade, em_promocao, destaque, categorias(nome), fotos_produtos(*)")
        .eq("ativo", true)
        .order("destaque", { ascending: false })
        .order("nome");

      if (error) {
        setErro("Erro ao carregar produtos: " + error.message);
        setLoading(false);
        return;
      }

      // Transformar dados para formato de exibição
      // (a categoria "Armarinho" não aparece na vitrine pública — venda de balcão)
      const produtosFormatados = (data ?? [])
        .filter((p: any) => (p.categorias?.nome ?? "").toLowerCase() !== "armarinho")
        .map((p: any) => {
        const temFoto = p.fotos_produtos && Array.isArray(p.fotos_produtos) && p.fotos_produtos.length > 0;
        const imagemUrl = temFoto ? p.fotos_produtos[0].url : undefined;
        
        console.log(`Produto: ${p.nome}`, {
          temFoto,
          imagemUrl,
          fotos: p.fotos_produtos
        });
        
        return {
          id: p.id,
          nome: p.nome,
          marca: p.marca || "West Máquinas",
          categoria: p.categorias?.nome || "Outros",
          preco: Number(p.preco_venda),
          precoOriginal: p.preco_custo ? Number(p.preco_custo) * 1.3 : undefined,
          promocao: p.em_promocao,
          destaque: p.destaque,
          descricao: p.descricao || "Produto de qualidade superior",
          quantidade: p.quantidade,
          imagem: imagemUrl,
        };
      });

      setProdutos(produtosFormatados);
    } catch (error: any) {
      setErro("Erro ao carregar produtos: " + (error?.message ?? "Erro desconhecido"));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      const matchBusca =
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.marca.toLowerCase().includes(busca.toLowerCase());
      const matchCat = categoria === "Todos" || p.categoria === categoria;
      return matchBusca && matchCat && p.quantidade > 0; // Só mostra produtos com estoque
    });
  }, [produtos, busca, categoria]);

  const abrirWhatsApp = (produto: ProdutoExibicao) => {
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
          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs mb-3">🎉 Produtos em destaque!</Badge>
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
            <Button variant="outline" className="text-white border-white hover:bg-white/10">
              ↓ Veja nossos produtos
            </Button>
          </div>
        </div>
      </section>

      {/* FILTROS E BUSCA */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-4">
          <div className="relative sm:hidden">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(["Todos", "Máquinas", "Peças"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoria(cat)}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all whitespace-nowrap shrink-0 ${
                  categoria === cat
                    ? "bg-primary text-white shadow-md"
                    : "bg-card border border-border text-foreground hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* MENSAGEM DE ERRO */}
      {erro && (
        <section className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <AlertCircle className="text-destructive shrink-0" size={20} />
            <p className="text-sm text-destructive">{erro}</p>
          </div>
        </section>
      )}

      {/* LOADING */}
      {loading && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
            <p>Carregando produtos...</p>
          </div>
        </section>
      )}

      {/* GRID DE PRODUTOS */}
      {!loading && (
        <section className="max-w-7xl mx-auto px-4 pb-16">
          {produtosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-semibold mb-2">Nenhum produto encontrado</p>
              <p className="text-sm">Tente buscar por outro nome ou categoria</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {produtosFiltrados.map((produto) => (
                <div
                  key={produto.id}
                  onClick={() => setProdutoSelecionado(produto)}
                  className="group rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 bg-card cursor-pointer"
                >
                  {/* Card Header com badges */}
                  <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 h-40 flex items-center justify-center overflow-hidden">
                    {produto.imagem ? (
                      <img 
                        src={produto.imagem} 
                        alt={produto.nome}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          console.error("Erro ao carregar imagem:", produto.imagem);
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="text-slate-400 text-sm font-medium">Sem imagem</div>
                    )}
                    {produto.destaque && (
                      <Badge className="absolute top-2 right-2 bg-amber-400 text-black gap-1">
                        <Sparkles size={12} /> Destaque
                      </Badge>
                    )}
                    {produto.promocao && (
                      <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                        🎯 Promoção
                      </Badge>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {produto.nome}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{produto.marca}</p>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">{produto.descricao}</p>

                    {/* Preço */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-extrabold text-primary">
                        R$ {produto.preco.toFixed(2).replace(".", ",")}
                      </span>
                      {produto.precoOriginal && produto.promocao && (
                        <span className="text-xs text-muted-foreground line-through">
                          R$ {produto.precoOriginal.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>

                    {/* Categoria Badge */}
                    <Badge variant="outline" className="text-[10px]">
                      {produto.categoria}
                    </Badge>

                    {/* Botão */}
                    <button
                      onClick={() => abrirWhatsApp(produto)}
                      className="w-full rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold py-2 text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={14} /> Informações
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* MODAL DE PRODUTO */}
      <Dialog open={!!produtoSelecionado} onOpenChange={(open) => !open && setProdutoSelecionado(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {produtoSelecionado && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{produtoSelecionado.nome}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Imagem */}
                {produtoSelecionado.imagem && (
                  <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-lg overflow-hidden flex items-center justify-center min-h-80">
                    <img
                      src={produtoSelecionado.imagem}
                      alt={produtoSelecionado.nome}
                      className="w-full h-full object-cover max-h-80"
                    />
                  </div>
                )}

                {/* Informações */}
                <div className="space-y-4">
                  {/* Marca */}
                  <div>
                    <p className="text-sm text-muted-foreground">Marca</p>
                    <p className="text-lg font-semibold">{produtoSelecionado.marca}</p>
                  </div>

                  {/* Categoria */}
                  <div>
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <Badge className="mt-1">{produtoSelecionado.categoria}</Badge>
                  </div>

                  {/* Descrição */}
                  <div>
                    <p className="text-sm text-muted-foreground">Descrição</p>
                    <p className="text-base">{produtoSelecionado.descricao}</p>
                  </div>

                  {/* Preço */}
                  <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">Preço</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-extrabold text-primary">
                        R$ {produtoSelecionado.preco.toFixed(2).replace(".", ",")}
                      </span>
                      {produtoSelecionado.precoOriginal && produtoSelecionado.promocao && (
                        <span className="text-sm text-muted-foreground line-through">
                          R$ {produtoSelecionado.precoOriginal.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Estoque */}
                  <div>
                    <p className="text-sm text-muted-foreground">Disponibilidade</p>
                    <p className={`text-base font-semibold ${produtoSelecionado.quantidade > 0 ? "text-green-600" : "text-red-600"}`}>
                      {produtoSelecionado.quantidade > 0 ? `${produtoSelecionado.quantidade} em estoque` : "Fora de estoque"}
                    </p>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        abrirWhatsApp(produtoSelecionado);
                        setProdutoSelecionado(null);
                      }}
                      className="flex-1 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold py-3 transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={18} /> Solicitar via WhatsApp
                    </button>
                    <button
                      onClick={() => setProdutoSelecionado(null)}
                      className="px-6 rounded-lg border border-border hover:bg-muted font-semibold py-3 transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* FOOTER */}
      <footer className="bg-card border-t border-border py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 West Máquinas. Todos os direitos reservados.</p>
          <p className="mt-2">Contato: <a href={`https://wa.me/${whatsappBase}`} className="text-primary hover:underline font-semibold">{whatsappBase.replace(/^55/, "")}</a></p>
        </div>
      </footer>
    </div>
  );
}
