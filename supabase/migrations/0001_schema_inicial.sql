-- =============================================================================
-- ERP West Máquinas — Schema SQL Completo
-- Banco de dados PostgreSQL (Supabase)
-- Versão: 1.0
-- =============================================================================

-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TIPOS ENUMERADOS (ENUMs)
-- =============================================================================

CREATE TYPE perfil_usuario AS ENUM ('Administrador', 'Vendedora');

CREATE TYPE tipo_movimentacao_estoque AS ENUM (
  'Entrada', 'Venda', 'Ajuste Manual', 'Ordem de Serviço', 'Perda', 'Devolução'
);

CREATE TYPE forma_pagamento AS ENUM (
  'Dinheiro', 'Pix', 'Cartão de Débito', 'Cartão de Crédito', 'Transferência'
);

CREATE TYPE status_venda AS ENUM ('Finalizada', 'Cancelada');

CREATE TYPE status_caixa AS ENUM ('Aberto', 'Fechado');

CREATE TYPE tipo_movimentacao_caixa AS ENUM ('Entrada', 'Saída');

CREATE TYPE status_os AS ENUM (
  'Recebida', 'Em análise', 'Aguardando aprovação', 'Aguardando peças',
  'Em manutenção', 'Teste', 'Pronta para retirada', 'Entregue', 'Cancelada'
);

CREATE TYPE origem_garantia AS ENUM ('Venda', 'Ordem de Serviço');
CREATE TYPE tipo_garantia AS ENUM ('Máquina', 'Serviço');
CREATE TYPE status_garantia AS ENUM ('Ativa', 'Vencida');

-- =============================================================================
-- FUNÇÃO AUXILIAR: Atualizar campo `atualizado_em` automaticamente
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TABELA: usuarios
-- Perfis de usuários vinculados ao Supabase Auth
-- =============================================================================

CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE, -- Referência ao auth.users do Supabase
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  perfil perfil_usuario NOT NULL DEFAULT 'Vendedora',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_login TIMESTAMPTZ
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_perfil ON usuarios(perfil);
CREATE INDEX idx_usuarios_auth_id ON usuarios(auth_id);

CREATE TRIGGER set_usuarios_atualizado_em
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION trigger_set_atualizado_em();

-- =============================================================================
-- TABELA: clientes
-- =============================================================================

CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  whatsapp TEXT,
  cpf TEXT UNIQUE,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  cep TEXT,
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clientes_nome ON clientes(nome);
CREATE INDEX idx_clientes_cpf ON clientes(cpf);
CREATE INDEX idx_clientes_telefone ON clientes(telefone);

CREATE TRIGGER set_clientes_atualizado_em
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_atualizado_em();

-- =============================================================================
-- TABELA: categorias
-- Suporta subcategorias via self-referencing (categoria_pai_id)
-- =============================================================================

CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria_pai_id UUID REFERENCES categorias(id) ON DELETE SET NULL
);

CREATE INDEX idx_categorias_pai ON categorias(categoria_pai_id);

-- =============================================================================
-- TABELA: produtos
-- =============================================================================

CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  subcategoria TEXT,
  marca TEXT,
  modelo TEXT,
  preco_custo NUMERIC(12, 2) NOT NULL DEFAULT 0,
  preco_venda NUMERIC(12, 2) NOT NULL DEFAULT 0,
  parcelamento TEXT,
  quantidade INTEGER NOT NULL DEFAULT 0,
  estoque_minimo INTEGER NOT NULL DEFAULT 5,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  em_promocao BOOLEAN NOT NULL DEFAULT FALSE,
  destaque BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_produtos_nome ON produtos(nome);
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_produtos_marca ON produtos(marca);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);
CREATE INDEX idx_produtos_promocao ON produtos(em_promocao);
CREATE INDEX idx_produtos_destaque ON produtos(destaque);

CREATE TRIGGER set_produtos_atualizado_em
  BEFORE UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_atualizado_em();

-- =============================================================================
-- TABELA: fotos_produtos
-- =============================================================================

CREATE TABLE fotos_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  principal BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_fotos_produto ON fotos_produtos(produto_id);

-- =============================================================================
-- TABELA: compatibilidade_pecas
-- Vincula peças a tipos/modelos de máquinas compatíveis
-- =============================================================================

CREATE TABLE compatibilidade_pecas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  categoria_da_maquina TEXT NOT NULL,
  modelo_da_maquina TEXT
);

CREATE INDEX idx_compat_produto ON compatibilidade_pecas(produto_id);
CREATE INDEX idx_compat_categoria ON compatibilidade_pecas(categoria_da_maquina);

-- =============================================================================
-- TABELA: fornecedores
-- =============================================================================

CREATE TABLE fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  cidade TEXT,
  observacoes TEXT
);

