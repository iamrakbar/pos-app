import { NumberStepper } from "heroui-native-pro";
import { Label, Typography } from "heroui-native";
import { View } from "react-native";

type SelectionRuleStepperProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minValue: number;
  maxValue?: number;
  error?: string;
  isRequired?: boolean;
  decreaseAccessibilityLabel: string;
  increaseAccessibilityLabel: string;
};

export default function SelectionRuleStepper({
  label,
  value,
  onChange,
  minValue,
  maxValue,
  error,
  isRequired,
  decreaseAccessibilityLabel,
  increaseAccessibilityLabel,
}: SelectionRuleStepperProps) {
  const parsedValue = Number(value);
  const numericValue = Number.isFinite(parsedValue) ? parsedValue : minValue;

  return (
    <View className="flex-1 gap-1">
      <Label isRequired={isRequired}>{label}</Label>
      <NumberStepper
        value={numericValue}
        minValue={minValue}
        maxValue={maxValue}
        step={1}
        onValueChange={(nextValue) => onChange(String(nextValue))}
        className="justify-between"
      >
        <NumberStepper.DecrementButton accessibilityLabel={decreaseAccessibilityLabel} />
        <NumberStepper.Value />
        <NumberStepper.IncrementButton accessibilityLabel={increaseAccessibilityLabel} />
      </NumberStepper>
      {error ? (
        <Typography type="body-xs" className="text-danger">
          {error}
        </Typography>
      ) : null}
    </View>
  );
}
