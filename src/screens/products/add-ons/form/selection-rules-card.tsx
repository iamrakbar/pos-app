import type { AddOnManagementValues } from "@/schemas/add-on-management";
import { Card, Input, Label, Switch, TextField, Typography } from "heroui-native";
import { Controller, useWatch } from "react-hook-form";
import type { Control, FieldErrors, UseFormSetValue } from "react-hook-form";
import { View } from "react-native";
import { useTranslation } from "@/stores/use-locale";
import SelectionRuleStepper from "./selection-rule-stepper";

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

  return (
    <Card className="gap-3">
      <Card.Header>
        <View className="gap-1">
          <Card.Title>{t("addOnManagement.selectionRules")}</Card.Title>
          <Card.Description>{t("addOnManagement.selectionRulesDescription")}</Card.Description>
        </View>
      </Card.Header>
      <Card.Body className="gap-4">
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange } }) => (
            <TextField isRequired isInvalid={Boolean(errors.name)}>
              <Label>{t("addOnManagement.groupName")}</Label>
              <Input
                value={value}
                onChangeText={onChange}
                placeholder={t("addOnManagement.groupNamePlaceholder")}
              />
              {errors.name?.message ? (
                <Typography type="body-xs" className="text-danger">
                  {errors.name.message}
                </Typography>
              ) : null}
            </TextField>
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
                <Typography type="body-xs" color="muted">
                  {t("addOnManagement.requiredSelectionDescription")}
                </Typography>
              </View>
              <Switch
                isSelected={value}
                onSelectedChange={(selected) => {
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
                <Typography type="body-xs" color="muted">
                  {t("addOnManagement.allowMultipleDescription")}
                </Typography>
              </View>
              <Switch
                isSelected={value}
                onSelectedChange={(selected) => {
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
              <Controller
                control={control}
                name="min"
                render={({ field: { value, onChange } }) => (
                  <SelectionRuleStepper
                    label={t("addOnManagement.minimum")}
                    value={value}
                    onChange={onChange}
                    minValue={1}
                    maxValue={Number(maximum) || undefined}
                    isRequired
                    error={errors.min?.message}
                    decreaseAccessibilityLabel={t("productForm.decreaseAccessibility", {
                      field: t("addOnManagement.minimum"),
                    })}
                    increaseAccessibilityLabel={t("productForm.increaseAccessibility", {
                      field: t("addOnManagement.minimum"),
                    })}
                  />
                )}
              />
            ) : null}
            <Controller
              control={control}
              name="max"
              render={({ field: { value, onChange } }) => (
                <SelectionRuleStepper
                  label={t("addOnManagement.maximum")}
                  value={value}
                  onChange={onChange}
                  minValue={Math.max(2, Number(minimum) || 2)}
                  error={errors.max?.message}
                  decreaseAccessibilityLabel={t("productForm.decreaseAccessibility", {
                    field: t("addOnManagement.maximum"),
                  })}
                  increaseAccessibilityLabel={t("productForm.increaseAccessibility", {
                    field: t("addOnManagement.maximum"),
                  })}
                />
              )}
            />
          </View>
        ) : (
          <Typography type="body-xs" color="muted">
            {required ? t("addOnManagement.exactlyOne") : t("addOnManagement.optionalOne")}
          </Typography>
        )}
      </Card.Body>
    </Card>
  );
}
