import { Platform, type ImageSourcePropType } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

type ToolbarIconKey = "filter" | "category" | "add" | "trash" | "printer";

type ToolbarIconConfig = {
  icon: SFSymbol | ImageSourcePropType;
  iconRenderingMode: "template";
};

const ANDROID_TOOLBAR_ICONS: Record<ToolbarIconKey, ImageSourcePropType> = {
  filter: require("../../assets/images/toolbar/filter.png"),
  category: require("../../assets/images/toolbar/category.png"),
  add: require("../../assets/images/toolbar/add.png"),
  trash: require("../../assets/images/trash.png"),
  printer: require("../../assets/images/toolbar/printer.png"),
};

const IOS_TOOLBAR_ICONS: Record<ToolbarIconKey, SFSymbol> = {
  filter: "line.3.horizontal.decrease.circle",
  category: "tag.circle",
  add: "plus.circle",
  trash: "trash",
  printer: "printer",
};

export function getToolbarIcon(key: ToolbarIconKey): ToolbarIconConfig {
  return {
    icon: Platform.OS === "ios" ? IOS_TOOLBAR_ICONS[key] : ANDROID_TOOLBAR_ICONS[key],
    iconRenderingMode: "template",
  };
}
