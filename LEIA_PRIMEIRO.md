# 🔔 Notificações Reais — Arquivos Corrigidos

## Por que não funcionava:
O `header.tsx` do seu projeto tinha as 3 notificações ("Estoque Mínimo",
"Garantia Vencendo", "OS Pronta") **escritas direto no código**, sem
nenhuma conexão com o Supabase. Por isso, não importava o que você
rodasse no banco — elas nunca iam mudar.

## O que foi corrigido:
1. `lib/notificacoes-service.ts` → criado do zero (não existia)
2. `components/layout/header.tsx` → reescrito pra buscar notificações
   reais do Supabase, com Realtime (atualiza na hora) + fallback de
   15s, marcar como lida, e deletar
3. `app/debug-notificacoes/page.tsx` → nome do arquivo corrigido
   (estava `page.tsx.tsx`, o Next.js não reconhecia a rota)
4. `ponto-venda/page.tsx` → agora chama `notificarVendaNova()` depois
   de toda venda finalizada
5. `estoque/page.tsx` → agora chama `notificarEstoqueBaixo()` quando
   uma movimentação deixa o produto no ou abaixo do estoque mínimo

## Onde colocar cada arquivo (copia por cima do que já existe):

```
Site loja/
  src/
    lib/
      notificacoes-service.ts          ← ARQUIVO NOVO
    components/
      layout/
        header.tsx                     ← SUBSTITUI
    app/
      debug-notificacoes/
        page.tsx                       ← SUBSTITUI (ou cria a pasta se não existir)
      ponto-venda/
        page.tsx                       ← Não incluído aqui, veja abaixo
      estoque/
        page.tsx                       ← Não incluído aqui, veja abaixo
```

⚠️ **`ponto-venda/page.tsx` e `estoque/page.tsx` não estão neste ZIP**
porque são arquivos grandes e só tiveram 2 trechos pequenos alterados.
Faça manualmente (é rápido):

### Em `ponto-venda/page.tsx`:
No topo do arquivo, onde já tem:
```typescript
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
```
Adiciona embaixo:
```typescript
import { notificarVendaNova } from "@/lib/notificacoes-service";
```

Depois, procura por `setVendaFinalizada(true);` (dentro da função
`finalizarVenda`) e adiciona ESTAS 2 LINHAS logo ANTES dela:
```typescript
const nomeCliente = clienteSelecionado?.nome || "Cliente de Balcão";
notificarVendaNova(nomeCliente, total, user.id);
```

### Em `estoque/page.tsx`:
No topo, adiciona:
```typescript
import { notificarEstoqueBaixo } from "@/lib/notificacoes-service";
```

Procura por `setDialogAberto(false);` (dentro de `handleSalvar`) e
adiciona ESTE BLOCO logo depois:
```typescript
// Se a movimentação deixou o estoque no ou abaixo do mínimo, notifica
if (produto) {
  const novaQuantidade = produto.quantidade + quantidadeComSinal;
  if (novaQuantidade <= produto.estoque_minimo) {
    notificarEstoqueBaixo(produto.nome, novaQuantidade, produto.estoque_minimo);
  }
}
```

## Depois de copiar tudo:

```bash
Ctrl + C
npm run dev
```

1. Faz login
2. Vai em `/ponto-venda`, faz uma venda de verdade
3. Clica no sino 🔔 → a notificação real deve aparecer na hora
4. Se quiser confirmar tudo pelo diagnóstico: `/debug-notificacoes`
