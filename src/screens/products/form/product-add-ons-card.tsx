import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Separator, Typography, useThemeColor } from "heroui-native";
import { Pressable, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";
import type { Translate } from "@/locales";

type ProductAddOn = App.Data.Merchant.Product.ProductAddOnData;

type ProductAddOnsCardProps = {
  addOns: ProductAddOn[];
  onAdd: () => void;
  onEdit: (addOnId: string) => void;
};

function selectionRule(addOn: ProductAddOn, t: Translate): string {
  const requirement = addOn.required ? t("productForm.required") : t("productForm.optional");
  const selection = addOn.multiple
    ? addOn.required
      ? t("productForm.chooseRange", { min: addOn.min, max: addOn.max })
      : t("productForm.upTo", { max: addOn.max })
    : t("productForm.chooseOne");
  const optionCount = t(
    addOn.options.length === 1 ? "productForm.optionOne" : "productForm.optionOther",
    { count: addOn.options.length }
  );
  return `${requirement} · ${selection} · ${optionCount}`;
}

export default function ProductAddOnsCard({ addOns, onAdd, onEdit }: ProductAddOnsCardProps) {
  const { t } = useTranslation();
  const mutedColor = useThemeColor("muted");

  return (
    <Card className="overflow-hidden">
      <Card.Header>
        <View className="flex-1 gap-1">
          <Card.Title>{t("productForm.addOnsTitle")}</Card.Title>
          <Card.Description>{t("productForm.addOnsDescription")}</Card.Description>
        </View>
      </Card.Header>
      <Card.Body className="gap-0">
        {addOns.length === 0 ? (
          <View className="items-center gap-2 py-5">
            <Ionicons name="options-outline" size={24} color={mutedColor} />
            <Typography type="body-sm" weight="semibold">
              {t("productForm.noAddOns")}
            </Typography>
            <Typography type="body-xs" color="muted" className="text-center">
              {t("productForm.noAddOnsDescription")}
            </Typography>
          </View>
        ) : (
          addOns.slice(0, 3).map((addOn, index) => (
            <View key={addOn.id}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("productForm.editAddOnAccessibility", {
                  addOn: addOn.name,
                })}
                onPress={() => onEdit(addOn.id)}
                className="flex-row items-center gap-3 py-2.5 active:opacity-70"
              >
                <View className="flex-1 gap-0.5">
                  <Typography type="body-sm" weight="semibold">
                    {addOn.name}
                  </Typography>
                  <Typography type="body-xs" color="muted" numberOfLines={1}>
                    {selectionRule(addOn, t)}
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
            {t(
              addOns.length - 3 === 1 ? "productForm.moreGroupOne" : "productForm.moreGroupOther",
              { count: addOns.length - 3 }
            )}
          </Typography>
        ) : null}
        <Card.Footer>
          <Button variant="outline" className="self-center" onPress={onAdd}>
            <Button.Label>{t("productForm.add")}</Button.Label>
          </Button>
        </Card.Footer>
      </Card.Body>
    </Card>
  );
}
