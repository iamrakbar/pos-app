import {
  Typography,
  Input as PanelInput,
  Switch as PanelSwitch,
  Card,
  Button as PanelButton,
} from "panelui-native";
import { useLocalizedNumberInput } from "@/hooks/use-localized-number-input";
import type { AddOnManagementValues } from "@/schemas/add-on-management";
import { Controller, useController, useWatch } from "react-hook-form";
import type { Control, FieldErrors, UseFormSetValue } from "react-hook-form";
import { View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

type SelectionRulesCardProps = {
  control: Control<AddOnManagementValues>;
  errors: FieldErrors<AddOnManagementValues>;
  setValue: UseFormSetValue<AddOnManagementValues>;
};

export default function SelectionRulesCard({ control, errors, setValue }: SelectionRulesCardProps) {
  const { t } = useTranslation();
  const required = useWatch({ control, name: "required" });
  const multiple = useWatch({ control, name: "multiple" });
  const minimum = useWatch({ control, name: "min" });
  const maximum = useWatch({ control, name: "max" });
  const {
    field: { value: minValue, onChange: changeMin, onBlur: blurMin, ref: minRef },
  } = useController({ control, name: "min" });
  const {
    field: { value: maxValue, onChange: changeMax, onBlur: blurMax, ref: maxRef },
  } = useController({ control, name: "max" });
  const { localizedInputProps: minInput } = useLocalizedNumberInput({
    value: minValue,
    onChange: changeMin,
    formatOptions: { useGrouping: false, maximumFractionDigits: 0 },
    minValue: 1,
    maxValue: Number(maximum) || undefined,
    inputProps: { onBlur: blurMin },
  });
  const { localizedInputProps: maxInput } = useLocalizedNumberInput({
    value: maxValue,
    onChange: changeMax,
    formatOptions: { useGrouping: false, maximumFractionDigits: 0 },
    minValue: Math.max(2, Number(minimum) || 2),
    inputProps: { onBlur: blurMax },
  });

  return (
    <Card className="gap-3 p-4">
      <Card.Header className="p-0">
        <View className="gap-1">
          <Card.Title>{t("addOnManagement.selectionRules")}</Card.Title>
          <Card.Description>{t("addOnManagement.selectionRulesDescription")}</Card.Description>
        </View>
      </Card.Header>
      <Card.Content className="gap-4 p-0">
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <PanelInput
              ref={ref}
              label={t("addOnManagement.groupName")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("addOnManagement.groupNamePlaceholder")}
              isRequired
              errorMessage={errors.name?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="required"
          render={({ field: { value, onChange } }) => (
            <View className="flex-row items-center gap-4 py-1">
              <View className="flex-1 gap-0.5">
                <Typography type="body-sm" weight="semibold">
                  {t("addOnManagement.requiredSelection")}
                </Typography>
                <Typography type="body-xs" muted>
                  {t("addOnManagement.requiredSelectionDescription")}
                </Typography>
              </View>
              <PanelSwitch
                accessibilityLabel={t("addOnManagement.requiredSelection")}
                value={value}
                onValueChange={(selected) => {
                  onChange(selected);
                  setValue("min", selected ? "1" : "0", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
            </View>
          )}
        />
        <Controller
          control={control}
          name="multiple"
          render={({ field: { value, onChange } }) => (
            <View className="flex-row items-center gap-4 py-1">
              <View className="flex-1 gap-0.5">
                <Typography type="body-sm" weight="semibold">
                  {t("addOnManagement.allowMultiple")}
                </Typography>
                <Typography type="body-xs" muted>
                  {t("addOnManagement.allowMultipleDescription")}
                </Typography>
              </View>
              <PanelSwitch
                accessibilityLabel={t("addOnManagement.allowMultiple")}
                value={value}
                onValueChange={(selected) => {
                  onChange(selected);
                  setValue("max", selected ? "2" : "1", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setValue("min", required ? "1" : "0", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
            </View>
          )}
        />
        {multiple ? (
          <View className="flex-row gap-3">
            {required ? (
              <View className="flex-1 gap-2">
                <View className="flex-row items-end gap-2">
                  <PanelButton
                    variant="outline"
                    size="icon"
                    disabled={Number(minValue || 0) <= 1}
                    accessibilityLabel={t("productForm.decreaseAccessibility", {
                      field: t("addOnManagement.minimum"),
                    })}
                    onPress={() => changeMin(String(Math.max(1, Number(minValue || 1) - 1)))}
                  >
                    -
                  </PanelButton>
                  <PanelInput
                    className="flex-1"
                    label={t("addOnManagement.minimum")}
                    keyboardType="number-pad"
                    {...minInput}
                    errorMessage={errors.min?.message}
                    ref={minRef}
                  />
                  <PanelButton
                    variant="outline"
                    size="icon"
                    disabled={Number(minValue || 0) >= Number(maximum || Infinity)}
                    accessibilityLabel={t("productForm.increaseAccessibility", {
                      field: t("addOnManagement.minimum"),
                    })}
                    onPress={() =>
                      changeMin(
                        String(Math.min(Number(maximum || Infinity), Number(minValue || 0) + 1))
                      )
                    }
                  >
                    +
                  </PanelButton>
                </View>
              </View>
            ) : null}
            <View className="flex-1 gap-2">
              <View className="flex-row items-end gap-2">
                <PanelButton
                  variant="outline"
                  size="icon"
                  disabled={Number(maxValue || 0) <= Math.max(2, Number(minimum) || 2)}
                  accessibilityLabel={t("productForm.decreaseAccessibility", {
                    field: t("addOnManagement.maximum"),
                  })}
                  onPress={() =>
                    changeMax(
                      String(Math.max(Math.max(2, Number(minimum) || 2), Number(maxValue || 0) - 1))
                    )
                  }
                >
                  -
                </PanelButton>
                <PanelInput
                  className="flex-1"
                  label={t("addOnManagement.maximum")}
                  keyboardType="number-pad"
                  {...maxInput}
                  errorMessage={errors.max?.message}
                  ref={maxRef}
                />
                <PanelButton
                  variant="outline"
                  size="icon"
                  accessibilityLabel={t("productForm.increaseAccessibility", {
                    field: t("addOnManagement.maximum"),
                  })}
                  onPress={() => changeMax(String(Number(maxValue || 0) + 1))}
                >
                  +
                </PanelButton>
              </View>
            </View>
          </View>
        ) : (
          <Typography type="body-xs" muted>
            {required ? t("addOnManagement.exactlyOne") : t("addOnManagement.optionalOne")}
          </Typography>
        )}
      </Card.Content>
    </Card>
  );
}
