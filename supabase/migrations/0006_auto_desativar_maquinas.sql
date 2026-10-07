-- =============================================================================
-- ERP West Máquinas — Desativar automaticamente máquinas com estoque zerado
-- Rode este arquivo DEPOIS do 0005
-- =============================================================================

CREATE OR REPLACE FUNCTION registrar_movimentacao_estoque(
  p_produto_id UUID,
  p_tipo tipo_movimentacao_estoque,
  p_quantidade INTEGER, -- positivo = entrada, negativo = saída
  p_usuario_id UUID,
  p_observacao TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_nova_quantidade INTEGER;
  v_categoria_nome TEXT;
BEGIN
  UPDATE produtos
  SET quantidade = quantidade + p_quantidade
  WHERE id = p_produto_id
  RETURNING quantidade INTO v_nova_quantidade;

  INSERT INTO movimentacao_estoque (produto_id, tipo, quantidade, usuario_id, observacao)
  VALUES (p_produto_id, p_tipo, p_quantidade, p_usuario_id, p_observacao);

  -- Se o produto é da categoria "Máquinas" e o estoque zerou (ou ficou negativo),
  -- desativa automaticamente o produto (cada máquina é uma unidade única).
  IF v_nova_quantidade <= 0 THEN
    SELECT c.nome INTO v_categoria_nome
    FROM produtos p
    LEFT JOIN categorias c ON c.id = p.categoria_id
    WHERE p.id = p_produto_id;

    IF v_categoria_nome = 'Máquinas' THEN
      UPDATE produtos SET ativo = FALSE WHERE id = p_produto_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION registrar_movimentacao_estoque(UUID, tipo_movimentacao_estoque, INTEGER, UUID, TEXT) TO authenticated;
