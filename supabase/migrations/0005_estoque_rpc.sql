-- =============================================================================
-- ERP West Máquinas — Função para registrar movimentação de estoque
-- Atualiza a quantidade do produto E grava o histórico em uma única operação
-- Rode este arquivo DEPOIS do 0004
-- =============================================================================

CREATE OR REPLACE FUNCTION registrar_movimentacao_estoque(
  p_produto_id UUID,
  p_tipo tipo_movimentacao_estoque,
  p_quantidade INTEGER, -- positivo = entrada, negativo = saída
  p_usuario_id UUID,
  p_observacao TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE produtos
  SET quantidade = quantidade + p_quantidade
  WHERE id = p_produto_id;

  INSERT INTO movimentacao_estoque (produto_id, tipo, quantidade, usuario_id, observacao)
  VALUES (p_produto_id, p_tipo, p_quantidade, p_usuario_id, p_observacao);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION registrar_movimentacao_estoque(UUID, tipo_movimentacao_estoque, INTEGER, UUID, TEXT) TO authenticated;
