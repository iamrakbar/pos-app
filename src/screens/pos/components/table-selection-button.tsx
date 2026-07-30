import type { POSTable } from "@/types/pos";
import AppIcon from "@/components/common/app-icon";
import { useRouter } from "expo-router";
import { Button, useThemeColor } from "heroui-native";
import type { JSX } from "react";
import { useTranslation } from "@/stores/use-locale";

type TableSelectionButtonProps = {
  selectedTable?: POSTable;
};

export default function TableSelectionButton({
  selectedTable,
}: TableSelectionButtonProps): JSX.Element {
  const router = useRouter();
  const { t } = useTranslation();
  const colorAccent = useThemeColor("accent");

  return (
    <Button
      variant="secondary"
      size="sm"
      className="min-w-24 flex-1 items-center justify-between"
      onPress={() => router.push("/pos/table-selection")}
      accessibilityLabel={
        selectedTable
          ? t("pos.changeTableAccessibility", { table: selectedTable.name })
          : t("pos.selectTable")
      }
    >
      <Button.Label className="text-sm" numberOfLines={1}>
        {selectedTable?.name ?? t("pos.table")}
      </Button.Label>
      <AppIcon name="restaurant-outline" size={16} color={colorAccent} />
    </Button>
  );
}
