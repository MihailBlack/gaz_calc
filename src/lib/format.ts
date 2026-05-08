export function formatMoneyMln(value: number): string {
  return `${(value / 1e6).toFixed(2)} млн руб`;
}

export function formatRub(value: number): string {
  return `${value.toFixed(2)} руб`;
}
