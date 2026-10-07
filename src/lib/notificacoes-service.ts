// src/lib/notificacoes-service.ts
// Serviço para criar notificações reais no Supabase

import { supabase } from "./supabase";

export type TipoNotificacao = "venda" | "estoque" | "os" | "garantia" | "sistema";

interface CriarNotificacaoParams {
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  usuario_id?: string | null; // id da tabela `usuarios`. Se não informado, notifica todos os Administradores.
}

/**
 * Cria uma notificação real no banco (tabela `notificacoes`).
 */
export async function criarNotificacao({
  tipo,
  titulo,
  mensagem,
  usuario_id,
}: CriarNotificacaoParams): Promise<boolean> {
  try {
    let destinatarios: string[] = [];

    if (usuario_id) {
      destinatarios = [usuario_id];
    } else {
      const { data: admins, error } = await supabase
        .from("usuarios")
        .select("id")
        .eq("perfil", "Administrador")
        .eq("ativo", true);

      if (error) {
        console.error("[notificacoes-service] erro ao buscar admins:", error.message);
        return false;
      }

      destinatarios = (admins || []).map((a) => a.id);
    }

    if (destinatarios.length === 0) {
      console.warn("[notificacoes-service] nenhum destinatário encontrado");
      return false;
    }

    const linhas = destinatarios.map((usuario_id) => ({
      usuario_id,
      tipo,
      titulo,
      mensagem,
      lida: false,
    }));

    const { error: erroInsert } = await supabase.from("notificacoes").insert(linhas);

    if (erroInsert) {
      console.error("[notificacoes-service] erro ao inserir:", erroInsert.message);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error("[notificacoes-service] erro inesperado:", error?.message);
    return false;
  }
}

export async function notificarVendaNova(nomeCliente: string, total: number, usuarioId?: string) {
  return criarNotificacao({
    tipo: "venda",
    titulo: "Nova Venda Realizada",
    mensagem: `${nomeCliente} - R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    usuario_id: usuarioId,
  });
}

export async function notificarEstoqueBaixo(nomeProduto: string, quantidade: number, minimo: number) {
  return criarNotificacao({
    tipo: "estoque",
    titulo: "Estoque Mínimo Atingido",
    mensagem: `${nomeProduto} está com ${quantidade} unidade(s) (mínimo: ${minimo}).`,
  });
}

export async function notificarOSCriada(numeroOS: string | number, nomeCliente: string) {
  return criarNotificacao({
    tipo: "os",
    titulo: "Nova Ordem de Serviço",
    mensagem: `OS #${numeroOS} aberta para ${nomeCliente}.`,
  });
}

export async function notificarGarantia(nomeProduto: string, dataVencimento: string) {
  return criarNotificacao({
    tipo: "garantia",
    titulo: "Garantia Vencendo",
    mensagem: `${nomeProduto} - vence em ${new Date(dataVencimento).toLocaleDateString("pt-BR")}.`,
  });
}

export async function notificarSistema(titulo: string, mensagem: string) {
  return criarNotificacao({ tipo: "sistema", titulo, mensagem });
}
