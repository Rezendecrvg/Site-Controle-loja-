-- =============================================================================
-- ERP West Máquinas — Função para finalizar uma venda
-- Cria a venda, os itens, valida e dá baixa no estoque — tudo em uma transação
-- Rode este arquivo DEPOIS do 0006
-- =============================================================================

CREATE OR REPLACE FUNCTION finalizar_venda(
  p_cliente_id UUID,
  p_vendedor_id UUID,
  p_forma_pagamento forma_pagamento,
  p_desconto NUMERIC,
  p_itens JSONB -- [{ "produto_id": "...", "quantidade": 2, "preco_unitario": 10.5, "desconto": 0 }]
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
BEGIN
  IF p_itens IS NULL OR jsonb_array_length(p_itens) = 0 THEN
    RAISE EXCEPTION 'O carrinho está vazio.';
  END IF;

  -- Valida estoque disponível e calcula o subtotal (trava as linhas dos produtos)
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

    -- Dá baixa no estoque (mesma função usada na tela de Estoque, já cuida de
    -- desativar máquinas automaticamente quando o estoque zerar)
    PERFORM registrar_movimentacao_estoque(
      v_produto_id,
      'Venda',
      -v_quantidade,
      p_vendedor_id,
      'Venda #' || substr(v_venda_id::TEXT, 1, 8)
    );
  END LOOP;

  RETURN v_venda_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION finalizar_venda(UUID, UUID, forma_pagamento, NUMERIC, JSONB) TO authenticated;
