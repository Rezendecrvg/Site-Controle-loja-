"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TesteVitrine() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const testar = async () => {
      addLog("🔌 Iniciando testes de conexão...");

      try {
        addLog("📦 Buscando categorias...");
        const { data: categorias, error: erroCateg } = await supabase
          .from("categorias")
          .select("id, nome");
        
        if (erroCateg) {
          addLog(`❌ Erro ao buscar categorias: ${erroCateg.message}`);
        } else {
          addLog(`✅ Categorias encontradas: ${categorias?.length ?? 0}`);
          categorias?.forEach((c: any) => {
            addLog(`   - ${c.nome} (id: ${c.id})`);
          });
        }

        addLog("🛍️ Buscando produtos ativos...");
        const { data: produtos, error: erroProd } = await supabase
          .from("produtos")
          .select("id, nome, quantidade, categoria_id, categorias(nome)")
          .eq("ativo", true)
          .limit(20);
        
        if (erroProd) {
          addLog(`❌ Erro ao buscar produtos: ${erroProd.message}`);
        } else {
          addLog(`✅ Produtos encontrados: ${produtos?.length ?? 0}`);
          produtos?.forEach((p: any) => {
            addLog(`   - ${p.nome} (${p.quantidade} un) - Categoria: ${p.categorias?.nome ?? "Sem categoria"}`);
          });
        }

        addLog("✅ Conexão com Supabase funcionando!");
      } catch (error: any) {
        addLog(`❌ Erro geral: ${error?.message ?? JSON.stringify(error)}`);
      }
    };

    testar();
  }, []);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">🧪 Teste de Conexão - Vitrine</h1>
        
        <div className="bg-slate-800 rounded-lg p-6 font-mono text-sm text-slate-100 space-y-2">
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

        <div className="mt-6 p-4 bg-blue-900 rounded-lg text-blue-100">
          <p className="font-semibold">💡 Dica:</p>
          <p>Se todos os testes passarem (✅), a vitrine em <code className="bg-blue-800 px-2 py-1 rounded">/vitrine</code> vai funcionar corretamente.</p>
        </div>
      </div>
    </div>
  );
}
