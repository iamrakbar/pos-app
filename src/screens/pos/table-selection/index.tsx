import TableSymbol, { type TableSeatCount } from "@/components/table-symbol";
import { useTables } from "@/hooks/db/use-tables";
import { usePOSStore } from "@/stores/use-pos-store";
import type { POSTable } from "@/types/pos";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Button,
  Card,
  Chip,
  ScrollShadow,
  Separator,
  Typography,
  useThemeColor,
} from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import type { JSX } from "react";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

function groupTablesByArea(tables: POSTable[]) {
  const groups = new Map<string, { id: string; name: string; tables: POSTable[] }>();

  tables.forEach((table) => {
    const existingGroup = groups.get(table.area_id);
    if (existingGroup) {
      existingGroup.tables.push(table);
    } else {
      groups.set(table.area_id, {
        id: table.area_id,
        name: table.area_name,
        tables: [table],
      });
    }
  });

  return Array.from(groups.values());
}

function getTableSeatCount(pax: number): TableSeatCount {
  return Math.max(1, Math.min(8, Math.round(pax))) as TableSeatCount;
}

export default function TableSelectionScreen(): JSX.Element {
  const router = useRouter();
  const [activeAreaId, setActiveAreaId] = useState("");
  const [gridWidth, setGridWidth] = useState(0);
  const [accent, muted, accentSoft, foreground] = useThemeColor([
    "accent",
    "muted",
    "accent-soft",
    "foreground",
  ]);
  const { data: tables = [] } = useTables();
  const selectedTableId = usePOSStore((state) => state.checkoutForm.table_id);
  const updateCheckoutForm = usePOSStore((state) => state.updateCheckoutForm);
  const groups = groupTablesByArea(tables);
  const selectedTable = tables.find((table) => table.id === selectedTableId);
  const resolvedAreaId = groups.some((group) => group.id === activeAreaId)
    ? activeAreaId
    : (selectedTable?.area_id ?? groups[0]?.id ?? "");
  const filteredTables = groups.find((group) => group.id === resolvedAreaId)?.tables ?? [];
  const columnCount = gridWidth >= 520 ? 3 : 2;
  const cardWidth = gridWidth > 0 ? (gridWidth - (columnCount - 1) * 12) / columnCount : "48%";

  const handleSelect = (tableId: string | null) => {
    updateCheckoutForm({ table_id: tableId });
    router.back();
  };

  return (
    <View className="flex-1 overflow-hidden bg-background pb-safe">
      <View className="flex-row items-center justify-between gap-3 bg-surface px-5 py-4">
        <Typography type="h4" weight="semibold">
          Select Table
        </Typography>
        <Button
          variant="ghost"
          isIconOnly
          onPress={() => router.back()}
          accessibilityLabel="Close table selection"
        >
          <Ionicons name="close" size={20} color={foreground} />
        </Button>
      </View>

      <Separator />

      <View className="flex-1 gap-4 px-4 pt-4">
        <ScrollShadow orientation="horizontal" size={32} LinearGradientComponent={LinearGradient}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 pb-1"
          >
            {groups.map((group) => (
              <Chip
                key={group.id}
                variant={resolvedAreaId === group.id ? "primary" : "secondary"}
                onPress={() => setActiveAreaId(group.id)}
              >
                <Chip.Label>{group.name}</Chip.Label>
              </Chip>
            ))}
          </ScrollView>
        </ScrollShadow>

        {filteredTables.length > 0 ? (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerClassName="flex-row flex-wrap items-center gap-3 pb-4"
            onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
          >
            {filteredTables.map((table) => {
              const isSelected = table.id === selectedTableId;
              const seatCount = getTableSeatCount(Number(table.pax));

              return (
                <Pressable
                  key={table.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${table.name}, ${table.pax} seats`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => handleSelect(table.id)}
                  style={{ width: cardWidth }}
                >
                  <Card variant={isSelected ? "default" : "secondary"} className="gap-2">
                    <Card.Header className="flex-1 items-center justify-center py-2">
                      <TableSymbol
                        key={`${table.id}-${seatCount}`}
                        seats={seatCount}
                        width={96}
                        height={76}
                        color={isSelected ? accent : muted}
                        tableColor={isSelected ? accentSoft : undefined}
                      />
                    </Card.Header>
                    <Card.Body className="items-center gap-2">
                      <Chip color={isSelected ? "accent" : "default"}>
                        <Chip.Label numberOfLines={1}>{table.name}</Chip.Label>
                      </Chip>
                      <Typography type="body-xs" color="muted" className="tabular-nums">
                        {Number(table.pax)} {Number(table.pax) === 1 ? "seat" : "seats"}
                      </Typography>
                    </Card.Body>
                  </Card>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <EmptyState className="flex-1 justify-center">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <Ionicons name="grid-outline" size={20} color={muted} />
              </EmptyState.Media>
              <EmptyState.Title>No tables</EmptyState.Title>
              <EmptyState.Description>There are no tables in this area.</EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        )}
      </View>

      <Separator />

      <View className="flex-row gap-3 bg-surface px-5 py-4">
        <Button variant="ghost" onPress={() => router.back()}>
          Cancel
        </Button>
        <Button variant="outline" onPress={() => handleSelect(null)} className="flex-1">
          No Table
        </Button>
      </View>
    </View>
  );
}
