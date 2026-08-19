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

const ID_LOCALE = "id-ID";

function toDate(value: string | Date): Date {
  return typeof value === "string" ? new Date(value) : value;
}

export function formatDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }
): string {
  return toDate(value).toLocaleDateString(ID_LOCALE, options);
}

export function formatTime(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
): string {
  return toDate(value).toLocaleTimeString(ID_LOCALE, { ...options, hour12: false });
}

export function formatDateTime(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  return toDate(value).toLocaleString(ID_LOCALE, { ...options, hour12: false });
}
