import { useCSSVariable } from "uniwind";
import type { POSTable } from "@/types/pos";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useRouter } from "expo-router";
import { Button, Typography } from "panelui-native";
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
  const colorAccent = useCSSVariable("--color-primary") as string;

  return (
    <Button
      variant="outline"
      size="md"
      className="h-12 min-w-0 flex-1"
      startContent={<AppIcon icon={AppIcons.diningTable} size={18} color={colorAccent} />}
      onPress={() => router.push("/pos/table-selection")}
      accessibilityLabel={
        selectedTable
          ? t("pos.changeTableAccessibility", { table: selectedTable.name })
          : t("pos.selectTable")
      }
    >
      <Typography type="body-sm" numberOfLines={1} className="min-w-0 flex-1">
        {selectedTable?.name ?? t("pos.table")}
      </Typography>
    </Button>
  );
}
