export const IDR_CURRENCY_FORMAT_OPTIONS = {
  style: "currency",
  currency: "IDR",
  currencyDisplay: "symbol",
  currencySign: "standard",
  useGrouping: true,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
} satisfies Intl.NumberFormatOptions;

const rupiahFormatter = new Intl.NumberFormat("id-ID", IDR_CURRENCY_FORMAT_OPTIONS);

export function formatRupiah(amount: number): string {
  return rupiahFormatter.format(amount);
}
