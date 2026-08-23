import type { POSProduct } from "@/types/pos";

export function getProductSellingPrice(product: Pick<POSProduct, "price" | "discount">): number {
  return product.discount?.price ?? product.price;
}
