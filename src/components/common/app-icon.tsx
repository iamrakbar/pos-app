import { Ionicons } from "@expo/vector-icons";
import createIconSetFromIcoMoon from "@expo/vector-icons/createIconSetFromIcoMoon";
import type { ComponentProps, JSX } from "react";

import icoMoonConfig from "@/assets/icoMoonConfig.json";

const AinIcon = createIconSetFromIcoMoon(
  icoMoonConfig,
  "ainicon",
  require("../../../assets/fonts/ainicon.ttf")
);

export type AppIconName = ComponentProps<typeof Ionicons>["name"];
type AppIconProps = ComponentProps<typeof Ionicons>;

const AINICON: Partial<Record<AppIconName, string>> = {
  "add-circle-outline": "add",
  "arrow-back": "arrow-left",
  "arrow-back-outline": "arrow-left",
  "arrow-down": "arrow-down",
  "arrow-down-outline": "arrow-down",
  "arrow-forward": "arrow-right",
  "arrow-forward-outline": "arrow-right",
  "arrow-up": "arrow-up",
  "arrow-up-outline": "arrow-up",
  "bag-handle-outline": "bag",
  "bag-outline": "bag",
  "calculator-outline": "pos",
  "cart-outline": "cart",
  "chevron-back": "chevron-left",
  "chevron-down": "chevron-down",
  "chevron-forward": "chevron-right",
  "chevron-up": "chevron-up",
  "eye-off-outline": "eye-off",
  "eye-outline": "eye",
  "fast-food-outline": "eat",
  "heart-outline": "love",
  "home-outline": "home",
  "information-circle-outline": "information",
  "location-outline": "marker",
  "mail-outline": "envelop",
  "map-outline": "map",
  "menu-outline": "menu",
  "notifications-outline": "notification",
  "people-outline": "peoples",
  "pencil-outline": "pencil",
  "person-circle-outline": "profile-round",
  "person-outline": "profile",
  "pricetag-outline": "price",
  "pricetags-outline": "tags",
  "qr-code-outline": "qr-code",
  "restaurant-outline": "restaurant",
  "search-outline": "search",
  "settings-outline": "setting",
  "star-outline": "star",
  "stats-chart-outline": "chart",
  "storefront-outline": "shop",
  "time-outline": "time",
  "trash-outline": "trash",
  add: "add",
  remove: "remove",
};

export default function AppIcon({ name, ...props }: AppIconProps): JSX.Element {
  const ainIconName = AINICON[name];

  if (ainIconName) {
    return <AinIcon name={ainIconName} {...props} />;
  }

  return <Ionicons name={name} {...props} />;
}
