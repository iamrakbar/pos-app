import { HugeiconsIcon } from "@hugeicons/react-native";
import type { ComponentProps, JSX } from "react";

type AppIconProps = {
  icon: ComponentProps<typeof HugeiconsIcon>["icon"];
  size?: number;
  color?: string;
};

export default function AppIcon({ icon, size = 24, color = "black" }: AppIconProps): JSX.Element {
  return <HugeiconsIcon icon={icon} size={size} color={color} strokeWidth={1.75} />;
}
