import { useTables } from "@/hooks/db/useTables";
import { usePOSStore } from "@/stores/usePOSStore";
import type { CheckoutFormState } from "@/types/pos";
import { Select, Typography } from "heroui-native";
import { Segment, TimePicker, type TimePickerOption } from "heroui-native-pro";
import type { JSX } from "react";
import { View } from "react-native";

type OrderType = CheckoutFormState["order_type"];

function getPickupTimeOption(value: string | null): TimePickerOption | undefined {
  if (!value) return undefined;

  const [hours = "00", minutes = "00"] = value.split(":");
  return {
    value,
    label: `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`,
  };
}

export default function CartOrderContext(): JSX.Element {
  const checkoutForm = usePOSStore((state) => state.checkoutForm);
  const updateCheckoutForm = usePOSStore((state) => state.updateCheckoutForm);
  const { data: tables = [] } = useTables();

  const selectedTable = tables.find((table) => table.id === checkoutForm.table_id);
  const pickupTime = getPickupTimeOption(checkoutForm.pickup_time);

  const handleOrderTypeChange = (value: string) => {
    const orderType = value as OrderType;
    updateCheckoutForm({
      order_type: orderType,
      table_id: orderType === "dine-in" ? checkoutForm.table_id : null,
      pickup_time: orderType === "takeaway" ? checkoutForm.pickup_time : null,
    });
  };

  return (
    <View className="gap-3 px-5 pb-4">
      <View className="flex-row items-center justify-between">
        <Typography type="body-sm" weight="semibold">
          Order Type
        </Typography>
        <Typography type="body-xs" color="muted">
          Required
        </Typography>
      </View>

      <Segment value={checkoutForm.order_type} onValueChange={handleOrderTypeChange} size="sm">
        <Segment.Group className="w-full">
          <Segment.Indicator />
          <Segment.Item value="dine-in" className="flex-1">
            <Segment.Label>Dine-in</Segment.Label>
          </Segment.Item>
          <Segment.Separator betweenValues={["dine-in", "takeaway"]} />
          <Segment.Item value="takeaway" className="flex-1">
            <Segment.Label>Takeaway</Segment.Label>
          </Segment.Item>
        </Segment.Group>
      </Segment>

      {checkoutForm.order_type === "dine-in" ? (
        <Select
          value={
            selectedTable
              ? {
                  value: selectedTable.id,
                  label: `${selectedTable.name} · ${selectedTable.area_name}`,
                }
              : undefined
          }
          onValueChange={(option) => updateCheckoutForm({ table_id: option?.value || null })}
        >
          <Select.Trigger>
            <Select.Value placeholder="Select table" numberOfLines={1} />
            <Select.TriggerIndicator />
          </Select.Trigger>
          <Select.Portal>
            <Select.Overlay />
            <Select.Content presentation="popover" width="trigger">
              <Select.ListLabel>Table</Select.ListLabel>
              <Select.Item value="" label="No table" />
              {tables.map((table) => (
                <Select.Item
                  key={table.id}
                  value={table.id}
                  label={`${table.name} · ${table.area_name}`}
                />
              ))}
            </Select.Content>
          </Select.Portal>
        </Select>
      ) : (
        <TimePicker
          value={pickupTime}
          onValueChange={(option) => updateCheckoutForm({ pickup_time: option?.value ?? null })}
          hourFormat={24}
          minuteInterval={5}
          locale="id-ID"
          isRequired
        >
          <TimePicker.Select presentation="dialog">
            <TimePicker.Trigger>
              <TimePicker.Value placeholder="Select pickup time" />
              <TimePicker.TriggerIndicator />
            </TimePicker.Trigger>
            <TimePicker.Portal>
              <TimePicker.Overlay />
              <TimePicker.Content presentation="dialog">
                <TimePicker.Wheel />
              </TimePicker.Content>
            </TimePicker.Portal>
          </TimePicker.Select>
        </TimePicker>
      )}
    </View>
  );
}
