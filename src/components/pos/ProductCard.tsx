import type { POSProduct } from "@/types/pos";
import { formatRupiah } from "@/utils/format";
import { Card, Typography, useThemeColor } from "heroui-native";
import type { JSX } from "react";
import { memo, useCallback } from "react";
import { Image, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  product: POSProduct;
  onPress: (product: POSProduct) => void;
  width: number;
};

function ProductCard({ product, onPress, width }: Props): JSX.Element {
  const themeColorMuted = useThemeColor("muted");
  const isDiscounted = product.original_price !== null;
  const isOutOfStock = product.stock_enabled && (product.stock_qty ?? 0) <= 0;
  const effectivePrice = product.price;
  const handlePress = useCallback(() => {
    onPress(product);
  }, [onPress, product]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={isOutOfStock}
      style={{
        width: width - 12,
      }}
      className={`m-1.5 active:opacity-85 ${isOutOfStock ? "opacity-50" : ""}`}
      accessibilityRole="button"
      accessibilityLabel={`Add ${product.name}`}
    >
      <Card className="overflow-hidden p-0">
        <View className="aspect-square bg-surface-secondary items-center justify-center">
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="fast-food-outline" size={30} color={themeColorMuted} />
          )}
        </View>
        <Card.Body className="min-h-[82px] justify-between px-3.5 py-3">
          <Typography weight="medium" truncate>
            {product.name}
          </Typography>
          <View className="gap-0.5">
            {product.stock_enabled && (
              <Typography
                type="body-xs"
                color={isOutOfStock ? undefined : "muted"}
                className={isOutOfStock ? "text-danger" : undefined}
              >
                {isOutOfStock ? "Out of stock" : `${product.stock_qty} left`}
              </Typography>
            )}
            {isDiscounted && (
              <Typography type="body-xs" color="muted" className="line-through">
                {formatRupiah(product.original_price!)}
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

export default memo(ProductCard);
