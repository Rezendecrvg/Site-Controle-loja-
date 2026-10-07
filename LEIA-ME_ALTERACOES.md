# West Máquinas — Alterações do Caixa / PDV

Pacote com **apenas os arquivos alterados**. Nada aqui recria o sistema: banco,
autenticação, Supabase, RPCs de estoque e componentes de UI continuam os mesmos.

## Como aplicar

1. **Rode a migration primeiro** (SQL Editor do Supabase):
   `supabase/migrations/0010_regras_produto_pdv.sql`

   Ela faz:
   - adiciona `exige_cliente`, `gera_garantia` e `exige_numero_serie` em `produtos`;
   - marca automaticamente os produtos da categoria "Máquinas" com as três regras;
   - cria `numero_serie` em `itens_venda` e em `garantias`;
   - atualiza a função `finalizar_venda` para validar as regras dentro da transação.

2. **Copie a pasta `src/` deste zip por cima da `src/` do projeto**, mantendo os
   caminhos. ATENÇÃO: os arquivos vão em `src/app/...`, nunca na raiz do projeto —
   extrair no lugar errado quebra as rotas com 404.

   Arquivos substituídos:
   - `src/app/ponto-venda/page.tsx`
   - `src/app/produtos/page.tsx`
   - `src/app/relatorios/page.tsx`
   - `src/app/vendas/page.tsx`  (agora só redireciona para `/ponto-venda`)
   - `src/components/layout/sidebar.tsx`
   - `src/lib/date-utils.ts`  (ganhou o helper `intervaloDoDiaLocalISO`)

3. `npm run dev` e testar.

## Resumo das alterações

### Caixa / PDV (`/ponto-venda`, aba "Venda")
- Produtos por categoria no lado esquerdo (chips de categoria + busca).
- Carrinho, formas de pagamento, desconto e finalizar venda no lado direito.
- Regras automáticas por produto ao adicionar no carrinho:
  - exige cliente -> campo de cliente marcado como obrigatório, venda não fecha sem ele;
  - exige número de série -> linha entra como 1 unidade, com campo próprio de série;
  - gera garantia -> garantia criada automaticamente ao finalizar.
- Peça / armarinho: venda de balcão, sem exigir cadastro de cliente.
- Botão "Novo" no card de Cliente: cadastro rápido durante a venda (nome, telefone, CPF),
  já selecionando o cliente criado.
- Abertura de caixa direto pela tela, quando o caixa está fechado.

### Caixa (`/ponto-venda?aba=caixa`)
- Abrir caixa (valor inicial) e fechar caixa (com valor esperado e diferença).
- Registrar entrada e registrar saída (grava em `movimentacoes_caixa` com motivo e responsável).
- Lista de vendas do dia e de movimentações do caixa.
- Saldo esperado = valor inicial + vendas + entradas − saídas.
- Vendedora e administrador continuam logados após fechar o caixa (não sai mais do sistema automaticamente).
- **Histórico por dia (só Administrador)**, no fim da aba Caixa: calendário para
  escolher qualquer data, atalhos para os últimos dias que tiveram caixa, e para o
  dia escolhido: hora e valor de abertura, hora e valor de fechamento, diferença de
  conferência, tempo que o caixa ficou aberto, valor inicial, total vendido,
  entradas, saídas, saldo final, movimentações, formas de pagamento e as vendas.

### Relatórios (`/relatorios`, só Administrador)
- Aba "Caixa do dia": valor inicial, total vendido, entradas, saídas, saldo final,
  conferência e diferença, movimentações do dia, produtos vendidos, formas de
  pagamento e vendas por vendedor(a), com seletor de data.
- Aba "Vendas & BI": faturamento, lucro, total de vendas, ticket médio, gráficos e
  ranking de produtos e vendedores.
- O lucro agora usa `preco_custo` real do produto (antes era um custo fictício de 40%
  do preço de venda).
- Os botões de período (Hoje / Semana / Mês atual / Ano) passaram a filtrar de fato.
- Sem atualização automática: apenas o botão "Atualizar".

### Produtos (`/produtos`)
- Bloco "Regras de venda no PDV" no formulário: exige cliente, gera garantia,
  exige número de série. Escolher a categoria "Máquinas" já sugere as três.
- Coluna "Regras de venda" na tabela.
- Vendedora: custo e margem ocultos, preço de venda travado na edição
  (informa só no cadastro de mercadoria nova), sem botão de ativar/desativar produto.
- Botão "Excluir" (só Administrador) na coluna Ações, com confirmação antes de apagar.
  Se o produto já tem venda, compra ou ordem de serviço vinculada, o banco recusa a
  exclusão (pra não perder histórico) e a tela avisa pra usar "Desativar" nesse caso.
- Abas "Ativos" / "Desativados" / "Todos" no topo da lista, cada uma com a contagem
  ao lado. Abre em "Ativos" por padrão; busca e filtro de categoria funcionam dentro
  da aba selecionada.

### Menu lateral
- "Caixa / PDV" como primeiro item depois do Dashboard.
- Item duplicado "Vendas" removido (a rota `/vendas` redireciona para `/ponto-venda`).
- Estoque visível para a vendedora (entrada de mercadoria).

### Clientes (`/clientes`)
- Clicar no nome do cliente na tabela abre um popup com os dados do cliente
  (telefone, CPF, endereço, observações), o histórico completo de compras
  (data e hora, forma de pagamento, vendedor(a), itens com quantidade, preço e
  número de série, desconto e total) e o histórico de ordens de serviço
  (número, data, máquina, status colorido, defeito informado, diagnóstico,
  serviço executado, mão de obra, peças, total e data de entrega). O resumo
  rápido no topo mostra total de compras, total gasto, quantidade de OS e
  garantias ativas, e há um atalho para editar o cliente sem fechar o popup.

### Vitrine pública (`/`, `src/app/page.tsx`)
- Produtos da categoria "Armarinho" não aparecem mais na vitrine pública (site que
  os clientes veem) — ficam só no PDV para venda de balcão. O botão de filtro
  "Armarinho" também saiu da barra de categorias da vitrine.

## Observação

O bloqueio de preço e lucro da vendedora está na interface. As políticas de RLS
atuais dão acesso total a qualquer usuário autenticado — se quiser travar também no
banco, dá para escrever políticas por perfil numa próxima etapa.