CREATE INDEX idx_fornecedores_nome ON fornecedores(nome);

-- =============================================================================
-- TABELA: compras
-- Registra compras realizadas de fornecedores
-- =============================================================================

CREATE TABLE compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL,
  data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valor_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  observacoes TEXT
);

CREATE INDEX idx_compras_fornecedor ON compras(fornecedor_id);
CREATE INDEX idx_compras_data ON compras(data);

-- =============================================================================
-- TABELA: itens_compra
-- =============================================================================

CREATE TABLE itens_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_itens_compra_compra ON itens_compra(compra_id);
CREATE INDEX idx_itens_compra_produto ON itens_compra(produto_id);

-- =============================================================================
-- TABELA: movimentacao_estoque
-- Auditoria de toda movimentação de estoque
-- =============================================================================

CREATE TABLE movimentacao_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo tipo_movimentacao_estoque NOT NULL,
  quantidade INTEGER NOT NULL,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  observacao TEXT
);

CREATE INDEX idx_mov_estoque_produto ON movimentacao_estoque(produto_id);
CREATE INDEX idx_mov_estoque_tipo ON movimentacao_estoque(tipo);
CREATE INDEX idx_mov_estoque_data ON movimentacao_estoque(data);
CREATE INDEX idx_mov_estoque_usuario ON movimentacao_estoque(usuario_id);

-- =============================================================================
-- TABELA: vendas
-- =============================================================================

CREATE TABLE vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  vendedor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  desconto NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  forma_pagamento forma_pagamento NOT NULL DEFAULT 'Dinheiro',
  status status_venda NOT NULL DEFAULT 'Finalizada'
);

CREATE INDEX idx_vendas_cliente ON vendas(cliente_id);
CREATE INDEX idx_vendas_vendedor ON vendas(vendedor_id);
CREATE INDEX idx_vendas_data ON vendas(data);
CREATE INDEX idx_vendas_status ON vendas(status);
CREATE INDEX idx_vendas_forma ON vendas(forma_pagamento);

-- =============================================================================
-- TABELA: itens_venda
-- =============================================================================

CREATE TABLE itens_venda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0,
  desconto NUMERIC(12, 2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_itens_venda_venda ON itens_venda(venda_id);
CREATE INDEX idx_itens_venda_produto ON itens_venda(produto_id);

-- =============================================================================
-- TABELA: caixa
-- =============================================================================

CREATE TABLE caixa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  usuario_abertura_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  valor_abertura NUMERIC(12, 2) NOT NULL DEFAULT 0,
  valor_fechamento NUMERIC(12, 2),
  valor_conferido NUMERIC(12, 2),
  diferenca NUMERIC(12, 2),
  status status_caixa NOT NULL DEFAULT 'Aberto',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fechado_em TIMESTAMPTZ
);

CREATE INDEX idx_caixa_data ON caixa(data);
CREATE INDEX idx_caixa_status ON caixa(status);
CREATE INDEX idx_caixa_usuario ON caixa(usuario_abertura_id);

-- =============================================================================
-- TABELA: movimentacoes_caixa
-- Entradas e Saídas manuais do caixa (sangria, troco, etc.)
-- =============================================================================

CREATE TABLE movimentacoes_caixa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caixa_id UUID NOT NULL REFERENCES caixa(id) ON DELETE CASCADE,
  tipo tipo_movimentacao_caixa NOT NULL,
  valor NUMERIC(12, 2) NOT NULL,
  motivo TEXT NOT NULL,
  responsavel_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  observacao TEXT
);

CREATE INDEX idx_mov_caixa_caixa ON movimentacoes_caixa(caixa_id);
CREATE INDEX idx_mov_caixa_tipo ON movimentacoes_caixa(tipo);
CREATE INDEX idx_mov_caixa_data ON movimentacoes_caixa(data);

-- =============================================================================
-- TABELA: ordens_servico
-- =============================================================================

-- Sequência para numeração incremental automática das OS
CREATE SEQUENCE os_numero_seq START WITH 1001;

CREATE TABLE ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL DEFAULT nextval('os_numero_seq'),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  marca_maquina TEXT NOT NULL,
  modelo_maquina TEXT NOT NULL,
  numero_serie TEXT,
  cor_maquina TEXT,
  estado_geral TEXT,
  acessorios_entregues TEXT,
  defeito_informado TEXT NOT NULL,
  diagnostico TEXT,
  servico_executado TEXT,
  valor_mao_obra NUMERIC(12, 2) NOT NULL DEFAULT 0,
  valor_pecas NUMERIC(12, 2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status status_os NOT NULL DEFAULT 'Recebida',
  data_entrada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  previsao_entrega TIMESTAMPTZ,
  data_entrega TIMESTAMPTZ,
  garantia_dias INTEGER NOT NULL DEFAULT 30
);

