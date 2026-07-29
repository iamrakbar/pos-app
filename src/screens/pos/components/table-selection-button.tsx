import type { POSTable } from "@/types/pos";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, useThemeColor } from "heroui-native";
import type { JSX } from "react";

type TableSelectionButtonProps = {
  selectedTable?: POSTable;
};

export default function TableSelectionButton({
  selectedTable,
}: TableSelectionButtonProps): JSX.Element {
  const router = useRouter();
  const colorAccent = useThemeColor("accent");

  return (
    <Button
      variant="secondary"
      className="min-w-28 flex-1 justify-between"
      onPress={() => router.push("/pos/table-selection")}
      accessibilityLabel={
        selectedTable ? `Change table, currently ${selectedTable.name}` : "Select table"
      }
    >
      <Button.Label className="text-sm" numberOfLines={1}>
        {selectedTable?.name ?? "Table"}
      </Button.Label>
      <Ionicons name="grid-outline" size={16} color={colorAccent} />
    </Button>
  );
}
