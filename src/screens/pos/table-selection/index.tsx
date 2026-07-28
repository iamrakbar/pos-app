import TableSymbol, { type TableSeatCount } from "@/components/table-symbol";
import { useTables } from "@/hooks/db/use-tables";
import { usePOSStore } from "@/stores/use-pos-store";
import type { POSTable } from "@/types/pos";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { Button, Card, Chip, ScrollShadow, Typography, useThemeColor } from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import type { JSX } from "react";
import { useState } from "react";
import { FlatList, Pressable, View } from "react-native";

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
  const [accent, muted, accentSoft] = useThemeColor([
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
  const cardWidth = gridWidth > 0 ? gridWidth / columnCount - 12 : "48%";

  const handleSelect = (tableId: string | null) => {
    updateCheckoutForm({ table_id: tableId });
    router.back();
  };

  const renderArea = ({ item: group }: { item: (typeof groups)[number] }) => (
    <Chip
      variant={resolvedAreaId === group.id ? "primary" : "secondary"}
      onPress={() => setActiveAreaId(group.id)}
    >
      <Chip.Label>{group.name}</Chip.Label>
    </Chip>
  );

  const renderTable = ({ item: table }: { item: POSTable }) => {
    const isSelected = table.id === selectedTableId;
    const seatCount = getTableSeatCount(Number(table.pax));

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Select ${table.name}, ${table.pax} seats`}
        accessibilityState={{ selected: isSelected }}
        onPress={() => handleSelect(table.id)}
        style={{ width: cardWidth, margin: 6 }}
      >
        <Card variant={isSelected ? "default" : "secondary"} className="gap-2">
          <Card.Header className="h-20 items-center justify-center py-0">
            <TableSymbol
              seats={seatCount}
              scale={0.5}
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
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Button
              variant="outline"
              size="sm"
              onPress={() => handleSelect(null)}
              accessibilityLabel="Continue without selecting a table"
            >
              <Button.Label>No Table</Button.Label>
            </Button>
          ),
        }}
      />
      <View className="flex-1 overflow-hidden bg-background pb-safe">
        <View className="flex-1 gap-4 px-4 pt-4">
          <ScrollShadow orientation="horizontal" size={32} LinearGradientComponent={LinearGradient}>
            <FlatList
              data={groups}
              horizontal
              keyExtractor={(group) => group.id}
              renderItem={renderArea}
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 pb-1"
            />
          </ScrollShadow>

          {filteredTables.length > 0 ? (
            <FlatList
              key={`table-grid-${columnCount}`}
              className="flex-1"
              data={filteredTables}
              numColumns={columnCount}
              keyExtractor={(table) => table.id}
              renderItem={renderTable}
              showsVerticalScrollIndicator={false}
              contentContainerClassName="pb-4"
              columnWrapperClassName="items-center"
              onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
            />
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
      </View>
    </>
  );
}
