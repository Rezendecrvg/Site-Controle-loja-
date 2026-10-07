-- =============================================================================
-- ERP West Máquinas — Políticas de RLS (Row Level Security)
-- Rode este arquivo DEPOIS do schema.sql
-- =============================================================================

-- Habilita RLS em todas as tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibilidade_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacao_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_os ENABLE ROW LEVEL SECURITY;
ALTER TABLE garantias ENABLE ROW LEVEL SECURITY;
ALTER TABLE promocoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_precos ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- REGRA GERAL: usuários autenticados (logados no sistema) têm acesso total
-- Isso cobre o painel interno (Administrador / Vendedora)
-- =============================================================================

CREATE POLICY "Autenticados podem tudo - usuarios" ON usuarios
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - clientes" ON clientes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - categorias" ON categorias
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - produtos" ON produtos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - fotos_produtos" ON fotos_produtos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - compatibilidade_pecas" ON compatibilidade_pecas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - fornecedores" ON fornecedores
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - compras" ON compras
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - itens_compra" ON itens_compra
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - movimentacao_estoque" ON movimentacao_estoque
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - vendas" ON vendas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - itens_venda" ON itens_venda
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - caixa" ON caixa
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - movimentacoes_caixa" ON movimentacoes_caixa
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - ordens_servico" ON ordens_servico
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - itens_os" ON itens_os
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - garantias" ON garantias
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - promocoes" ON promocoes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - banners" ON banners
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - notificacoes" ON notificacoes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - configuracoes" ON configuracoes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - logs_sistema" ON logs_sistema
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem tudo - historico_precos" ON historico_precos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================================
-- ACESSO PÚBLICO (anon): apenas leitura, apenas para a "Vitrine Digital"
-- (catálogo público que qualquer visitante do site pode ver, sem login)
-- =============================================================================

CREATE POLICY "Publico le produtos ativos" ON produtos
  FOR SELECT TO anon USING (ativo = true);

CREATE POLICY "Publico le fotos de produtos" ON fotos_produtos
  FOR SELECT TO anon USING (true);

CREATE POLICY "Publico le categorias" ON categorias
  FOR SELECT TO anon USING (true);

CREATE POLICY "Publico le promocoes ativas" ON promocoes
  FOR SELECT TO anon USING (ativa = true);

CREATE POLICY "Publico le banners ativos" ON banners
  FOR SELECT TO anon USING (ativo = true);

CREATE POLICY "Publico le configuracoes da loja" ON configuracoes
  FOR SELECT TO anon USING (true);

-- =============================================================================
-- FIM DAS POLÍTICAS DE RLS
-- =============================================================================
