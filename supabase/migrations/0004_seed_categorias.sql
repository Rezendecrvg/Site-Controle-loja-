-- =============================================================================
-- ERP West Máquinas — Categorias padrão
-- Rode este arquivo DEPOIS do 0003
-- =============================================================================

INSERT INTO categorias (nome)
SELECT 'Máquinas' WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Máquinas');

INSERT INTO categorias (nome)
SELECT 'Peças' WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Peças');

INSERT INTO categorias (nome)
SELECT 'Armarinho' WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Armarinho');

INSERT INTO categorias (nome)
SELECT 'Acessórios' WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Acessórios');
