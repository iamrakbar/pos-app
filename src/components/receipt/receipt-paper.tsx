import type { ReceiptSettings } from "@/stores/use-receipt-store";
import type { PaperWidth } from "@/stores/use-printer-store";
import { formatRupiah } from "@/utils/format";
import { formatReceiptRow, wrapReceiptText } from "@/services/printer/escpos";
import { Image } from "expo-image";
import type { JSX } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

export type ReceiptPreviewData = {
  code: string;
  date: string;
  orderType: string;
  table?: string | null;
  payment: string;
  paymentStatus: string;
  items: {
    id: string;
    name: string;
    qty: number;
    price: number;
    originalPrice: number | null;
    discountLabel: string | null;
    discountAmount: number;
    subtotal: number;
    addOns: { id: string; group: string; name: string; price: number }[];
    notes?: string | null;
  }[];
  subtotal: number;
  discounts: { id: string; name: string; amount: number }[];
  fees: { id: string; name: string; amount: number }[];
  tax?: { name: string; amount: number } | null;
  total: number;
  notes?: string | null;
};

const styles = StyleSheet.create({
  text: {
    color: "#171717",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    lineHeight: 17,
  },
  small: {
    color: "#525252",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 10,
    lineHeight: 15,
  },
});

function ReceiptLines({
  lines,
  align = "left",
  bold = false,
}: {
  lines: string[];
  align?: "left" | "center" | "right";
  bold?: boolean;
}): JSX.Element {
  const occurrences = new Map<string, number>();

  return (
    <>
      {lines.map((value) => {
        const occurrence = occurrences.get(value) ?? 0;
        occurrences.set(value, occurrence + 1);
        return (
          <Text
            key={`${value}-${occurrence}`}
            style={[styles.text, { textAlign: align }, bold && { fontWeight: "700" }]}
          >
            {value}
          </Text>
        );
      })}
    </>
  );
}

export function ReceiptPaper({
  settings,
  data,
  paperWidth = "58mm",
  charactersPerLine,
}: {
  settings: ReceiptSettings;
  data: ReceiptPreviewData;
  paperWidth?: PaperWidth;
  charactersPerLine?: string;
}): JSX.Element {
  const { t } = useTranslation();
  const headerLines = settings.header
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const totalQty = data.items.reduce((sum, item) => sum + item.qty, 0);
  const isKitchen = settings.layout === "kitchen";
  const isCompact = settings.layout === "compact";
  const fallbackColumns = paperWidth === "80mm" ? 46 : 32;
  const parsedColumns = Number(charactersPerLine);
  const columns =
    Number.isInteger(parsedColumns) && parsedColumns >= 24 && parsedColumns <= 64
      ? parsedColumns
      : fallbackColumns;
  const separator = "-".repeat(columns);
  const gapClass = isCompact ? "h-0" : "h-[17px]";
  const wrapped = (value: string) => wrapReceiptText(value, columns);
  const row = (left: string, right: string) => formatReceiptRow(left, right, columns);

  return (
    <View
      className={`max-w-full self-center items-center bg-white ${isCompact ? "py-6" : "py-10"}`}
      style={{ width: paperWidth === "58mm" ? 300 : 400 }}
    >
      {!isKitchen && settings.storeLogo ? (
        <Image
          source={{ uri: settings.storeLogo }}
          style={{ width: 160, height: 80, alignSelf: "center", marginBottom: 20 }}
          contentFit="contain"
        />
      ) : null}
      <ReceiptLines lines={[settings.storeName || t("receipt.storeName")]} align="center" bold />
      {!isKitchen
        ? headerLines.map((value) => (
            <ReceiptLines key={value} lines={wrapped(value)} align="center" />
          ))
        : null}
      <View className={gapClass} />
      <ReceiptLines lines={[separator]} />
      <View className={gapClass} />
      <ReceiptLines lines={wrapped(`${t("receipt.order")}: ${data.code}`)} />
      <ReceiptLines lines={wrapped(`${t("receipt.date")}: ${data.date}`)} />
      <ReceiptLines lines={wrapped(`${t("receipt.type")}: ${data.orderType}`)} />
      {data.table ? <ReceiptLines lines={wrapped(`${t("receipt.table")}: ${data.table}`)} /> : null}
      {!isKitchen ? (
        <ReceiptLines lines={wrapped(`${t("receipt.payment")}: ${data.payment}`)} />
      ) : null}
      {!isKitchen ? (
        <ReceiptLines lines={wrapped(`${t("receipt.paymentStatus")}: ${data.paymentStatus}`)} />
      ) : null}
      <View className={gapClass} />
      <ReceiptLines lines={[separator]} />
      <View className={gapClass} />

      <View>
        {data.items.map((item, itemIndex) => (
          <View key={item.id}>
            <ReceiptLines lines={wrapped(item.name)} />
            <ReceiptLines
              lines={[
                row(
                  `${item.qty} x ${formatRupiah(item.originalPrice ?? item.price)}`,
                  formatRupiah((item.originalPrice ?? item.price) * item.qty)
                ),
              ]}
            />
            {item.discountLabel && item.discountAmount > 0 ? (
              <ReceiptLines
                lines={[row(item.discountLabel, `-${formatRupiah(item.discountAmount)}`)]}
              />
            ) : null}
            {item.addOns.map((option) => (
              <ReceiptLines
                key={option.id}
                lines={[
                  row(
                    `+ ${option.group}: ${option.name}`,
                    option.price > 0 ? formatRupiah(option.price * item.qty) : ""
                  ),
                ]}
              />
            ))}
            {item.notes ? (
              <ReceiptLines lines={wrapped(`${t("receipt.note")}: ${item.notes}`)} />
            ) : null}
            {!isCompact && itemIndex < data.items.length - 1 ? <View className="h-[17px]" /> : null}
          </View>
        ))}
      </View>

      {!isKitchen ? (
        <>
          <View className={gapClass} />
          <ReceiptLines lines={[separator]} />
          <View className={gapClass} />
        </>
      ) : null}

      {!isKitchen ? (
        <View>
          <ReceiptLines lines={[row(t("receipt.subtotal"), formatRupiah(data.subtotal))]} />
          {data.discounts.map((discount) => (
            <ReceiptLines
              key={discount.id}
              lines={[row(discount.name, `-${formatRupiah(discount.amount)}`)]}
            />
          ))}
          {data.fees.map((fee) => (
            <ReceiptLines key={fee.id} lines={[row(fee.name, formatRupiah(fee.amount))]} />
          ))}
          {data.tax ? (
            <ReceiptLines lines={[row(data.tax.name, formatRupiah(data.tax.amount))]} />
          ) : null}
          <View className={gapClass} />
          <ReceiptLines
            lines={wrapped(
              t("receipt.itemsSummary", {
                items: data.items.length,
                quantity: totalQty,
              })
            )}
          />
          <View className={gapClass} />
          <ReceiptLines lines={[row(t("receipt.total"), formatRupiah(data.total))]} bold />
        </View>
      ) : null}

      {data.notes ? (
        <>
          <View className="h-[17px]" />
          <ReceiptLines lines={wrapped(`${t("receipt.note")}: ${data.notes}`)} />
        </>
      ) : null}

      {!isKitchen && settings.footer ? (
        <>
          <View className={gapClass} />
          <ReceiptLines lines={[separator]} />
          <View className="h-[17px]" />
          <ReceiptLines lines={wrapped(settings.footer)} align="center" />
        </>
      ) : null}
    </View>
  );
}
