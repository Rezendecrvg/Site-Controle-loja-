-- =============================================================================
-- ERP West Máquinas — Liberar execução da função de garantias vencidas
-- Rode este arquivo DEPOIS do 0008
-- =============================================================================

GRANT EXECUTE ON FUNCTION atualizar_garantias_vencidas() TO authenticated;
