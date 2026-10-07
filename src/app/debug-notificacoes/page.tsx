"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { notificarVendaNova } from "@/lib/notificacoes-service";

interface Resultado {
  etapa: string;
  ok: boolean;
  detalhe: string;
}

export default function DebugNotificacoes() {
  const { user } = useAuth();
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [rodando, setRodando] = useState(false);

  const addResultado = (r: Resultado) => setResultados((prev) => [...prev, r]);

  const rodarDiagnostico = async () => {
    setResultados([]);
    setRodando(true);

    // 0. Sessão de autenticação do Supabase (auth.users)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    addResultado({
      etapa: "0. Sessão Supabase Auth",
      ok: !!sessionData.session && !sessionError,
      detalhe: sessionData.session
        ? `Logado. auth.uid = ${sessionData.session.user.id}`
        : `Sem sessão ativa. Erro: ${sessionError?.message ?? "nenhuma sessão"}`,
    });

    // 1. Contexto do usuário (tabela usuarios)
    addResultado({
      etapa: "1. useAuth() - usuário carregado",
      ok: !!user,
      detalhe: user
        ? `id=${user.id} | nome=${user.nome} | perfil=${user.perfil} | ativo=${user.ativo}`
        : "user está NULL no contexto - AuthProvider não carregou o perfil",
    });

    if (!user) {
      setRodando(false);
      return;
    }

    // 2. Buscar admins ativos (o que notificarVendaNova faz internamente)
    const { data: admins, error: erroAdmins } = await supabase
      .from("usuarios")
      .select("id, nome, perfil, ativo")
      .eq("perfil", "Administrador")
      .eq("ativo", true);

    addResultado({
      etapa: "2. Buscar Administradores ativos",
      ok: !erroAdmins && !!admins && admins.length > 0,
      detalhe: erroAdmins
        ? `ERRO: ${erroAdmins.message}`
        : `Encontrados: ${admins?.length ?? 0} -> ${JSON.stringify(admins)}`,
    });

    // 3. Tentar INSERT direto na tabela notificacoes (sem passar pelo service)
    const { data: insertData, error: erroInsert } = await supabase
      .from("notificacoes")
      .insert({
        usuario_id: user.id,
        tipo: "sistema",
        titulo: "Teste Debug Direto",
        mensagem: "Insert direto via debug-notificacoes",
        lida: false,
      })
      .select();

    addResultado({
      etapa: "3. INSERT direto na tabela notificacoes",
      ok: !erroInsert,
      detalhe: erroInsert
        ? `ERRO: [${erroInsert.code}] ${erroInsert.message} | details: ${erroInsert.details} | hint: ${erroInsert.hint}`
        : `Inserido com sucesso: ${JSON.stringify(insertData)}`,
    });

    // 4. Chamar a função real notificarVendaNova (a mesma usada no Ponto de Venda)
    const resultadoServico = await notificarVendaNova("Cliente Debug", 999.99, user.id);
    addResultado({
      etapa: "4. notificarVendaNova() (função real usada na venda)",
      ok: resultadoServico,
      detalhe: `Retornou: ${resultadoServico}`,
    });

    // 5. SELECT de volta pra ver se está lá e se o header conseguiria ler
    const { data: leitura, error: erroLeitura } = await supabase
      .from("notificacoes")
      .select("id, tipo, titulo, mensagem, lida, criada_em, usuario_id")
      .eq("usuario_id", user.id)
      .order("criada_em", { ascending: false })
      .limit(5);

    addResultado({
      etapa: "5. SELECT das notificações do usuário (igual o header faz)",
      ok: !erroLeitura && !!leitura && leitura.length > 0,
      detalhe: erroLeitura
        ? `ERRO: ${erroLeitura.message}`
        : `Total encontrado: ${leitura?.length ?? 0} -> ${JSON.stringify(leitura, null, 2)}`,
    });

    setRodando(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🔬 Diagnóstico Completo de Notificações</h1>
        <p className="text-muted-foreground text-sm">
          Testa cada etapa isoladamente e mostra o erro exato, se houver.
        </p>
      </div>

      <button
        onClick={rodarDiagnostico}
        disabled={rodando}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg"
      >
        {rodando ? "Rodando..." : "▶ Rodar Diagnóstico Completo"}
      </button>

      <div className="space-y-3">
        {resultados.map((r, i) => (
          <div
            key={i}
            className={`p-4 rounded-lg border-l-4 text-sm ${
              r.ok
                ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                : "bg-red-50 border-red-500 text-red-900"
            }`}
          >
            <p className="font-bold">
              {r.ok ? "✅" : "❌"} {r.etapa}
            </p>
            <pre className="whitespace-pre-wrap break-words mt-1 text-xs font-mono">
              {r.detalhe}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
