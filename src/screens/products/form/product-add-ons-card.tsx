import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Separator, Typography, useThemeColor } from "heroui-native";
import { Pressable, View } from "react-native";

type ProductAddOn = App.Data.Merchant.Product.ProductAddOnData;

type ProductAddOnsCardProps = {
  addOns: ProductAddOn[];
  onAdd: () => void;
  onEdit: (addOnId: string) => void;
};

function selectionRule(addOn: ProductAddOn): string {
  const requirement = addOn.required ? "Required" : "Optional";
  const selection = addOn.multiple
    ? addOn.required
      ? `Choose ${addOn.min}–${addOn.max}`
      : `Up to ${addOn.max}`
    : "Choose one";
  const optionCount = `${addOn.options.length} option${addOn.options.length === 1 ? "" : "s"}`;
  return `${requirement} · ${selection} · ${optionCount}`;
}

export default function ProductAddOnsCard({ addOns, onAdd, onEdit }: ProductAddOnsCardProps) {
  const mutedColor = useThemeColor("muted");

  return (
    <Card className="overflow-hidden">
      <Card.Header>
        <View className="flex-1 gap-1">
          <Card.Title>Add-ons</Card.Title>
          <Card.Description>Choice groups shown to the cashier.</Card.Description>
        </View>
        <Button variant="ghost" className="self-center" onPress={onAdd}>
          <Button.Label>+ Add</Button.Label>
        </Button>
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
          addOns.slice(0, 3).map((addOn, index) => (
            <View key={addOn.id}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit ${addOn.name}`}
                onPress={() => onEdit(addOn.id)}
                className="flex-row items-center gap-3 py-2.5 active:opacity-70"
              >
                <View className="flex-1 gap-0.5">
                  <Typography type="body-sm" weight="semibold">
                    {addOn.name}
                  </Typography>
                  <Typography type="body-xs" color="muted" numberOfLines={1}>
                    {selectionRule(addOn)}
                  </Typography>
                </View>
                <Ionicons name="chevron-forward" size={17} color={mutedColor} />
              </Pressable>
              {index < Math.min(addOns.length, 3) - 1 ? <Separator /> : null}
            </View>
          ))
        )}
        {addOns.length > 3 ? (
          <Typography type="body-xs" color="muted" className="pt-2">
            {addOns.length - 3} more group{addOns.length - 3 === 1 ? "" : "s"}
          </Typography>
        ) : null}
      </Card.Body>
    </Card>
  );
}
