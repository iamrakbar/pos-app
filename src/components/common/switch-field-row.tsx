import { Switch, Typography } from "panelui-native";
import { Pressable, View } from "react-native";

type SwitchFieldRowProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
  description: string;
};

export default function SwitchFieldRow({
  value,
  onValueChange,
  label,
  description,
}: SwitchFieldRowProps) {
  return (
    <Pressable
      accessible={false}
      onPress={() => onValueChange(!value)}
      className="flex-row items-center justify-between gap-4 py-1"
    >
      <View className="flex-1">
        <Typography type="body-sm" weight="semibold">
          {label}
        </Typography>
        <Typography type="body-xs" muted>
          {description}
        </Typography>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={label}
        accessibilityHint={description}
      />
    </Pressable>
  );
}
