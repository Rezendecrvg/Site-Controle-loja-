import { redirect } from "next/navigation";

// Redireciona qualquer acesso a /caixa para a aba Caixa dentro do PDV unificado
export default function CaixaRedirect() {
  redirect("/ponto-venda?aba=caixa");
}
