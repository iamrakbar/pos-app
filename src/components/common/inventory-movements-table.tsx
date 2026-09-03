import AppIcon from "@/components/common/app-icon";
import type { InventoryMovementType } from "@/api/endpoints/inventory-audit";
import type { TranslationKey } from "@/locales";
import { useTranslation } from "@/stores/use-locale";
import {
  formatDateTime,
  formatInventoryQuantity,
  formatRupiah,
  normalizeInventorySource,
} from "@/utils/format";
import { Chip, useThemeColor } from "heroui-native";
import { EmptyState, Table } from "heroui-native-pro";
import React from "react";

type Movement = App.Data.Merchant.Inventory.InventoryMovementData;

const MOVEMENT_TYPE_COLORS: Record<
  InventoryMovementType,
  "accent" | "success" | "warning" | "danger"
> = {
  opening: "success",
  purchase: "success",
  sale: "accent",
  reversal: "warning",
  adjustment: "accent",
  waste: "danger",
  damage: "danger",
  return: "warning",
};

function formatSignedQuantity(value: number): string {
  const quantity = formatInventoryQuantity(Math.abs(value));
  return value > 0 ? `+${quantity}` : value < 0 ? `-${quantity}` : quantity;
}

function MovementTypeChip({ type }: { type: InventoryMovementType }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Chip color={MOVEMENT_TYPE_COLORS[type]} size="sm" variant="soft">
      <Chip.Label>{t(`movements.types.${type}` as TranslationKey)}</Chip.Label>
    </Chip>
  );
}

function MovementSourceChip({ source }: { source: string }): React.JSX.Element {
  return (
    <Chip color="default" size="sm" variant="soft">
      <Chip.Label numberOfLines={1} ellipsizeMode="tail">
        {normalizeInventorySource(source)}
      </Chip.Label>
    </Chip>
  );
}

export default function InventoryMovementsTable({
  movements,
  emptyTitle,
  emptyDescription,
  variant,
}: {
  movements: Movement[];
  emptyTitle: string;
  emptyDescription: string;
  variant?: "secondary";
}): React.JSX.Element {
  const { t } = useTranslation();
  const [themeColorMuted] = useThemeColor(["muted"]);

  return (
    <Table variant={variant}>
      <Table.ScrollContainer className="w-full self-center">
        <Table.Content className="w-full">
          <Table.Header>
            <Table.Column id="type" width={140}>
              {t("movements.type")}
            </Table.Column>
            <Table.Column id="quantity" width={150}>
              {t("movements.quantity")}
            </Table.Column>
            <Table.Column id="balance_after" width={150}>
              {t("movements.balanceAfter")}
            </Table.Column>
            <Table.Column id="cost_per_unit" width={160}>
              {t("movements.costPerUnit")}
            </Table.Column>
            <Table.Column id="source" width={160}>
              {t("movements.source")}
            </Table.Column>
            <Table.Column id="reason" width={220}>
              {t("movements.reason")}
            </Table.Column>
            <Table.Column id="actor" width={170}>
              {t("movements.actor")}
            </Table.Column>
            <Table.Column id="moved_at" width={180}>
              {t("movements.movedAt")}
            </Table.Column>
          </Table.Header>
          <Table.Body
            items={movements}
            keyExtractor={(movement) => movement.id}
            renderEmptyState={() => (
              <EmptyState className="py-16">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <AppIcon name="swap-vertical-outline" size={22} color={themeColorMuted} />
                  </EmptyState.Media>
                  <EmptyState.Title>{emptyTitle}</EmptyState.Title>
                  <EmptyState.Description>{emptyDescription}</EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            )}
          >
            {(movement) => (
              <Table.Row id={movement.id}>
                <Table.Cell>
                  <MovementTypeChip type={movement.type} />
                </Table.Cell>
                <Table.Cell textProps={{ className: "tabular-nums" }}>
                  {formatSignedQuantity(movement.quantity)}
                </Table.Cell>
                <Table.Cell textProps={{ className: "tabular-nums" }}>
                  {formatInventoryQuantity(movement.balance_after)}
                </Table.Cell>
                <Table.Cell textProps={{ className: "tabular-nums" }}>
                  {movement.cost_per_unit === null ? "—" : formatRupiah(movement.cost_per_unit)}
                </Table.Cell>
                <Table.Cell textProps={{ numberOfLines: 1 }}>
                  <MovementSourceChip source={movement.source} />
                </Table.Cell>
                <Table.Cell textProps={{ numberOfLines: 1 }}>{movement.reason ?? "—"}</Table.Cell>
                <Table.Cell textProps={{ numberOfLines: 1 }}>
                  {movement.actor?.name ?? "—"}
                </Table.Cell>
                <Table.Cell textProps={{ className: "tabular-nums" }}>
                  {formatDateTime(movement.moved_at)}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
