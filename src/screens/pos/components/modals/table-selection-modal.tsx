import DialogCloseButton from "@/components/common/dialog-close-button";
import TableSymbol, { type TableSeatCount } from "@/components/table-symbol";
import type { POSTable } from "@/types/pos";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Card, Chip, Dialog, ScrollShadow, Separator, useThemeColor } from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import { useState } from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { ScrollView as GestureScrollView } from "react-native-gesture-handler";

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

interface TableSelectionModalProps {
  tables: POSTable[];
  selectedTable?: POSTable;
  onSelect: (tableId: string | null) => void;
}

export default function TableSelectionModal({
  tables,
  selectedTable,
  onSelect,
}: TableSelectionModalProps) {
  const { width, height } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(false);
  const [activeAreaId, setActiveAreaId] = useState("");
  const [accent, muted, accentSoft] = useThemeColor(["accent", "muted", "accent-soft"]);
  const groups = groupTablesByArea(tables);
  const resolvedAreaId = groups.some((group) => group.id === activeAreaId)
    ? activeAreaId
    : (groups[0]?.id ?? "");
  const filteredTables = groups.find((group) => group.id === resolvedAreaId)?.tables ?? [];
  const cardWidth = width < 600 ? "48%" : "31.5%";

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) setActiveAreaId(selectedTable?.area_id ?? groups[0]?.id ?? "");
  };

  const handleSelect = (tableId: string | null) => {
    onSelect(tableId);
    setIsOpen(false);
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={handleOpenChange} className="h-12">
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          className="min-w-28 flex-1 justify-between"
          accessibilityLabel={
            selectedTable ? `Change table, currently ${selectedTable.name}` : "Select table"
          }
        >
          <Button.Label className="text-sm" numberOfLines={1}>
            {selectedTable?.name ?? "Table"}
          </Button.Label>
          <Ionicons name="grid-outline" size={16} color={muted} />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          isSwipeable={false}
          accessibilityLabel="Select Table"
          className="w-full max-w-3xl self-center overflow-hidden bg-background p-0"
          style={{
            width: Math.min(width * 0.9, 680),
            height: Math.min(height * 0.86, 920),
          }}
        >
          <DialogCloseButton />
          <View className="bg-surface px-5 py-4 pr-14">
            <Dialog.Title>Select Table</Dialog.Title>
          </View>

          <View className="flex-1 gap-4 px-5 pt-4">
            <ScrollShadow
              orientation="horizontal"
              size={32}
              LinearGradientComponent={LinearGradient}
            >
              <GestureScrollView
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
              </GestureScrollView>
            </ScrollShadow>

            {filteredTables.length > 0 ? (
              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerClassName="flex-row flex-wrap items-center gap-4 pb-2"
              >
                {filteredTables.map((table) => {
                  const isSelected = table.id === selectedTable?.id;
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
                        <Card.Body className="flex-row items-center justify-between">
                          <Chip color={isSelected ? "accent" : "default"}>
                            <Chip.Label numberOfLines={1}>{table.name}</Chip.Label>
                          </Chip>
                          <Chip color={isSelected ? "accent" : "default"}>
                            <Chip.Label numberOfLines={1}>
                              {Number(table.pax)} {Number(table.pax) === 1 ? "seat" : "seats"}
                            </Chip.Label>
                          </Chip>
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

          <View className="flex-row gap-3 bg-surface p-4">
            <Button variant="ghost" onPress={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" onPress={() => handleSelect(null)} className="flex-1">
              No Table
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
