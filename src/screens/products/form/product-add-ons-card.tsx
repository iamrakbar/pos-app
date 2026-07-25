import { formatRupiah } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Separator, Typography, useThemeColor } from "heroui-native";
import { Pressable, View } from "react-native";

type ProductAddOn = App.Data.Merchant.Product.ProductAddOnData;

type ProductAddOnsCardProps = {
  addOns: ProductAddOn[];
  onAdd: () => void;
  onEdit: (addOnId: string) => void;
  onManageAll: () => void;
};

function selectionRule(addOn: ProductAddOn): string {
  if (addOn.min === addOn.max) return `Choose ${addOn.min}`;
  return `Choose ${addOn.min}–${addOn.max}`;
}

function optionSummary(addOn: ProductAddOn): string {
  return addOn.options
    .map((option) =>
      option.price > 0 ? `${option.name} +${formatRupiah(option.price)}` : option.name
    )
    .join(", ");
}

export default function ProductAddOnsCard({
  addOns,
  onAdd,
  onEdit,
  onManageAll,
}: ProductAddOnsCardProps) {
  const mutedColor = useThemeColor("muted");

  return (
    <Card className="overflow-hidden">
      <Card.Header>
        <View className="flex-1 gap-1">
          <Card.Title>Add-ons</Card.Title>
          <Card.Description>
            Choices such as toppings, sizes, and spice levels shown to the cashier.
          </Card.Description>
        </View>
      </Card.Header>
      <Card.Body className="gap-0">
        {addOns.length === 0 ? (
          <View className="items-center gap-2 py-5">
            <Ionicons name="options-outline" size={24} color={mutedColor} />
            <Typography type="body-sm" weight="semibold">
              No add-on groups
            </Typography>
            <Typography type="body-xs" color="muted" className="text-center">
              Add optional or required choices for this product.
            </Typography>
          </View>
        ) : (
          addOns.map((addOn, index) => (
            <View key={addOn.id}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit ${addOn.name}`}
                onPress={() => onEdit(addOn.id)}
                className="flex-row items-center gap-3 py-3 active:opacity-70"
              >
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-2">
                    <Typography type="body-sm" weight="semibold" className="flex-1">
                      {addOn.name}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                      {selectionRule(addOn)}
                    </Typography>
                  </View>
                  <Typography type="body-xs" color="muted" numberOfLines={2}>
                    {optionSummary(addOn)}
                  </Typography>
                </View>
                <Ionicons name="chevron-forward" size={17} color={mutedColor} />
              </Pressable>
              {index < addOns.length - 1 ? <Separator /> : null}
            </View>
          ))
        )}
      </Card.Body>
      <Card.Footer className="flex-row gap-3">
        <Button variant="outline" className="flex-1" onPress={onManageAll}>
          <Button.Label>Manage all</Button.Label>
        </Button>
        <Button className="flex-1" onPress={onAdd}>
          <Button.Label>Add group</Button.Label>
        </Button>
      </Card.Footer>
    </Card>
  );
}
