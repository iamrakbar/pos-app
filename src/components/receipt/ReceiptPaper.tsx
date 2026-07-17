import type { ReceiptSettings } from "@/stores/useReceiptStore";
import type { PaperWidth } from "@/stores/usePrinterStore";
import { formatRupiah } from "@/utils/format";
import { formatReceiptRow, wrapReceiptText } from "@/services/printer/escpos";
import type { JSX } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";

export type ReceiptPreviewData = {
    code: string;
    date: string;
    orderType: string;
    table?: string | null;
    payment: string;
    paymentStatus: string;
    items: Array<{
        id: string;
        name: string;
        qty: number;
        price: number;
        subtotal: number;
        addOns: Array<{ id: string; group: string; name: string; price: number }>;
        notes?: string | null;
    }>;
    subtotal: number;
    discounts: Array<{ id: string; name: string; amount: number }>;
    fees: Array<{ id: string; name: string; amount: number }>;
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
    return (
        <>
            {lines.map((value, index) => (
                <Text
                    key={`${value}-${index}`}
                    style={[styles.text, { textAlign: align }, bold && { fontWeight: "700" }]}
                >
                    {value}
                </Text>
            ))}
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
            className={`max-w-full self-center bg-white px-[32] ${isCompact ? "py-6" : "py-10"}`}
            style={{ width: paperWidth === "58mm" ? 300 : 400 }}
        >
            {!isKitchen && settings.storeLogo ? (
                <Image
                    source={{ uri: settings.storeLogo }}
                    className="w-40 h-20 self-center mb-5"
                    resizeMode="contain"
                />
            ) : null}
            <ReceiptLines lines={[settings.storeName || "Store name"]} align="center" bold />
            {!isKitchen
                ? headerLines.map((value) => (
                    <ReceiptLines key={value} lines={wrapped(value)} align="center" />
                ))
                : null}
            <View className={gapClass} />
            <ReceiptLines lines={[separator]} />
            <View className={gapClass} />
            <ReceiptLines lines={wrapped(`Order: ${data.code}`)} />
            <ReceiptLines lines={wrapped(`Date: ${data.date}`)} />
            <ReceiptLines lines={wrapped(`Type: ${data.orderType}`)} />
            {data.table ? <ReceiptLines lines={wrapped(`Table: ${data.table}`)} /> : null}
            {!isKitchen ? <ReceiptLines lines={wrapped(`Payment: ${data.payment}`)} /> : null}
            {!isKitchen ? (
                <ReceiptLines lines={wrapped(`Payment status: ${data.paymentStatus}`)} />
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
                                row(`${item.qty} x ${formatRupiah(item.price)}`, formatRupiah(item.subtotal)),
                            ]}
                        />
                        {item.addOns.map((option) => (
                            <ReceiptLines
                                key={option.id}
                                lines={[
                                    row(
                                        `+ ${option.group}: ${option.name}`,
                                        option.price > 0 ? formatRupiah(option.price) : ""
                                    ),
                                ]}
                            />
                        ))}
                        {item.notes ? <ReceiptLines lines={wrapped(`Note: ${item.notes}`)} /> : null}
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
                    <ReceiptLines lines={[row("Subtotal", formatRupiah(data.subtotal))]} />
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
                    <ReceiptLines lines={wrapped(`${data.items.length} items - ${totalQty} qty`)} />
                    <View className={gapClass} />
                    <ReceiptLines lines={[row("TOTAL", formatRupiah(data.total))]} bold />
                </View>
            ) : null}

            {data.notes ? (
                <>
                    <View className="h-[17px]" />
                    <ReceiptLines lines={wrapped(`Note: ${data.notes}`)} />
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
