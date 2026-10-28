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
      variant="secondary"
      size="sm"
      className="min-w-20 flex-1 items-center justify-between"
      onPress={() => router.push("/pos/table-selection")}
      accessibilityLabel={
        selectedTable
          ? t("pos.changeTableAccessibility", { table: selectedTable.name })
          : t("pos.selectTable")
      }
    >
      <AppIcon icon={AppIcons.diningTable} size={18} color={colorAccent} />
      <Typography type="body-sm" className="text-secondary-foreground" numberOfLines={1}>
        {selectedTable?.name ?? t("pos.table")}
      </Typography>
    </Button>
  );
}
