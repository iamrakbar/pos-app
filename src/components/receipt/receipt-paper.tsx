import type { ReceiptSettings } from "@/stores/use-receipt-store";
import type { PaperWidth } from "@/stores/use-printer-store";
import { formatRupiah } from "@/utils/format";
import { formatReceiptRow, wrapReceiptText } from "@/services/printer/escpos";
import { Image } from "expo-image";
import { forwardRef, type JSX } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";
import type { Translate } from "@/locales";
import { getReceiptLogoPreviewWidth } from "@/utils/receipt-logo-layout";

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

export type ReceiptPaperRef = View;

type ReceiptItem = ReceiptPreviewData["items"][number];

function ReceiptItemDiscount({
  item,
  row,
}: {
  item: ReceiptItem;
  row: (left: string, right: string) => string;
}): JSX.Element | null {
  if (!item.discountLabel || item.discountAmount <= 0) return null;

  return (
    <ReceiptLines lines={[row(item.discountLabel, `-${formatRupiah(item.discountAmount)}`)]} />
  );
}

function ReceiptItemAddOns({
  item,
  row,
}: {
  item: ReceiptItem;
  row: (left: string, right: string) => string;
}): JSX.Element {
  return (
    <>
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
    </>
  );
}

function ReceiptItemNote({
  item,
  wrapped,
  noteLabel,
}: {
  item: ReceiptItem;
  wrapped: (value: string) => string[];
  noteLabel: string;
}): JSX.Element | null {
  return item.notes ? <ReceiptLines lines={wrapped(`${noteLabel}: ${item.notes}`)} /> : null;
}

function ReceiptItemLines({
  item,
  isLast,
  isCompact,
  gapClass,
  wrapped,
  row,
  noteLabel,
}: {
  item: ReceiptItem;
  isLast: boolean;
  isCompact: boolean;
  gapClass: string;
  wrapped: (value: string) => string[];
  row: (left: string, right: string) => string;
  noteLabel: string;
}): JSX.Element {
  return (
    <View>
      <ReceiptLines lines={wrapped(item.name)} />
      <ReceiptLines
        lines={[
          row(
            `${item.qty} x ${formatRupiah(item.originalPrice ?? item.price)}`,
            formatRupiah((item.originalPrice ?? item.price) * item.qty)
          ),
        ]}
      />
      <ReceiptItemDiscount item={item} row={row} />
      <ReceiptItemAddOns item={item} row={row} />
      <ReceiptItemNote item={item} wrapped={wrapped} noteLabel={noteLabel} />
      {!isCompact && !isLast ? <View className="h-[17px]" /> : null}
    </View>
  );
}

function ReceiptTotals({
  data,
  gapClass,
  row,
  subtotalLabel,
  totalLabel,
}: {
  data: ReceiptPreviewData;
  gapClass: string;
  row: (left: string, right: string) => string;
  subtotalLabel: string;
  totalLabel: string;
}): JSX.Element {
  return (
    <View>
      <ReceiptLines lines={[row(subtotalLabel, formatRupiah(data.subtotal))]} />
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
      <ReceiptLines lines={[row(totalLabel, formatRupiah(data.total))]} bold />
    </View>
  );
}

function ReceiptHeaderBlock({
  settings,
  data,
  t,
  isKitchen,
  headerLines,
  gapClass,
  separator,
  wrapped,
  paperWidth,
  logoWidthDots,
}: {
  settings: ReceiptSettings;
  data: ReceiptPreviewData;
  t: Translate;
  isKitchen: boolean;
  headerLines: string[];
  gapClass: string;
  separator: string;
  wrapped: (value: string) => string[];
  paperWidth: PaperWidth;
  logoWidthDots?: string;
}): JSX.Element {
  return (
    <>
      {!isKitchen && settings.storeLogo ? (
        <Image
          source={{ uri: settings.storeLogo }}
          style={{
            width: getReceiptLogoPreviewWidth(paperWidth, logoWidthDots),
            height: 80,
            alignSelf: "center",
            marginBottom: 20,
          }}
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
    </>
  );
}

function ReceiptSummaryBlock({
  data,
  isKitchen,
  gapClass,
  separator,
  row,
  t,
}: {
  data: ReceiptPreviewData;
  isKitchen: boolean;
  gapClass: string;
  separator: string;
  row: (left: string, right: string) => string;
  t: Translate;
}): JSX.Element {
  return (
    <>
      {!isKitchen ? (
        <>
          <View className={gapClass} />
          <ReceiptLines lines={[separator]} />
          <View className={gapClass} />
        </>
      ) : null}
      {!isKitchen ? (
        <ReceiptTotals
          data={data}
          gapClass={gapClass}
          row={row}
          subtotalLabel={t("receipt.subtotal")}
          totalLabel={t("receipt.total")}
        />
      ) : null}
    </>
  );
}

function ReceiptNotesFooter({
  data,
  settings,
  isKitchen,
  gapClass,
  separator,
  wrapped,
  noteLabel,
}: {
  data: ReceiptPreviewData;
  settings: ReceiptSettings;
  isKitchen: boolean;
  gapClass: string;
  separator: string;
  wrapped: (value: string) => string[];
  noteLabel: string;
}): JSX.Element {
  return (
    <>
      {data.notes ? (
        <>
          <View className="h-[17px]" />
          <ReceiptLines lines={wrapped(`${noteLabel}: ${data.notes}`)} />
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
    </>
  );
}

export const ReceiptPaper = forwardRef<
  ReceiptPaperRef,
  {
    settings: ReceiptSettings;
    data: ReceiptPreviewData;
    paperWidth?: PaperWidth;
    charactersPerLine?: string;
    logoWidthDots?: string;
    widthOverride?: number;
  }
>(
  (
    { settings, data, paperWidth = "58mm", charactersPerLine, logoWidthDots, widthOverride },
    ref
  ): JSX.Element => {
    const { t } = useTranslation();
    const headerLines = settings.header
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
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
        ref={ref}
        collapsable={false}
        className={`max-w-full self-center items-center bg-white ${isCompact ? "py-6" : "py-10"}`}
        style={{ width: widthOverride ?? (paperWidth === "58mm" ? 300 : 400) }}
      >
        <ReceiptHeaderBlock
          settings={settings}
          data={data}
          t={t}
          isKitchen={isKitchen}
          headerLines={headerLines}
          gapClass={gapClass}
          separator={separator}
          wrapped={wrapped}
          paperWidth={paperWidth}
          logoWidthDots={logoWidthDots}
        />
        <View className={gapClass} />
        <ReceiptLines lines={[separator]} />
        <View className={gapClass} />

        <View>
          {data.items.map((item, itemIndex) => (
            <ReceiptItemLines
              key={item.id}
              item={item}
              isLast={itemIndex === data.items.length - 1}
              isCompact={isCompact}
              gapClass={gapClass}
              wrapped={wrapped}
              row={row}
              noteLabel={t("receipt.note")}
            />
          ))}
        </View>

        <ReceiptSummaryBlock
          data={data}
          isKitchen={isKitchen}
          gapClass={gapClass}
          separator={separator}
          row={row}
          t={t}
        />
        <ReceiptNotesFooter
          data={data}
          settings={settings}
          isKitchen={isKitchen}
          gapClass={gapClass}
          separator={separator}
          wrapped={wrapped}
          noteLabel={t("receipt.note")}
        />
      </View>
    );
  }
);

ReceiptPaper.displayName = "ReceiptPaper";
