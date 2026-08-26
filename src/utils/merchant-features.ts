export function hasMerchantFeature(
  features: readonly string[] | null | undefined,
  feature: string
): boolean {
  return features?.includes(feature) ?? false;
}