CREATE UNIQUE INDEX idx_os_numero ON ordens_servico(numero);
CREATE INDEX idx_os_cliente ON ordens_servico(cliente_id);
CREATE INDEX idx_os_status ON ordens_servico(status);
CREATE INDEX idx_os_data_entrada ON ordens_servico(data_entrada);

-- =============================================================================
-- TABELA: itens_os
-- Peças do estoque utilizadas na ordem de serviço
-- =============================================================================

CREATE TABLE itens_os (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_itens_os_os ON itens_os(os_id);
CREATE INDEX idx_itens_os_produto ON itens_os(produto_id);

-- =============================================================================
-- TABELA: garantias
-- =============================================================================

CREATE TABLE garantias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  origem origem_garantia NOT NULL,
  origem_id UUID NOT NULL, -- Referência à venda ou OS correspondente
  tipo tipo_garantia NOT NULL,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE NOT NULL,
  status status_garantia NOT NULL DEFAULT 'Ativa'
);

CREATE INDEX idx_garantias_cliente ON garantias(cliente_id);
CREATE INDEX idx_garantias_origem ON garantias(origem);
CREATE INDEX idx_garantias_status ON garantias(status);
CREATE INDEX idx_garantias_data_fim ON garantias(data_fim);

-- =============================================================================
-- TABELA: promocoes
-- =============================================================================

CREATE TABLE promocoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_fim TIMESTAMPTZ NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_promocoes_ativa ON promocoes(ativa);
CREATE INDEX idx_promocoes_datas ON promocoes(data_inicio, data_fim);

-- =============================================================================
-- TABELA: banners
-- Banners da Vitrine Digital pública
-- =============================================================================

CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  imagem_url TEXT,
  texto_botao TEXT,
  link TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ordem INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_banners_ativo ON banners(ativo);
CREATE INDEX idx_banners_ordem ON banners(ordem);

-- =============================================================================
-- TABELA: notificacoes
-- =============================================================================

CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT FALSE,
  criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX idx_notificacoes_data ON notificacoes(criada_em);

-- =============================================================================
-- TABELA: configuracoes
-- Registro único com parametrizações da loja
-- =============================================================================

CREATE TABLE configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_loja TEXT NOT NULL DEFAULT 'West Máquinas',
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  endereco TEXT,
  instagram TEXT,
  facebook TEXT,
  logo_url TEXT,
  prazo_garantia_maquina_dias INTEGER NOT NULL DEFAULT 90,
  prazo_garantia_servico_dias INTEGER NOT NULL DEFAULT 30,
  estoque_minimo_padrao INTEGER NOT NULL DEFAULT 5
);

-- =============================================================================
-- TABELA: logs_sistema
-- Auditoria de ações no sistema
-- =============================================================================

CREATE TABLE logs_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  detalhes TEXT,
  ip TEXT,
  data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_logs_usuario ON logs_sistema(usuario_id);
CREATE INDEX idx_logs_acao ON logs_sistema(acao);
CREATE INDEX idx_logs_data ON logs_sistema(data_hora);

-- =============================================================================
-- TABELA: historico_precos
-- =============================================================================

CREATE TABLE historico_precos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  preco_custo_antigo NUMERIC(12, 2),
  preco_custo_novo NUMERIC(12, 2),
  preco_venda_antigo NUMERIC(12, 2),
  preco_venda_novo NUMERIC(12, 2),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  data_alteracao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hist_precos_produto ON historico_precos(produto_id);
CREATE INDEX idx_hist_precos_data ON historico_precos(data_alteracao);

-- =============================================================================
-- TRIGGER: Registrar histórico de preços automaticamente ao alterar produto
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_registrar_historico_precos()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.preco_custo IS DISTINCT FROM NEW.preco_custo
     OR OLD.preco_venda IS DISTINCT FROM NEW.preco_venda THEN
    INSERT INTO historico_precos (
      produto_id,
      preco_custo_antigo,
      preco_custo_novo,
      preco_venda_antigo,
      preco_venda_novo
    ) VALUES (
      NEW.id,
      OLD.preco_custo,
      NEW.preco_custo,
      OLD.preco_venda,
      NEW.preco_venda
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_historico_precos
  AFTER UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION trigger_registrar_historico_precos();

-- =============================================================================
-- TRIGGER: Atualizar garantias vencidas automaticamente
-- Pode ser executado periodicamente via cron do Supabase
-- =============================================================================

CREATE OR REPLACE FUNCTION atualizar_garantias_vencidas()
RETURNS void AS $$
BEGIN
  UPDATE garantias
  SET status = 'Vencida'
  WHERE status = 'Ativa' AND data_fim < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FIM DO SCHEMA
-- =============================================================================
