import {
  Button as PanelButton,
  Surface,
  Typography,
  Input as PanelInput,
  Typography as PanelTypography,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import type { AddOnManagementValues } from "@/schemas/add-on-management";
import { useLocalizedNumberInput } from "@/hooks/use-localized-number-input";
import { IDR_NUMBER_FIELD_FORMAT_OPTIONS, RUPIAH_PREFIX } from "@/utils/format";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller, useController } from "react-hook-form";
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
  const dangerSoftForeground = useCSSVariable("--color-destructive") as string;
  const {
    field: {
      value: priceFieldValue,
      onChange: priceFieldChange,
      onBlur: priceFieldBlur,
      ref: priceFieldRef,
    },
  } = useController({ control, name: `options.${index}.price` });
  const { localizedInputProps: priceInput } = useLocalizedNumberInput({
    value: priceFieldValue,
    onChange: priceFieldChange,
    formatOptions: IDR_NUMBER_FIELD_FORMAT_OPTIONS,
    minValue: 0,
    inputProps: { onBlur: priceFieldBlur },
  });

  if (isDestroyed) {
    return (
      <View className="flex-row items-center gap-3 rounded-xl bg-surface-secondary px-3 py-3">
        <Typography type="body-sm" muted className="flex-1" strike>
          {t("addOnManagement.removedOption")}
        </Typography>
        <PanelButton size="sm" variant="ghost" onPress={onRestore} disabled={!canRestore}>
          {t("addOnManagement.restore")}
        </PanelButton>
      </View>
    );
  }

  return (
    <Surface variant="transparent" className="gap-3 border border-border">
      <PanelButton
        size="icon"
        variant="ghost"
        onPress={onRemove}
        className="self-end"
        accessibilityLabel={t("addOnManagement.removeOption")}
      >
        <AppIcon icon={AppIcons.close} size={20} color={dangerSoftForeground} />
      </PanelButton>
      <View className="flex-1 flex-col md:flex-row items-center gap-3">
        <Controller
          control={control}
          name={`options.${index}.name`}
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <PanelInput
              ref={ref}
              containerClassName="flex-1 w-full"
              label={t("addOnManagement.option")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("addOnManagement.optionPlaceholder")}
              variant="filled"
              isRequired
              errorMessage={errors.options?.[index]?.name?.message}
            />
          )}
        />
        <PanelInput
          ref={priceFieldRef}
          containerClassName="flex-1 w-full"
          label={t("addOnManagement.price")}
          errorMessage={errors.options?.[index]?.price?.message}
          variant="filled"
          isRequired
          keyboardType="numeric"
          startContent={
            <PanelTypography type="body-sm" weight="medium" muted>
              {RUPIAH_PREFIX}
            </PanelTypography>
          }
          interactiveContent={false}
          {...priceInput}
        />
      </View>
    </Surface>
  );
}
