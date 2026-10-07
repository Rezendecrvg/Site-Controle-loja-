-- =============================================================================
-- ERP West Máquinas — Regras por produto no PDV
-- Rode este arquivo DEPOIS do 0009
--
-- O que este arquivo faz:
--   1. Adiciona as regras de venda em `produtos`:
--        exige_cliente       -> a venda só fecha com cliente identificado
--        gera_garantia       -> gera garantia automaticamente ao vender
--        exige_numero_serie  -> a vendedora precisa digitar o nº de série
--   2. Marca automaticamente os produtos da categoria "Máquinas" com as 3 regras
--      (mantém o comportamento que o sistema já tinha, agora configurável).
--   3. Guarda o número de série em `itens_venda` e em `garantias`.
--   4. Atualiza `finalizar_venda` para validar essas regras dentro da transação
--      (o front valida também, mas o banco é a garantia real).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Regras de venda por produto
-- -----------------------------------------------------------------------------

ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS exige_cliente      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gera_garantia      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS exige_numero_serie BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: tudo que já é "Máquinas" passa a exigir cliente, série e gerar garantia
UPDATE produtos p
SET exige_cliente = TRUE,
    gera_garantia = TRUE,
    exige_numero_serie = TRUE
FROM categorias c
WHERE c.id = p.categoria_id
  AND c.nome = 'Máquinas'
  AND (p.exige_cliente = FALSE OR p.gera_garantia = FALSE OR p.exige_numero_serie = FALSE);

-- -----------------------------------------------------------------------------
-- 2. Número de série na venda e na garantia
-- -----------------------------------------------------------------------------

ALTER TABLE itens_venda ADD COLUMN IF NOT EXISTS numero_serie TEXT;
ALTER TABLE garantias   ADD COLUMN IF NOT EXISTS numero_serie TEXT;

CREATE INDEX IF NOT EXISTS idx_itens_venda_serie ON itens_venda(numero_serie);

-- -----------------------------------------------------------------------------
-- 3. finalizar_venda — agora valida as regras do produto
--    p_itens: [{ produto_id, quantidade, preco_unitario, desconto, numero_serie }]
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION finalizar_venda(
  p_cliente_id UUID,
  p_vendedor_id UUID,
  p_forma_pagamento forma_pagamento,
  p_desconto NUMERIC,
  p_itens JSONB
)
RETURNS UUID AS $$
DECLARE
  v_venda_id UUID;
  v_subtotal NUMERIC := 0;
  v_total NUMERIC := 0;
  v_item JSONB;
  v_produto_id UUID;
  v_quantidade INTEGER;
  v_preco NUMERIC;
  v_desconto_item NUMERIC;
  v_numero_serie TEXT;
  v_estoque_atual INTEGER;
  v_nome_produto TEXT;
  v_exige_cliente BOOLEAN;
  v_gera_garantia BOOLEAN;
  v_exige_serie BOOLEAN;
  v_prazo_garantia_maquina INTEGER;
BEGIN
  IF p_itens IS NULL OR jsonb_array_length(p_itens) = 0 THEN
    RAISE EXCEPTION 'O carrinho está vazio.';
  END IF;

  SELECT prazo_garantia_maquina_dias INTO v_prazo_garantia_maquina FROM configuracoes LIMIT 1;
  v_prazo_garantia_maquina := COALESCE(v_prazo_garantia_maquina, 90);

  -- ---------------------------------------------------------------------------
  -- Validação: estoque + regras do produto
  -- ---------------------------------------------------------------------------
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    v_produto_id    := (v_item->>'produto_id')::UUID;
    v_quantidade    := (v_item->>'quantidade')::INTEGER;
    v_preco         := (v_item->>'preco_unitario')::NUMERIC;
    v_desconto_item := COALESCE((v_item->>'desconto')::NUMERIC, 0);
    v_numero_serie  := NULLIF(TRIM(COALESCE(v_item->>'numero_serie', '')), '');

    SELECT quantidade, nome, exige_cliente, gera_garantia, exige_numero_serie
      INTO v_estoque_atual, v_nome_produto, v_exige_cliente, v_gera_garantia, v_exige_serie
    FROM produtos WHERE id = v_produto_id FOR UPDATE;

    IF v_estoque_atual IS NULL THEN
      RAISE EXCEPTION 'Produto não encontrado no catálogo.';
    END IF;

    IF v_estoque_atual < v_quantidade THEN
      RAISE EXCEPTION 'Estoque insuficiente para "%": disponível %, solicitado %',
        v_nome_produto, v_estoque_atual, v_quantidade;
    END IF;

    IF v_exige_cliente AND p_cliente_id IS NULL THEN
      RAISE EXCEPTION 'O produto "%" exige um cliente identificado na venda.', v_nome_produto;
    END IF;

    IF v_exige_serie AND v_numero_serie IS NULL THEN
      RAISE EXCEPTION 'Informe o número de série do produto "%".', v_nome_produto;
    END IF;

    IF v_exige_serie AND v_quantidade <> 1 THEN
      RAISE EXCEPTION 'O produto "%" é vendido por unidade (um número de série por item).', v_nome_produto;
    END IF;

    v_subtotal := v_subtotal + (v_preco * v_quantidade) - v_desconto_item;
  END LOOP;

  v_total := v_subtotal - COALESCE(p_desconto, 0);

  INSERT INTO vendas (cliente_id, vendedor_id, subtotal, desconto, total, forma_pagamento, status)
  VALUES (p_cliente_id, p_vendedor_id, v_subtotal, COALESCE(p_desconto, 0), v_total, p_forma_pagamento, 'Finalizada')
  RETURNING id INTO v_venda_id;

  -- ---------------------------------------------------------------------------
  -- Gravação: itens, baixa de estoque e garantias
  -- ---------------------------------------------------------------------------
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    v_produto_id    := (v_item->>'produto_id')::UUID;
    v_quantidade    := (v_item->>'quantidade')::INTEGER;
    v_preco         := (v_item->>'preco_unitario')::NUMERIC;
    v_desconto_item := COALESCE((v_item->>'desconto')::NUMERIC, 0);
    v_numero_serie  := NULLIF(TRIM(COALESCE(v_item->>'numero_serie', '')), '');

    INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, desconto, numero_serie)
    VALUES (v_venda_id, v_produto_id, v_quantidade, v_preco, v_desconto_item, v_numero_serie);

    PERFORM registrar_movimentacao_estoque(
      v_produto_id,
      'Venda',
      -v_quantidade,
      p_vendedor_id,
      'Venda #' || substr(v_venda_id::TEXT, 1, 8)
    );

    SELECT gera_garantia INTO v_gera_garantia FROM produtos WHERE id = v_produto_id;

    IF v_gera_garantia AND p_cliente_id IS NOT NULL THEN
      INSERT INTO garantias (cliente_id, origem, origem_id, tipo, data_fim, status, numero_serie)
      SELECT p_cliente_id, 'Venda', v_venda_id, 'Máquina',
             (CURRENT_DATE + v_prazo_garantia_maquina), 'Ativa', v_numero_serie
      FROM generate_series(1, v_quantidade);
    END IF;
  END LOOP;

  RETURN v_venda_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION finalizar_venda(UUID, UUID, forma_pagamento, NUMERIC, JSONB) TO authenticated;

-- =============================================================================
-- FIM
-- =============================================================================
