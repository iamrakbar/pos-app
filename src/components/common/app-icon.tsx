import { HugeiconsIcon } from "@hugeicons/react-native";
import { useCSSVariable } from "uniwind";
import type { ComponentProps, JSX } from "react";

type AppIconProps = {
  icon: ComponentProps<typeof HugeiconsIcon>["icon"];
  size?: number;
  color?: string;
};

export default function AppIcon({ icon, size = 24, color }: AppIconProps): JSX.Element {
  const foreground = useCSSVariable("--color-foreground") as string;
  return <HugeiconsIcon icon={icon} size={size} color={color ?? foreground} strokeWidth={1.75} />;
}
