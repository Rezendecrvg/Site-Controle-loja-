# Venda de Máquina — nova aba

## Ordem (importante: banco primeiro)

### 1) Banco de dados (Supabase)
Abra o SQL Editor, cole o conteúdo de `supabase/migrations/0011_venda_maquina.sql` e rode.
Sem isso a tela dá erro ao registrar a venda.

### 2) Arquivos do projeto (copie para a pasta `Site loja`, mantendo os caminhos)
```
src/app/venda-maquina/page.tsx          <- ARQUIVO NOVO (crie a pasta venda-maquina)
src/components/layout/sidebar.tsx       <- SUBSTITUI
```
O sidebar.tsx é baseado na última versão que recebi (menu com "Caixa / PDV").
Se você mudou o menu depois disso, em vez de substituir o arquivo, apenas adicione
o item "Venda de Máquina" (href "/venda-maquina", ícone Receipt).

### 3) Rodar
```
npm run dev
```
Para publicar: git add . / git commit / git push (o Vercel faz o deploy sozinho).

## Como a tela funciona
- Escolhe a máquina (só aparecem máquinas ativas e com estoque), digita o número de série
- Escolhe o cliente (obrigatório)
- Data da venda: hoje por padrão; pode escolher data passada (futura é bloqueada)
- Preço (vem da tabela, editável), desconto, forma de pagamento
- Garantia em dias (vem das Configurações, editável; 0 = sem garantia)
- Observação (texto livre)
- Ao registrar: baixa o estoque, cria a garantia e a venda aparece no perfil do cliente
- Abre o recibo, com botão de WhatsApp e botão de imprimir

## Regras de data e caixa
- Venda de HOJE: exige caixa aberto e entra no caixa de hoje
- Venda de data PASSADA: não exige caixa; entra no relatório do dia escolhido,
  não soma no caixa de hoje

## Limites conhecidos
- O WhatsApp abre com a mensagem pronta; a pessoa precisa apertar "enviar".
  O recibo vai como texto (não dá para anexar PDF por esse link).
- A observação é salva na venda, mas ainda não aparece no perfil do cliente
  nem nos relatórios.
