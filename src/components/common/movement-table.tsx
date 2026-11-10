import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import TableHeadings from "@/components/common/table-headings";
import type { TranslationKey } from "@/locales";
import { useTranslation } from "@/stores/use-locale";
import {
  formatDateTime,
  formatInventoryQuantity,
  formatRupiah,
  normalizeInventorySource,
} from "@/utils/format";
import {
  MOVEMENT_TYPE_COLORS,
  MOVEMENT_TABLE_COLUMNS,
  formatSignedQuantity,
} from "@/utils/inventory-movement-table";
import { Chip, EmptyState, Table, Typography } from "panelui-native";
import { useCSSVariable } from "uniwind";

const MOVEMENT_HEADINGS = [
  "movements.type",
  "movements.quantity",
  "movements.balanceAfter",
  "movements.costPerUnit",
  "movements.source",
  "movements.reason",
  "movements.actor",
  "movements.movedAt",
] as const;

type MovementTableProps = {
  movements: App.Data.Merchant.Inventory.InventoryMovementData[];
  emptyTitle: string;
  emptyDescription: string;
  className?: string;
};

export default function MovementTable({
  movements,
  emptyTitle,
  emptyDescription,
  className,
}: MovementTableProps) {
  const { t } = useTranslation();
  const themeColorMuted = useCSSVariable("--color-muted-foreground") as string;
  return (
    <Table columns={MOVEMENT_TABLE_COLUMNS} className={className}>
      <TableHeadings columns={MOVEMENT_HEADINGS} />
      {movements.length ? (
        <Table.Body>
          {movements.map((movement) => (
            <Table.Row key={movement.id}>
              <Table.Cell>
                <Chip variant={MOVEMENT_TYPE_COLORS[movement.type]} size="sm">
                  {t(`movements.types.${movement.type}` as TranslationKey)}
                </Chip>
              </Table.Cell>
              <Table.Cell labelClassName="tabular-nums">
                {formatSignedQuantity(movement.quantity)}
              </Table.Cell>
              <Table.Cell labelClassName="tabular-nums">
                {formatInventoryQuantity(movement.balance_after)}
              </Table.Cell>
              <Table.Cell labelClassName="tabular-nums">
                {movement.cost_per_unit === null ? "—" : formatRupiah(movement.cost_per_unit)}
              </Table.Cell>
              <Table.Cell>
                <Chip variant="default" size="sm">
                  <Typography type="body-xs" numberOfLines={1}>
                    {normalizeInventorySource(movement.source)}
                  </Typography>
                </Chip>
              </Table.Cell>
              <Table.Cell>
                <Typography type="body-sm" numberOfLines={1}>
                  {movement.reason ?? "—"}
                </Typography>
              </Table.Cell>
              <Table.Cell>
                <Typography type="body-sm" numberOfLines={1}>
                  {movement.actor?.name ?? "—"}
                </Typography>
              </Table.Cell>
              <Table.Cell labelClassName="tabular-nums">
                {formatDateTime(movement.moved_at)}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      ) : (
        <Table.Empty>
          <EmptyState className="py-16">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <AppIcon icon={AppIcons.swapVertical} size={22} color={themeColorMuted} />
              </EmptyState.Media>
              <EmptyState.Title>{emptyTitle}</EmptyState.Title>
              <EmptyState.Description>{emptyDescription}</EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        </Table.Empty>
      )}
    </Table>
  );
}
