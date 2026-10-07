-- =============================================================================
-- ERP West Máquinas — Gerar garantia automática ao vender uma máquina
-- Rode este arquivo DEPOIS do 0007
-- =============================================================================

-- Garante que existe pelo menos uma linha de configurações (prazo de garantia etc.)
INSERT INTO configuracoes (nome_loja)
SELECT 'West Máquinas' WHERE NOT EXISTS (SELECT 1 FROM configuracoes);

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
  v_estoque_atual INTEGER;
  v_nome_produto TEXT;
  v_categoria_nome TEXT;
  v_prazo_garantia_maquina INTEGER;
BEGIN
  IF p_itens IS NULL OR jsonb_array_length(p_itens) = 0 THEN
    RAISE EXCEPTION 'O carrinho está vazio.';
  END IF;

  SELECT prazo_garantia_maquina_dias INTO v_prazo_garantia_maquina FROM configuracoes LIMIT 1;
  v_prazo_garantia_maquina := COALESCE(v_prazo_garantia_maquina, 90);

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    v_produto_id := (v_item->>'produto_id')::UUID;
    v_quantidade := (v_item->>'quantidade')::INTEGER;
    v_preco := (v_item->>'preco_unitario')::NUMERIC;
    v_desconto_item := COALESCE((v_item->>'desconto')::NUMERIC, 0);

    SELECT quantidade, nome INTO v_estoque_atual, v_nome_produto
    FROM produtos WHERE id = v_produto_id FOR UPDATE;

    IF v_estoque_atual IS NULL THEN
      RAISE EXCEPTION 'Produto não encontrado no catálogo.';
    END IF;

    IF v_estoque_atual < v_quantidade THEN
      RAISE EXCEPTION 'Estoque insuficiente para "%": disponível %, solicitado %', v_nome_produto, v_estoque_atual, v_quantidade;
    END IF;

    v_subtotal := v_subtotal + (v_preco * v_quantidade) - v_desconto_item;
  END LOOP;

  v_total := v_subtotal - COALESCE(p_desconto, 0);

  INSERT INTO vendas (cliente_id, vendedor_id, subtotal, desconto, total, forma_pagamento, status)
  VALUES (p_cliente_id, p_vendedor_id, v_subtotal, COALESCE(p_desconto, 0), v_total, p_forma_pagamento, 'Finalizada')
  RETURNING id INTO v_venda_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    v_produto_id := (v_item->>'produto_id')::UUID;
    v_quantidade := (v_item->>'quantidade')::INTEGER;
    v_preco := (v_item->>'preco_unitario')::NUMERIC;
    v_desconto_item := COALESCE((v_item->>'desconto')::NUMERIC, 0);

    INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, desconto)
    VALUES (v_venda_id, v_produto_id, v_quantidade, v_preco, v_desconto_item);

    PERFORM registrar_movimentacao_estoque(
      v_produto_id,
      'Venda',
      -v_quantidade,
      p_vendedor_id,
      'Venda #' || substr(v_venda_id::TEXT, 1, 8)
    );

    -- Se o item vendido é da categoria "Máquinas" e a venda tem cliente identificado,
    -- gera a garantia automaticamente (uma por unidade vendida).
    IF p_cliente_id IS NOT NULL THEN
      SELECT c.nome INTO v_categoria_nome
      FROM produtos p LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE p.id = v_produto_id;

      IF v_categoria_nome = 'Máquinas' THEN
        INSERT INTO garantias (cliente_id, origem, origem_id, tipo, data_fim, status)
        SELECT p_cliente_id, 'Venda', v_venda_id, 'Máquina', (CURRENT_DATE + v_prazo_garantia_maquina), 'Ativa'
        FROM generate_series(1, v_quantidade);
      END IF;
    END IF;
  END LOOP;

  RETURN v_venda_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION finalizar_venda(UUID, UUID, forma_pagamento, NUMERIC, JSONB) TO authenticated;
