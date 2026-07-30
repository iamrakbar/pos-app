import type { AddOnManagementValues } from "@/schemas/add-on-management";
import StringNumberField from "@/components/common/string-number-field";
import { IDR_CURRENCY_FORMAT_OPTIONS } from "@/utils/format";
import AppIcon from "@/components/common/app-icon";
import { Button, Input, Label, Surface, TextField, Typography, useThemeColor } from "heroui-native";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

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
  const { t } = useTranslation();
  const foregroundColor = useThemeColor("foreground");

  if (isDestroyed) {
    return (
      <View className="flex-row items-center gap-3 rounded-panel-inner bg-surface-secondary px-3 py-3">
        <Typography type="body-sm" color="muted" className="flex-1 line-through">
          {t("addOnManagement.removedOption")}
        </Typography>
        <Button size="sm" variant="ghost" onPress={onRestore} isDisabled={!canRestore}>
          <Button.Label>{t("addOnManagement.restore")}</Button.Label>
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
              <Label>{t("addOnManagement.option")}</Label>
              <Input
                value={value}
                onChangeText={onChange}
                placeholder={t("addOnManagement.optionPlaceholder")}
                variant="secondary"
              />
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
              label={t("addOnManagement.price")}
              value={value}
              onChange={onChange}
              minValue={0}
              step={1000}
              formatOptions={IDR_CURRENCY_FORMAT_OPTIONS}
              isRequired
              isInvalid={Boolean(errors.options?.[index]?.price)}
              inputVariant="secondary"
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
        <AppIcon name="trash-outline" size={16} color={foregroundColor} />
        <Button.Label>{t("addOnManagement.removeOption")}</Button.Label>
      </Button>
    </Surface>
  );
}
