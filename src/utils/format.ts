export function formatRupiah(amount: number): string {
  return `Rp${new Intl.NumberFormat('id-ID').format(amount)}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
