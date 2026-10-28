import {
  Typography,
  Input as PanelInput,
  Switch as PanelSwitch,
  Card,
  NumberInput,
} from "panelui-native";
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
    field: { value: minValue, onChange: changeMin, onBlur: blurMin },
  } = useController({ control, name: "min" });
  const {
    field: { value: maxValue, onChange: changeMax, onBlur: blurMax },
  } = useController({ control, name: "max" });

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
              <NumberInput
                containerClassName="flex-1"
                label={t("addOnManagement.minimum")}
                value={Number(minValue || 1)}
                min={1}
                max={Number(maximum) || undefined}
                step={1}
                onValueChange={(value) => changeMin(String(value))}
                onBlur={blurMin}
                errorMessage={errors.min?.message}
              />
            ) : null}
            <NumberInput
              containerClassName="flex-1"
              label={t("addOnManagement.maximum")}
              value={Number(maxValue || 2)}
              min={Math.max(2, Number(minimum) || 2)}
              step={1}
              onValueChange={(value) => changeMax(String(value))}
              onBlur={blurMax}
              errorMessage={errors.max?.message}
            />
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
