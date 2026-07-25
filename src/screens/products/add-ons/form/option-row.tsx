import type { AddOnManagementValues } from "@/schemas/add-on-management";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, Label, TextField, Typography } from "heroui-native";
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
    <View className="gap-3 rounded-panel-inner border border-border p-3">
      <View className="flex-row items-start gap-3">
        <Controller
          control={control}
          name={`options.${index}.name`}
          render={({ field: { value, onChange } }) => (
            <TextField
              className="flex-1"
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
            <TextField
              className="w-32"
              isRequired
              isInvalid={Boolean(errors.options?.[index]?.price)}
            >
              <Label>Price (Rp)</Label>
              <Input
                value={value}
                onChangeText={(text) => onChange(text.replace(/\D/g, ""))}
                keyboardType="number-pad"
              />
              {errors.options?.[index]?.price?.message ? (
                <Typography type="body-xs" className="text-danger">
                  {errors.options[index]?.price?.message}
                </Typography>
              ) : null}
            </TextField>
          )}
        />
      </View>
      <Button size="sm" variant="ghost" onPress={onRemove}>
        <Ionicons name="trash-outline" size={16} />
        <Button.Label>Remove option</Button.Label>
      </Button>
    </View>
  );
}
