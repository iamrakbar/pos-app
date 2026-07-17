import type { ReceiptSettings } from "@/stores/useReceiptStore";
import { formatRupiah } from "@/utils/format";
import type { JSX } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";

export type ReceiptPreviewData = {
  code: string;
  date: string;
  orderType: string;
  table?: string | null;
  payment: string;
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
  fees: Array<{ id: string; name: string; amount: number }>;
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

function DashedLine(): JSX.Element {
  return (
    <Text style={[styles.small, { color: "#a3a3a3" }]}>
      ------------------------------------------
    </Text>
  );
}

function PriceRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <View className="flex-row justify-between gap-4">
      <Text style={[styles.text, bold && { fontWeight: "700", fontSize: 14 }]}>{label}</Text>
      <Text style={[styles.text, bold && { fontWeight: "700", fontSize: 14 }]}>
        {formatRupiah(value)}
      </Text>
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text style={styles.small}>{label}</Text>
      <Text style={[styles.small, { flex: 1, textAlign: "right" }]}>{value}</Text>
    </View>
  );
}

export function ReceiptPaper({
  settings,
  data,
}: {
  settings: ReceiptSettings;
  data: ReceiptPreviewData;
}): JSX.Element {
  const headerLines = settings.header
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const totalQty = data.items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <View className="w-full max-w-md self-center bg-white px-6 py-7">
      {settings.storeLogo ? (
        <Image
          source={{ uri: settings.storeLogo }}
          className="w-40 h-20 self-center mb-3"
          resizeMode="contain"
        />
      ) : null}
      <Text style={[styles.text, { fontSize: 16, fontWeight: "700", textAlign: "center" }]}>
        {settings.storeName || "Store name"}
      </Text>
      {headerLines.map((line, index) => (
        <Text key={`${line}-${index}`} style={[styles.small, { textAlign: "center" }]}>
          {line}
        </Text>
      ))}

      <View className="my-3">
        <DashedLine />
      </View>

      <View className="gap-0.5">
        <MetaRow label="Order" value={data.code} />
        <MetaRow label="Date" value={data.date} />
        <MetaRow label="Type" value={data.orderType} />
        {data.table ? <MetaRow label="Table" value={data.table} /> : null}
        <MetaRow label="Payment" value={data.payment} />
      </View>

      <View className="my-3">
        <DashedLine />
      </View>

      <View className="gap-3">
        {data.items.map((item) => (
          <View key={item.id}>
            <View className="flex-row justify-between gap-3">
              <Text style={[styles.text, { flex: 1, fontWeight: "700" }]}>{item.name}</Text>
              <Text style={[styles.text, { fontWeight: "700" }]}>
                {formatRupiah(item.subtotal)}
              </Text>
            </View>
            <Text style={styles.small}>
              {item.qty} x {formatRupiah(item.price)}
            </Text>
            {item.addOns.map((option) => (
              <View key={option.id} className="flex-row justify-between gap-3 pl-2">
                <Text style={[styles.small, { flex: 1 }]}>
                  + {option.group}: {option.name}
                </Text>
                <Text style={styles.small}>
                  {option.price > 0 ? formatRupiah(option.price) : ""}
                </Text>
              </View>
            ))}
            {item.notes ? (
              <Text style={[styles.small, { fontStyle: "italic" }]}>Note: {item.notes}</Text>
            ) : null}
          </View>
        ))}
      </View>

      <View className="my-3">
        <DashedLine />
      </View>

      <View className="gap-1">
        <PriceRow label="Subtotal" value={data.subtotal} />
        {data.fees.map((fee) => (
          <PriceRow key={fee.id} label={fee.name} value={fee.amount} />
        ))}
        <Text style={styles.small}>
          {data.items.length} items · {totalQty} qty
        </Text>
        <View className="mt-2">
          <PriceRow label="Total" value={data.total} bold />
        </View>
      </View>

      {data.notes ? (
        <View className="mt-3">
          <DashedLine />
          <Text style={[styles.small, { marginTop: 8 }]}>Note: {data.notes}</Text>
        </View>
      ) : null}

      {settings.footer ? (
        <Text style={[styles.text, { marginTop: 18, textAlign: "center" }]}>{settings.footer}</Text>
      ) : null}
    </View>
  );
}
