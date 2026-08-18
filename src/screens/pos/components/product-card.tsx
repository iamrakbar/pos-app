import type { POSProduct } from "@/types/pos";
import { formatRupiah } from "@/utils/format";
import { Card, Typography, useThemeColor } from "heroui-native";
import { Image } from "expo-image";
import type { JSX } from "react";
import { Pressable, View } from "react-native";
import AppIcon from "@/components/common/app-icon";
import { useTranslation } from "@/stores/use-locale";

type Props = {
  product: POSProduct;
  onPress: (product: POSProduct) => void;
  width: number;
};

function ProductCard({ product, onPress, width }: Props): JSX.Element {
  const { t } = useTranslation();
  const themeColorMuted = useThemeColor("muted");
  const isDiscounted = product.discount !== null;
  const isOutOfStock = product.stock?.enabled && (product.stock.qty ?? 0) <= 0;
  const effectivePrice = product.discount?.price ?? product.price;
  const handlePress = () => {
    onPress(product);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isOutOfStock}
      style={{
        width: width - 12,
      }}
      className={`m-1.5 active:opacity-85 ${isOutOfStock ? "opacity-50" : ""}`}
      accessibilityRole="button"
      accessibilityLabel={t("pos.addProduct", { product: product.name })}
    >
      <Card className="flex-1 overflow-hidden p-0">
        <View className="aspect-square bg-surface-secondary items-center justify-center">
          {product.image?.thumbnail ? (
            <Image
              source={{ uri: product.image.thumbnail }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <AppIcon name="fast-food-outline" size={30} color={themeColorMuted} />
          )}
        </View>
        <Card.Body className="min-h-20 justify-between px-3.5 py-3">
          <Typography weight="medium" truncate>
            {product.name}
          </Typography>
          <View className="gap-0.5">
            {/* {product.stock_enabled && (
              <Typography
                type="body-xs"
                color={isOutOfStock ? undefined : "muted"}
                className={isOutOfStock ? "text-danger" : undefined}
              >
                {isOutOfStock
                  ? t("pos.outOfStock")
                  : t("pos.stockRemaining", { count: product.stock_qty ?? 0 })}
              </Typography>
            )} */}
            {isDiscounted && (
              <Typography type="body-xs" color="muted" className="line-through">
                {formatRupiah(product.price)}
              </Typography>
            )}
            <Typography
              type="body-sm"
              weight="semibold"
              className={isDiscounted ? "text-accent tabular-nums" : "tabular-nums"}
            >
              {formatRupiah(effectivePrice)}
            </Typography>
          </View>
        </Card.Body>
      </Card>
    </Pressable>
  );
}

export default ProductCard;
