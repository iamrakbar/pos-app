import AppIcon from "@/components/common/app-icon";
import { ListGroup } from "heroui-native";
import React from "react";

export default function SettingsMenuRow({
  item,
  iconColor,
  onPress,
}: {
  item: {
    icon: React.ComponentProps<typeof AppIcon>["name"];
    label: string;
    description: string;
  };
  iconColor: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <ListGroup.Item accessibilityRole="button" onPress={onPress}>
      <ListGroup.ItemPrefix>
        <AppIcon name={item.icon} size={21} color={iconColor} />
      </ListGroup.ItemPrefix>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{item.label}</ListGroup.ItemTitle>
        <ListGroup.ItemDescription numberOfLines={2}>{item.description}</ListGroup.ItemDescription>
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix />
    </ListGroup.Item>
  );
}
