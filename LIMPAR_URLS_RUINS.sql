-- ⚠️ CUIDADO: EXECUTE ISSO NO SUPABASE SQL EDITOR ANTES DE FAZER UPLOAD DE NOVAS IMAGENS

-- 1️⃣ Deletar todas as URLs que tem "producto" (espanhol) em vez de "produtos"
DELETE FROM fotos_produtos 
WHERE url LIKE '%producto%';

-- 2️⃣ Deletar todas as URLs que não começam com https:// (URLs mal formatadas)
DELETE FROM fotos_produtos 
WHERE url NOT LIKE 'https://%';

-- 3️⃣ Ver quantas fotos ficaram (deve retornar 0 se começou do zero)
SELECT COUNT(*) as total_fotos FROM fotos_produtos;
