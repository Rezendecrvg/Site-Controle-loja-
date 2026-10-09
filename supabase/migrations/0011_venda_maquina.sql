-- =============================================================================
-- ERP West Máquinas — Venda de Máquina (tela dedicada)
-- Rode este arquivo DEPOIS do 0010
--
-- O que este arquivo faz:
--   1. Adiciona a coluna `observacao` em `vendas`
--   2. Cria a função `vender_maquina`, que numa única transação:
--        - registra a venda (aceita data de hoje ou data passada)
--        - grava o item com o número de série
--        - dá baixa no estoque (e desativa a máquina, via registrar_movimentacao_estoque)
--        - gera a garantia com o prazo informado (0 dias = sem garantia)
--
-- Regras de data:
--   - Data de hoje      -> exige caixa aberto; a venda entra no caixa de hoje
--   - Data passada      -> não exige caixa; entra no relatório do dia escolhido
--   - Data futura       -> bloqueada
-- =============================================================================

ALTER TABLE vendas ADD COLUMN IF NOT EXISTS observacao TEXT;

CREATE OR REPLACE FUNCTION vender_maquina(
  p_cliente_id UUID,
  p_vendedor_id UUID,
  p_produto_id UUID,
  p_numero_serie TEXT,
  p_preco NUMERIC,
  p_desconto NUMERIC,
  p_forma_pagamento forma_pagamento,
  p_data_venda DATE,
  p_prazo_garantia_dias INTEGER,
  p_observacao TEXT
)
RETURNS UUID AS $$
DECLARE
  v_hoje DATE := (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE;
  v_data_venda DATE := COALESCE(p_data_venda, (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE);
  v_data_venda_ts TIMESTAMPTZ;
  v_numero_serie TEXT := NULLIF(TRIM(COALESCE(p_numero_serie, '')), '');
  v_desconto NUMERIC := COALESCE(p_desconto, 0);
  v_prazo INTEGER := COALESCE(p_prazo_garantia_dias, 0);
  v_estoque_atual INTEGER;
  v_nome_produto TEXT;
  v_total NUMERIC;
  v_venda_id UUID;
BEGIN
  -- ---------------------------------------------------------------------------
  -- Validações
  -- ---------------------------------------------------------------------------
  IF p_cliente_id IS NULL THEN
    RAISE EXCEPTION 'Informe o cliente da venda.';
  END IF;

  IF v_numero_serie IS NULL THEN
    RAISE EXCEPTION 'Informe o número de série da máquina.';
  END IF;

  IF p_preco IS NULL OR p_preco < 0 THEN
    RAISE EXCEPTION 'Informe um preço válido.';
  END IF;

  IF v_desconto < 0 OR v_desconto > p_preco THEN
    RAISE EXCEPTION 'Desconto inválido.';
  END IF;

  IF v_prazo < 0 THEN
    RAISE EXCEPTION 'Prazo de garantia inválido.';
  END IF;

  IF v_data_venda > v_hoje THEN
    RAISE EXCEPTION 'A data da venda não pode ser no futuro.';
  END IF;

  IF v_data_venda = v_hoje AND NOT EXISTS (SELECT 1 FROM caixa WHERE status = 'Aberto') THEN
    RAISE EXCEPTION 'Abra o caixa antes de registrar uma venda de hoje.';
  END IF;

  SELECT quantidade, nome INTO v_estoque_atual, v_nome_produto
  FROM produtos WHERE id = p_produto_id FOR UPDATE;

  IF v_estoque_atual IS NULL THEN
    RAISE EXCEPTION 'Máquina não encontrada no catálogo.';
  END IF;

  IF v_estoque_atual < 1 THEN
    RAISE EXCEPTION 'A máquina "%" está sem estoque.', v_nome_produto;
  END IF;

  -- ---------------------------------------------------------------------------
  -- Data/hora da venda: hoje = agora; data passada = meio-dia de Brasília
  -- (meio-dia evita que o fuso horário empurre a venda pro dia vizinho)
  -- ---------------------------------------------------------------------------
  IF v_data_venda = v_hoje THEN
    v_data_venda_ts := NOW();
  ELSE
    v_data_venda_ts := ((v_data_venda::TEXT || ' 12:00:00')::TIMESTAMP) AT TIME ZONE 'America/Sao_Paulo';
  END IF;

  v_total := p_preco - v_desconto;

  -- ---------------------------------------------------------------------------
  -- Gravação
  -- ---------------------------------------------------------------------------
  INSERT INTO vendas (cliente_id, vendedor_id, data, subtotal, desconto, total, forma_pagamento, status, observacao)
  VALUES (
    p_cliente_id, p_vendedor_id, v_data_venda_ts, p_preco, v_desconto, v_total,
    p_forma_pagamento, 'Finalizada', NULLIF(TRIM(COALESCE(p_observacao, '')), '')
  )
  RETURNING id INTO v_venda_id;

  INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, desconto, numero_serie)
  VALUES (v_venda_id, p_produto_id, 1, p_preco, 0, v_numero_serie);

  PERFORM registrar_movimentacao_estoque(
    p_produto_id,
    'Venda',
    -1,
    p_vendedor_id,
    'Venda de máquina #' || substr(v_venda_id::TEXT, 1, 8)
  );

  IF v_prazo > 0 THEN
    INSERT INTO garantias (cliente_id, origem, origem_id, tipo, data_inicio, data_fim, status, numero_serie)
    VALUES (
      p_cliente_id, 'Venda', v_venda_id, 'Máquina', v_data_venda, v_data_venda + v_prazo,
      CASE WHEN v_data_venda + v_prazo < v_hoje THEN 'Vencida'::status_garantia ELSE 'Ativa'::status_garantia END,
      v_numero_serie
    );
  END IF;

  RETURN v_venda_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION vender_maquina(UUID, UUID, UUID, TEXT, NUMERIC, NUMERIC, forma_pagamento, DATE, INTEGER, TEXT) TO authenticated;

-- =============================================================================
-- FIM
-- =============================================================================
