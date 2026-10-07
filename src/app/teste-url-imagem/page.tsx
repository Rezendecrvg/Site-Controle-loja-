"use client";

import React, { useState } from "react";

export default function TesteUrlImagemPage() {
  const [url, setUrl] = useState(
    "https://zvoagmseoahnaqynrkpd.supabase.co/storage/v1/object/public/produtos/produto_745888d5-019a-4be2-a993-bf44b9ca0722_galao_cascatai.jpg"
  );
  const [resultado, setResultado] = useState<string>("");
  const [imagemCarregada, setImagemCarregada] = useState(false);

  const testarUrl = async () => {
    setResultado("🔄 Testando URL...");
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok) {
        setResultado(`✅ URL funciona! (Status ${response.status})`);
      } else {
        setResultado(`❌ URL retornou status ${response.status}`);
      }
    } catch (error: any) {
      setResultado(`❌ Erro ao acessar: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">🔗 Teste de URL de Imagem</h1>

        <div className="space-y-6">
          {/* Input de URL */}
          <div className="space-y-2">
            <label className="text-white font-bold">URL da Imagem:</label>
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-800 text-white p-3 rounded-lg font-mono text-sm h-20 border border-slate-700"
            />
          </div>

          {/* Botão de teste */}
          <button
            onClick={testarUrl}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            🔍 Testar URL
          </button>

          {/* Resultado */}
          {resultado && (
            <div className="bg-slate-800 rounded-lg p-4 text-white font-mono">
              {resultado}
            </div>
          )}

          {/* Visualização da imagem */}
          <div className="space-y-2">
            <p className="text-white font-bold">📸 Visualização (HTML img):</p>
            <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-center min-h-40 border-2 border-slate-700">
              {imagemCarregada ? (
                <img
                  src={url}
                  alt="Teste"
                  className="max-w-xs max-h-40 rounded-lg"
                  onError={() => {
                    setResultado("❌ Erro ao carregar imagem no img tag");
                    setImagemCarregada(false);
                  }}
                />
              ) : (
                <img
                  src={url}
                  alt="Teste"
                  className="max-w-xs max-h-40 rounded-lg hidden"
                  onError={() => setResultado("❌ Erro ao carregar imagem")}
                  onLoad={() => {
                    setImagemCarregada(true);
                    setResultado("✅ Imagem carregada com sucesso!");
                  }}
                />
              )}
              {imagemCarregada ? (
                <img src={url} alt="Teste" className="max-w-xs max-h-40 rounded-lg" />
              ) : (
                <div className="text-slate-400">Clique em "Testar URL" para carregar a imagem</div>
              )}
            </div>
          </div>

          {/* Informações */}
          <div className="bg-blue-900 rounded-lg p-4 text-blue-100 space-y-2">
            <p className="font-bold">💡 Interpretação:</p>
            <ul className="text-sm space-y-1">
              <li>✅ "URL funciona" = arquivo existe no Storage</li>
              <li>❌ "Erro ao acessar" = CORS ou permissão bloqueada</li>
              <li>Se a imagem aparecer abaixo = Tudo OK!</li>
              <li>Se não aparecer = Problema na política de RLS do Storage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
