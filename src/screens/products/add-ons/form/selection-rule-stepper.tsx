import { FormNumberField } from "@/components/common/form-number-field";
import { Typography } from "heroui-native";

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
  return (
    <FormNumberField
      className="flex-1"
      label={label}
      value={value}
      onChange={onChange}
      minValue={minValue}
      maxValue={maxValue}
      step={1}
      showStepper
      decreaseAccessibilityLabel={decreaseAccessibilityLabel}
      increaseAccessibilityLabel={increaseAccessibilityLabel}
      isRequired={isRequired}
      isInvalid={Boolean(error)}
    >
      {error ? (
        <Typography type="body-xs" className="text-danger">
          {error}
        </Typography>
      ) : null}
    </FormNumberField>
  );
}
