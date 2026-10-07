-- =============================================================================
-- ERP West Máquinas — Vincular Supabase Auth com a tabela `usuarios`
-- Rode este arquivo DEPOIS do 0001 e 0002
-- =============================================================================

-- Sempre que uma conta de login for criada no Supabase Auth, este trigger
-- cria (ou atualiza) automaticamente a linha correspondente em `usuarios`,
-- já definindo o perfil certo (Administrador ou Vendedora) com base no e-mail.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (auth_id, nome, email, perfil, ativo)
  VALUES (
    NEW.id,
    CASE
      WHEN NEW.email = 'admin@westmaquinas.com' THEN 'Alcimar (Administrador)'
      WHEN NEW.email = 'vendedora@westmaquinas.com' THEN 'Vendedora'
      ELSE split_part(NEW.email, '@', 1)
    END,
    NEW.email,
    CASE
      WHEN NEW.email = 'admin@westmaquinas.com' THEN 'Administrador'
      ELSE 'Vendedora'
    END::perfil_usuario,
    TRUE
  )
  ON CONFLICT (email) DO UPDATE SET auth_id = EXCLUDED.auth_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- =============================================================================
-- FIM
-- =============================================================================
