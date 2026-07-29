import type { AddOnManagementValues } from "@/schemas/add-on-management";
import StringNumberField from "@/components/common/string-number-field";
import { IDR_CURRENCY_FORMAT_OPTIONS } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, Label, Surface, TextField, Typography } from "heroui-native";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { View } from "react-native";

type OptionRowProps = {
  control: Control<AddOnManagementValues>;
  errors: FieldErrors<AddOnManagementValues>;
  index: number;
  isDestroyed: boolean;
  canRestore: boolean;
  onRemove: () => void;
  onRestore: () => void;
};

export default function OptionRow({
  control,
  errors,
  index,
  isDestroyed,
  canRestore,
  onRemove,
  onRestore,
}: OptionRowProps) {
  if (isDestroyed) {
    return (
      <View className="flex-row items-center gap-3 rounded-panel-inner bg-surface-secondary px-3 py-3">
        <Typography type="body-sm" color="muted" className="flex-1 line-through">
          Removed option
        </Typography>
        <Button size="sm" variant="ghost" onPress={onRestore} isDisabled={!canRestore}>
          <Button.Label>Restore</Button.Label>
        </Button>
      </View>
    );
  }

  return (
    <Surface variant="transparent" className="gap-3 border border-border">
      <View className="flex-1 flex-col md:flex-row items-start gap-3">
        <Controller
          control={control}
          name={`options.${index}.name`}
          render={({ field: { value, onChange } }) => (
            <TextField
              className="flex-1 w-full"
              isRequired
              isInvalid={Boolean(errors.options?.[index]?.name)}
            >
              <Label>Option</Label>
              <Input value={value} onChangeText={onChange} placeholder="Extra cheese" />
              {errors.options?.[index]?.name?.message ? (
                <Typography type="body-xs" className="text-danger">
                  {errors.options[index]?.name?.message}
                </Typography>
              ) : null}
            </TextField>
          )}
        />
        <Controller
          control={control}
          name={`options.${index}.price`}
          render={({ field: { value, onChange } }) => (
            <StringNumberField
              className="flex-1 w-full"
              label="Price (Rp)"
              value={value}
              onChange={onChange}
              minValue={0}
              step={1000}
              formatOptions={IDR_CURRENCY_FORMAT_OPTIONS}
              isRequired
              isInvalid={Boolean(errors.options?.[index]?.price)}
            >
              {errors.options?.[index]?.price?.message ? (
                <Typography type="body-xs" className="text-danger">
                  {errors.options[index]?.price?.message}
                </Typography>
              ) : null}
            </StringNumberField>
          )}
        />
      </View>
      <Button size="sm" variant="ghost" onPress={onRemove}>
        <Ionicons name="trash-outline" size={16} />
        <Button.Label>Remove option</Button.Label>
      </Button>
    </Surface>
  );
}
