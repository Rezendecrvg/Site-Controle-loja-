"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TesteImagensPage() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const testar = async () => {
      addLog("🔍 Testando imagens salvas no banco...\n");

      try {
        // Teste 1: Buscar fotos_produtos direto
        addLog("📸 Teste 1: Buscando tabela fotos_produtos...");
        const { data: fotos, error: erroFotos } = await supabase
          .from("fotos_produtos")
          .select("id, produto_id, url, principal")
          .limit(10);

        if (erroFotos) {
          addLog(`❌ Erro: ${erroFotos.message}`);
        } else {
          addLog(`✅ Total de fotos: ${fotos?.length ?? 0}\n`);
          if (fotos && fotos.length > 0) {
            fotos.forEach((f: any, idx: number) => {
              addLog(`\n📷 Foto ${idx + 1}:`);
              addLog(`   ID: ${f.id}`);
              addLog(`   Produto ID: ${f.produto_id}`);
              addLog(`   Principal: ${f.principal}`);
              addLog(`   URL salva: ${f.url}`);
              
              // Verificar se é URL válida
              if (f.url.startsWith("https://")) {
                addLog(`   ✅ URL válida (começa com https://)`);
              } else if (f.url.startsWith("http://")) {
                addLog(`   ✅ URL válida (começa com http://)`);
              } else if (f.url.includes(".jpg") || f.url.includes(".png")) {
                addLog(`   ❌ URL INVÁLIDA (é só nome de arquivo, não URL!)`);
              } else {
                addLog(`   ⚠️ URL desconhecida`);
              }
            });
          } else {
            addLog("⚠️ Nenhuma foto encontrada na tabela!");
          }
        }

        // Teste 2: Buscar produtos com fotos
        addLog("\n\n📦 Teste 2: Produtos com fotos...");
        const { data: produtos, error: erroProd } = await supabase
          .from("produtos")
          .select("id, nome, fotos_produtos(url)")
          .limit(5);

        if (erroProd) {
          addLog(`❌ Erro: ${erroProd.message}`);
        } else {
          addLog(`✅ Produtos: ${produtos?.length ?? 0}`);
          if (produtos && produtos.length > 0) {
            produtos.forEach((p: any) => {
              addLog(`\n📦 ${p.nome}`);
              if (p.fotos_produtos && p.fotos_produtos.length > 0) {
                addLog(`   ✅ Tem ${p.fotos_produtos.length} foto(s)`);
                p.fotos_produtos.forEach((f: any) => {
                  addLog(`      URL: ${f.url.substring(0, 80)}${f.url.length > 80 ? "..." : ""}`);
                });
              } else {
                addLog(`   ❌ Sem fotos`);
              }
            });
          }
        }

        // Teste 3: Verificar URL pública do Storage
        addLog("\n\n🔗 Teste 3: Gerando URL pública do Storage...");
        const { data: urlTeste } = supabase.storage
          .from("produtos")
          .getPublicUrl("teste_arquivo.jpg");

        addLog(`URL pública gerada: ${urlTeste.publicUrl}`);
        if (urlTeste.publicUrl.includes("https://")) {
          addLog("✅ URL está correta (começa com https://)");
        }

        addLog("\n✅ Testes concluídos!");
      } catch (error: any) {
        addLog(`❌ Erro geral: ${error?.message}`);
      }
    };

    testar();
  }, []);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">🖼️ Teste de Imagens</h1>

        <div className="bg-slate-800 rounded-lg p-6 font-mono text-sm text-slate-100 space-y-0 whitespace-pre-wrap leading-relaxed">
          {logs.length === 0 ? (
            <p className="text-slate-400">Carregando testes...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="text-slate-300">
                {log}
              </div>
            ))
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-900 rounded-lg text-blue-100 text-sm space-y-2">
          <p className="font-semibold">💡 O que procurar:</p>
          <ul className="space-y-1 ml-4">
            <li>✅ URL salva: <code className="bg-blue-800 px-1 rounded">https://zvoagmseo...</code></li>
            <li>❌ URL salva: <code className="bg-blue-800 px-1 rounded">produto_123_foto.jpg</code></li>
          </ul>
          <p className="mt-2 font-semibold">Se vir ❌, significa que a URL ainda está sendo salva errada!</p>
        </div>
      </div>
    </div>
  );
}
