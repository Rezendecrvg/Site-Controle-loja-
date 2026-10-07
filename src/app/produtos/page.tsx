"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  Edit2,
  Star,
  Loader2,
  Power,
  Trash2,
  Image as ImageIcon,
  Upload,
  AlertCircle,
  User2,
  Shield,
  Hash,
} from "lucide-react";

interface Categoria {
  id: string;
  nome: string;
}

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  categoria_id: string | null;
  marca: string | null;
  modelo: string | null;
  preco_custo: number;
  preco_venda: number;
  quantidade: number;
  estoque_minimo: number;
  ativo: boolean;
  em_promocao: boolean;
  destaque: boolean;
  exige_cliente: boolean;
  gera_garantia: boolean;
  exige_numero_serie: boolean;
  categorias?: { nome: string } | null;
  fotos_principais?: { url: string }[] | null;
}

interface Form {
  nome: string;
  descricao: string;
  categoria_id: string;
  marca: string;
  modelo: string;
  preco_custo: string;
  preco_venda: string;
  quantidade: string;
  estoque_minimo: string;
  ativo: boolean;
  em_promocao: boolean;
  destaque: boolean;
  exige_cliente: boolean;
  gera_garantia: boolean;
  exige_numero_serie: boolean;
}

const FORM_VAZIO: Form = {
  nome: "",
  descricao: "",
  categoria_id: "",
  marca: "",
  modelo: "",
  preco_custo: "0",
  preco_venda: "0",
  quantidade: "0",
  estoque_minimo: "0",
  ativo: true,
  em_promocao: false,
  destaque: false,
  exige_cliente: false,
  gera_garantia: false,
  exige_numero_serie: false,
};

// Nomes de categoria que, por padrão, já marcam as regras de máquina
const CATEGORIAS_MAQUINA = ["máquinas", "maquinas", "máquina", "maquina"];

