const rupiahFormatter = new Intl.NumberFormat('id-ID');

export function formatRupiah(amount: number): string {
  return `Rp${rupiahFormatter.format(amount)}`;
}
