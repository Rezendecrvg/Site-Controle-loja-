// src/lib/date-utils.ts
// Utilitários de data no fuso horário de Brasília (America/Sao_Paulo).
//
// Por que isso existe: o Supabase grava timestamps em UTC. Brasília é
// UTC-3, então depois das 21h (horário local) o UTC já virou o dia
// seguinte. Se a gente agrupar/gerar datas usando UTC (ex: `.slice(0,10)`
// direto no ISO string, ou `CURRENT_DATE` do Postgres), vendas feitas à
// noite acabam aparecendo no dia errado no relatório.

const FUSO_LOJA = "America/Sao_Paulo";

/**
 * Converte um timestamp (string ISO ou Date) para "YYYY-MM-DD" no
 * fuso horário da loja (Brasília), não em UTC.
 */
export function dataLocalISO(valor: string | Date): string {
  const data = typeof valor === "string" ? new Date(valor) : valor;

  const formatado = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_LOJA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);

  // "en-CA" já formata como YYYY-MM-DD
  return formatado;
}

/**
 * Retorna a data/hora de "agora" no fuso da loja, como "YYYY-MM-DD".
 */
export function hojeLocalISO(): string {
  return dataLocalISO(new Date());
}

/**
 * Retorna o instante (ISO UTC) correspondente à meia-noite de HOJE
 * no fuso horário da loja. Útil pra filtros tipo `.gte("data", ...)`.
 */
export function inicioDoDiaLocalISO(): string {
  // Pega a data local (YYYY-MM-DD) e monta a meia-noite considerando
  // o offset de Brasília (-03:00). Isso funciona também durante
  // qualquer período de horário de verão que venha a existir.
  const hoje = hojeLocalISO();
  const offset = obterOffsetAtual();
  return `${hoje}T00:00:00${offset}`;
}

/**
 * Retorna o intervalo (ISO) de um dia específico "YYYY-MM-DD" no fuso da
 * loja: do primeiro ao último instante do dia. Útil pra filtrar vendas e
 * movimentações de uma data escolhida no calendário.
 */
export function intervaloDoDiaLocalISO(dia: string): { inicio: string; fim: string } {
  const offset = obterOffsetAtual();
  return {
    inicio: `${dia}T00:00:00${offset}`,
    fim: `${dia}T23:59:59.999${offset}`,
  };
}

function obterOffsetAtual(): string {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO_LOJA,
    timeZoneName: "shortOffset",
  }).formatToParts(new Date());

  const tz = partes.find((p) => p.type === "timeZoneName")?.value ?? "GMT-3";
  // tz vem tipo "GMT-3" ou "GMT-03:00" dependendo do ambiente; normaliza pra "-03:00"
  const match = tz.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return "-03:00";
  const [, sinal, h, m = "00"] = match;
  return `${sinal}${h.padStart(2, "0")}:${m}`;
}

/**
 * Formata "YYYY-MM-DD" pra exibição em pt-BR, sem risco de o
 * `new Date("YYYY-MM-DD")` interpretar como UTC e "voltar" um dia.
 */
export function formatarDataBR(isoDate: string, options?: Intl.DateTimeFormatOptions): string {
  const [ano, mes, dia] = isoDate.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia); // cria em horário LOCAL do navegador, sem UTC shift
  return data.toLocaleDateString("pt-BR", options);
}