export default function ProdutosPage() {
  const { user } = useAuth();
  const isAdmin = user?.perfil === "Administrador";

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [dialogAberto, setDialogAberto] = useState(false);
  const [produtoExcluir, setProdutoExcluir] = useState<Produto | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [produtoId, setProdutoId] = useState<string | null>(null);

  const [buscaProduto, setBuscaProduto] = useState("");
  const [buscaCategoria, setBuscaCategoria] = useState("");

  const [imagemSelecionada, setImagemSelecionada] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadandoImagem, setUploadandoImagem] = useState(false);

  const [form, setForm] = useState<Form>(FORM_VAZIO);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    const [{ data: prodData }, { data: catData }] = await Promise.all([
      supabase.from("produtos").select("*, categorias(nome), fotos_produtos(url)").order("nome"),
      supabase.from("categorias").select("*").order("nome"),
    ]);

    const produtosComAlias = (prodData ?? []).map(
      (p: Record<string, unknown> & { fotos_produtos?: { url: string }[] }) => ({
        ...p,
        fotos_principais: p.fotos_produtos,
      })
    );

    setProdutos(produtosComAlias as unknown as Produto[]);
    setCategorias((catData ?? []) as Categoria[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const abrirNovo = () => {
    setEditando(false);
    setProdutoId(null);
    setForm(FORM_VAZIO);
    setImagemSelecionada(null);
    setImagePreview("");
    setErro(null);
    setDialogAberto(true);
  };

  const abrirEdicao = (produto: Produto) => {
    setEditando(true);
    setProdutoId(produto.id);
    setForm({
      nome: produto.nome,
      descricao: produto.descricao || "",
      categoria_id: produto.categoria_id || "",
      marca: produto.marca || "",
      modelo: produto.modelo || "",
      preco_custo: produto.preco_custo.toString(),
      preco_venda: produto.preco_venda.toString(),
      quantidade: produto.quantidade.toString(),
      estoque_minimo: produto.estoque_minimo.toString(),
      ativo: produto.ativo,
      em_promocao: produto.em_promocao,
      destaque: produto.destaque,
      exige_cliente: Boolean(produto.exige_cliente),
      gera_garantia: Boolean(produto.gera_garantia),
      exige_numero_serie: Boolean(produto.exige_numero_serie),
    });

    setImagePreview(
      produto.fotos_principais && produto.fotos_principais.length > 0
        ? produto.fotos_principais[0].url
        : ""
    );
    setImagemSelecionada(null);
    setErro(null);
    setDialogAberto(true);
  };

  // Ao escolher a categoria, sugere as regras (o usuário pode desmarcar)
  const selecionarCategoria = (categoriaId: string) => {
    const categoria = categorias.find((c) => c.id === categoriaId);
    const nome = (categoria?.nome ?? "").toLowerCase();
    const ehMaquina = CATEGORIAS_MAQUINA.includes(nome);

    setForm((anterior) => ({
      ...anterior,
      categoria_id: categoriaId,
      exige_cliente: ehMaquina ? true : anterior.exige_cliente,
      gera_garantia: ehMaquina ? true : anterior.gera_garantia,
      exige_numero_serie: ehMaquina ? true : anterior.exige_numero_serie,
    }));
  };

  const handleImagemSelecionada = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (arquivo) {
      setImagemSelecionada(arquivo);
      const reader = new FileReader();
      reader.onload = (evento) => setImagePreview(evento.target?.result as string);
      reader.readAsDataURL(arquivo);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const sanitizarNomeArquivo = (nome: string): string =>
      nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9.]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");

    try {
      let imagemUrl = imagePreview;

      if (imagemSelecionada) {
        setUploadandoImagem(true);

        const timestamp = Date.now();
        const nomeArquivoSanitizado = sanitizarNomeArquivo(imagemSelecionada.name);
        const nomeArquivo = `produto_${produtoId || timestamp}_${nomeArquivoSanitizado}`;

        const { data: uploadData, error: uploadErro } = await supabase.storage
          .from("produtos")
          .upload(nomeArquivo, imagemSelecionada, { upsert: true });

        if (uploadErro) throw uploadErro;

        const supabaseUrl = "https://zvoagmseoahnaqynrkpd.supabase.co";
        const storagePath = `storage/v1/object/public/produtos/${uploadData.path}`;
        imagemUrl = `${supabaseUrl}/${storagePath}`;

        setUploadandoImagem(false);
      }

      // Campos comuns (sem preço — preço é tratado abaixo, conforme o perfil)
      const dadosBase = {
        nome: form.nome,
        descricao: form.descricao,
        categoria_id: form.categoria_id || null,
        marca: form.marca,
        modelo: form.modelo,
        quantidade: parseInt(form.quantidade || "0"),
        estoque_minimo: parseInt(form.estoque_minimo || "0"),
        ativo: form.ativo,
        em_promocao: form.em_promocao,
        destaque: form.destaque,
        exige_cliente: form.exige_cliente,
        gera_garantia: form.gera_garantia,
        exige_numero_serie: form.exige_numero_serie,
      };

      if (editando && produtoId) {
        // Vendedora não altera preços de produtos já cadastrados
        const dadosUpdate = isAdmin
          ? {
              ...dadosBase,
              preco_custo: parseFloat(form.preco_custo || "0"),
              preco_venda: parseFloat(form.preco_venda || "0"),
            }
          : dadosBase;

        const { error: updateError } = await supabase
          .from("produtos")
          .update(dadosUpdate)
          .eq("id", produtoId);

        if (updateError) throw updateError;

        if (imagemSelecionada) {
          await supabase
            .from("fotos_produtos")
            .delete()
            .eq("produto_id", produtoId)
            .eq("principal", true);

          await supabase.from("fotos_produtos").insert({
            produto_id: produtoId,
            url: imagemUrl,
            principal: true,
            ordem: 0,
          });
        }
      } else {
        // No cadastro de mercadoria nova a vendedora informa o preço de venda;
        // o preço de custo continua sendo informação de administrador.
        const { data: novoData, error: insertError } = await supabase
          .from("produtos")
          .insert({
            ...dadosBase,
            preco_custo: isAdmin ? parseFloat(form.preco_custo || "0") : 0,
            preco_venda: parseFloat(form.preco_venda || "0"),
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (novoData && imagemSelecionada) {
          await supabase.from("fotos_produtos").insert({
            produto_id: novoData.id,
            url: imagemUrl,
            principal: true,
            ordem: 0,
          });
        }
      }

      setDialogAberto(false);
      carregarDados();
    } catch (error) {
      setErro((error as Error).message);
    }

    setSalvando(false);
  };

  const alternarAtivo = async (produto: Produto) => {
    await supabase.from("produtos").update({ ativo: !produto.ativo }).eq("id", produto.id);
    carregarDados();
  };

  const abrirExclusao = (produto: Produto) => {
    setProdutoExcluir(produto);
    setErroExcluir(null);
  };

  const confirmarExclusao = async () => {
    if (!produtoExcluir) return;
    setExcluindo(true);
    setErroExcluir(null);

    const { error } = await supabase.from("produtos").delete().eq("id", produtoExcluir.id);

    setExcluindo(false);

    if (error) {
      // Restrição de chave estrangeira: produto já usado em alguma venda,
      // compra ou ordem de serviço. Não dá pra apagar sem perder o histórico.
      if (error.code === "23503") {
        setErroExcluir(
          `"${produtoExcluir.nome}" já tem venda, compra ou ordem de serviço vinculada e não pode ser excluído. Use "Desativar" para tirá-lo do PDV mantendo o histórico.`
        );
        return;
      }
      setErroExcluir("Erro ao excluir: " + error.message);
      return;
    }

    setProdutoExcluir(null);
    carregarDados();
  };

  const [abaStatus, setAbaStatus] = useState<"ativos" | "desativados" | "todos">("ativos");

  const produtosFiltrados = produtos.filter(
    (p) =>
      (p.nome.toLowerCase().includes(buscaProduto.toLowerCase()) ||
        p.marca?.toLowerCase().includes(buscaProduto.toLowerCase())) &&
      (!buscaCategoria || p.categorias?.nome === buscaCategoria) &&
      (abaStatus === "todos" || (abaStatus === "ativos" ? p.ativo : !p.ativo))
  );

  const totalAtivos = produtos.filter((p) => p.ativo).length;
  const totalDesativados = produtos.filter((p) => !p.ativo).length;

  const categoriasUnicas = categorias.map((c) => c.nome).filter(Boolean);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground text-sm">
            {produtos.length} produto(s) cadastrado(s)
          </p>
        </div>
        <Button onClick={abrirNovo} className="gap-2">
          <Plus size={16} /> Novo Produto
        </Button>
      </div>

      <div className="flex gap-1 p-1 rounded-xl border border-border bg-muted/40 w-fit">
        <button
          onClick={() => setAbaStatus("ativos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            abaStatus === "ativos"
              ? "bg-background text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-background/60"
          }`}
        >
          Ativos
          <Badge variant="outline" className="text-[10px] font-bold border-none bg-emerald-500/10 text-emerald-600">
            {totalAtivos}
          </Badge>
        </button>
        <button
          onClick={() => setAbaStatus("desativados")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            abaStatus === "desativados"
              ? "bg-background text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-background/60"
          }`}
        >
          Desativados
          <Badge variant="outline" className="text-[10px] font-bold border-none bg-muted text-muted-foreground">
            {totalDesativados}
          </Badge>
        </button>
        <button
          onClick={() => setAbaStatus("todos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            abaStatus === "todos"
              ? "bg-background text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-background/60"
          }`}
        >
          Todos
          <Badge variant="outline" className="text-[10px] font-bold border-none bg-primary/10 text-primary">
            {produtos.length}
          </Badge>
        </button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou marca..."
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Categoria
              </label>
              <select
                value={buscaCategoria}
                onChange={(e) => setBuscaCategoria(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Todas as categorias</option>
                {categoriasUnicas.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="animate-spin" size={18} /> Carregando produtos...
            </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Package size={28} className="opacity-40" />
              <p className="text-sm">
                {abaStatus === "desativados"
                  ? "Nenhum produto desativado."
                  : abaStatus === "ativos" && produtos.length > 0
                  ? "Nenhum produto ativo com esse filtro."
                  : "Nenhum produto cadastrado ainda."}
              </p>
              {produtos.length === 0 && (
                <Button size="sm" variant="outline" className="gap-1.5 mt-2" onClick={abrirNovo}>
                  <Plus size={14} /> Cadastrar o primeiro produto
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs font-bold text-muted-foreground uppercase">
                    <th className="px-4 py-3 text-left">Imagem</th>
                    <th className="px-4 py-3 text-left">Produto</th>
                    <th className="px-4 py-3 text-left">Categoria</th>
                    <th className="px-4 py-3 text-left">Regras de venda</th>
                    {isAdmin && <th className="px-4 py-3 text-right">Custo</th>}
                    <th className="px-4 py-3 text-right">Venda</th>
                    {isAdmin && <th className="px-4 py-3 text-right">Margem</th>}
                    <th className="px-4 py-3 text-right">Estoque</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {produtosFiltrados.map((p) => {
                    const margem =
                      p.preco_venda > 0
                        ? (((p.preco_venda - p.preco_custo) / p.preco_venda) * 100).toFixed(1)
                        : "0.0";
                    const estoqueBaixo = p.quantidade <= p.estoque_minimo;
                    const temImagem = p.fotos_principais && p.fotos_principais.length > 0;

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-muted/30 transition-colors ${
                          !p.ativo ? "opacity-50" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden">
                            {temImagem ? (
                              <img
                                src={p.fotos_principais![0].url}
                                alt={p.nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon size={20} className="text-muted-foreground" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {p.destaque && <Star size={12} className="text-amber-400 shrink-0" />}
                            <div>
                              <p className="font-semibold text-foreground">{p.nome}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {p.marca || "—"} {p.modelo ? `— ${p.modelo}` : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {p.categorias?.nome ?? "Sem categoria"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {p.exige_cliente && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 bg-blue-500/10 text-blue-600 border-none font-bold"
                              >
                                Cliente
                              </Badge>
                            )}
                            {p.gera_garantia && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 bg-emerald-500/10 text-emerald-600 border-none font-bold"
                              >
                                Garantia
                              </Badge>
                            )}
                            {p.exige_numero_serie && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 bg-purple-500/10 text-purple-600 border-none font-bold"
                              >
                                Nº série
                              </Badge>
                            )}
                            {!p.exige_cliente && !p.gera_garantia && !p.exige_numero_serie && (
                              <span className="text-[10px] text-muted-foreground">
                                Venda balcão
                              </span>
                            )}
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right font-medium text-muted-foreground">
                            R$ {p.preco_custo.toFixed(2).replace(".", ",")}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right font-bold">
                          R$ {p.preco_venda.toFixed(2).replace(".", ",")}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`text-xs font-bold ${
                                parseFloat(margem) > 30 ? "text-emerald-600" : "text-amber-600"
                              }`}
                            >
                              {margem}%
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {estoqueBaixo && <AlertTriangle size={12} className="text-amber-500" />}
                            <span
                              className={`font-bold text-sm ${
                                estoqueBaixo ? "text-destructive" : "text-foreground"
                              }`}
                            >
                              {p.quantidade}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              / mín {p.estoque_minimo}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {!p.ativo && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 bg-muted text-muted-foreground border-none font-bold"
                              >
                                Inativo
                              </Badge>
                            )}
                            {p.em_promocao && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 bg-emerald-500/10 text-emerald-600 border-none font-bold"
                              >
                                Promoção
                              </Badge>
                            )}
                            {p.destaque && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-600 border-none font-bold"
                              >
                                Destaque
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={() => abrirEdicao(p)}
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-7 w-7 ${
                                  p.ativo
                                    ? "text-muted-foreground hover:text-destructive"
                                    : "text-muted-foreground hover:text-emerald-600"
                                }`}
                                onClick={() => alternarAtivo(p)}
                                title={p.ativo ? "Desativar" : "Ativar"}
                              >
                                <Power size={14} />
                              </Button>
                            )}
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => abrirExclusao(p)}
                                title="Excluir"
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSalvar}>
            <DialogHeader>
              <DialogTitle>{editando ? "Editar Produto" : "Novo Produto"}</DialogTitle>
              <DialogDescription>
                Preencha os dados do produto. As regras de venda definem o comportamento no PDV.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Imagem */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Imagem Principal</label>
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={32} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="relative cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImagemSelecionada}
                        className="hidden"
                      />
                      <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border hover:bg-muted transition-colors">
                        <Upload size={16} />
                        <span className="text-sm font-medium">Escolher imagem</span>
                      </div>
                    </label>
                    <p className="text-xs text-muted-foreground">JPG, PNG ou GIF. Máx. 5MB</p>
                    {imagemSelecionada && (
                      <p className="text-xs text-emerald-600 font-medium">
                        ✓ {imagemSelecionada.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Nome *</label>
                <Input
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Máquina Reta Lanmax LM-9980D"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Marca</label>
                  <Input
                    value={form.marca}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Modelo</label>
                  <Input
                    value={form.modelo}
                    onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Categoria</label>
                <select
                  value={form.categoria_id}
                  onChange={(e) => selecionarCategoria(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Sem categoria</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* ---------------- REGRAS DE VENDA ---------------- */}
              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Regras de venda no PDV
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Máquina normalmente usa as três marcadas; armarinho e peças, nenhuma.
                  </p>
                </div>

                <label className="flex items-start gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.exige_cliente}
                    onChange={(e) => setForm({ ...form, exige_cliente: e.target.checked })}
                    className="rounded border-input mt-0.5"
                  />
                  <span className="flex items-center gap-1.5">
                    <User2 size={13} className="text-blue-600" />
                    <span>
                      <strong>Exige cliente</strong> — a venda só fecha com cliente identificado
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.gera_garantia}
                    onChange={(e) => setForm({ ...form, gera_garantia: e.target.checked })}
                    className="rounded border-input mt-0.5"
                  />
                  <span className="flex items-center gap-1.5">
                    <Shield size={13} className="text-emerald-600" />
                    <span>
                      <strong>Gera garantia</strong> — cria a garantia automaticamente na venda
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.exige_numero_serie}
                    onChange={(e) => setForm({ ...form, exige_numero_serie: e.target.checked })}
                    className="rounded border-input mt-0.5"
                  />
                  <span className="flex items-center gap-1.5">
                    <Hash size={13} className="text-purple-600" />
                    <span>
                      <strong>Exige número de série</strong> — vendido por unidade, com número
                    </span>
                  </span>
                </label>
              </div>

              {/* ---------------- PREÇOS ---------------- */}
              <div className="grid grid-cols-2 gap-3">
                {isAdmin && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Preço de custo (R$) *
                    </label>
                    <Input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.preco_custo}
                      onChange={(e) => setForm({ ...form, preco_custo: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Preço de venda (R$) *
                  </label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.preco_venda}
                    disabled={!isAdmin && editando}
                    onChange={(e) => setForm({ ...form, preco_venda: e.target.value })}
                  />
                  {!isAdmin && editando && (
                    <p className="text-[10px] text-muted-foreground">
                      Alteração de preço é feita pelo administrador.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Quantidade em estoque *
                  </label>
                  <Input
                    required
                    type="number"
                    min="0"
                    value={form.quantidade}
                    onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Estoque mínimo
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={form.estoque_minimo}
                    onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Descrição</label>
                <Input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                    className="rounded border-input"
                  />
                  Ativo
                </label>
                <label className="flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={form.em_promocao}
                    onChange={(e) => setForm({ ...form, em_promocao: e.target.checked })}
                    className="rounded border-input"
                  />
                  Em promoção
                </label>
                <label className="flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={form.destaque}
                    onChange={(e) => setForm({ ...form, destaque: e.target.checked })}
                    className="rounded border-input"
                  />
                  Destaque
                </label>
              </div>

              {erro && (
                <div className="flex items-center gap-2 rounded-md border border-red-900/30 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle size={14} className="shrink-0" /> {erro}
                </div>
              )}
            </div>

            <DialogFooter>
              <DialogClose>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={salvando || uploadandoImagem} className="gap-1.5">
                {(salvando || uploadandoImagem) && <Loader2 size={14} className="animate-spin" />}
                {editando ? "Salvar alterações" : "Cadastrar produto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: confirmar exclusão */}
      <Dialog
        open={produtoExcluir !== null}
        onOpenChange={(aberto) => !aberto && setProdutoExcluir(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Produto</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>{produtoExcluir?.nome}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          {erroExcluir && (
            <div className="flex items-center gap-2 rounded-md border border-red-900/30 bg-red-50 dark:bg-red-950/30 px-3 py-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle size={14} className="shrink-0" /> {erroExcluir}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setProdutoExcluir(null)} disabled={excluindo}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarExclusao}
              disabled={excluindo}
              className="gap-2"
            >
              {excluindo && <Loader2 size={14} className="animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
