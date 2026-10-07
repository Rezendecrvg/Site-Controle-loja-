import { redirect } from "next/navigation";

// A antiga tela de "Registro de Vendas" virou a aba de venda dentro do
// Caixa / PDV unificado. Qualquer link antigo continua funcionando.
export default function VendasRedirect() {
  redirect("/ponto-venda");
}
