import AppIcon from "@/components/common/app-icon";
import { Frame } from "panelui-native";
import type { ComponentProps } from "react";

type NavigationFrameRowProps = {
  icon: ComponentProps<typeof AppIcon>["icon"];
  color: string;
  label: string;
  description: string;
  onPress: () => void;
};

export default function NavigationFrameRow({
  icon,
  color,
  label,
  description,
  onPress,
}: NavigationFrameRowProps) {
  return (
    <Frame.Row chevron onPress={onPress}>
      <Frame.Media>
        <AppIcon icon={icon} size={21} color={color} />
      </Frame.Media>
      <Frame.Content>
        <Frame.Title>{label}</Frame.Title>
        <Frame.Description numberOfLines={2}>{description}</Frame.Description>
      </Frame.Content>
    </Frame.Row>
  );
}
