import {
  Surface,
  Typography,
  Input as PanelInput,
  Typography as PanelTypography,
  Card,
  Switch as PanelSwitch,
  Button as PanelButton,
} from "panelui-native";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import {
  useLocalizedNumberInput,
  useLocalizedNumberInputList,
} from "@/hooks/use-localized-number-input";
import { IDR_NUMBER_FIELD_FORMAT_OPTIONS, RUPIAH_PREFIX } from "@/utils/format";
import type { ProductFormValues } from "@/schemas/product";
import { Controller, useController, useFieldArray, useWatch } from "react-hook-form";
import type { Control, FieldErrors, UseFormSetValue } from "react-hook-form";
import { View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

type NewProductAddOnsCardProps = {
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
};

type NewProductAddOnGroupProps = NewProductAddOnsCardProps & {
  index: number;
  onRemove: () => void;
};

function NewProductAddOnGroup({
  control,
  errors,
  setValue,
  index,
  onRemove,
}: NewProductAddOnGroupProps) {
  const { t } = useTranslation();
  const getPriceInput = useLocalizedNumberInputList(IDR_NUMBER_FIELD_FORMAT_OPTIONS);
  const required = useWatch({ control, name: `add_ons.${index}.required` });
  const multiple = useWatch({ control, name: `add_ons.${index}.multiple` });
  const minimum = useWatch({ control, name: `add_ons.${index}.min` });
  const maximum = useWatch({ control, name: `add_ons.${index}.max` });
  const {
    field: { value: minValue, onChange: changeMin, onBlur: blurMin, ref: minRef },
  } = useController({ control, name: `add_ons.${index}.min` });
  const {
    field: { value: maxValue, onChange: changeMax, onBlur: blurMax, ref: maxRef },
  } = useController({ control, name: `add_ons.${index}.max` });
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
  const { fields, append, remove } = useFieldArray({
    control,
    name: `add_ons.${index}.options`,
  });
  const groupErrors = errors.add_ons?.[index];
  const optionsMessage =
    typeof groupErrors?.options?.message === "string"
      ? groupErrors.options.message
      : typeof groupErrors?.options?.root?.message === "string"
        ? groupErrors.options.root.message
        : undefined;

  return (
    <Surface variant="transparent" className="gap-4 border border-border p-4">
      <View className="flex-row items-start gap-3">
        <Controller
          control={control}
          name={`add_ons.${index}.name`}
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <PanelInput
              ref={ref}
              containerClassName="flex-1"
              label={t("addOnManagement.groupName")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("addOnManagement.groupNamePlaceholder")}
              variant="filled"
              isRequired
              errorMessage={groupErrors?.name?.message}
            />
          )}
        />
        <PanelButton
          size="icon"
          variant="ghost"

          onPress={onRemove}
          accessibilityLabel={t("productForm.removeAddOnGroup")}
        >
          <AppIcon icon={AppIcons.close} size={20} />
        </PanelButton>
      </View>

      <Controller
        control={control}
        name={`add_ons.${index}.required`}
        render={({ field: { value, onChange } }) => (
          <View className="flex-row items-center gap-4">
            <View className="flex-1 gap-0.5">
              <Typography type="body-sm" weight="semibold">
                {t("addOnManagement.requiredSelection")}
              </Typography>
              <Typography type="body-xs" muted>
                {t("addOnManagement.requiredSelectionDescription")}
              </Typography>
            </View>
            <PanelSwitch
              value={value}
              label={t("addOnManagement.requiredSelection")}
              onValueChange={(selected) => {
                onChange(selected);
                setValue(`add_ons.${index}.min`, selected ? "1" : "0", {
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
        name={`add_ons.${index}.multiple`}
        render={({ field: { value, onChange } }) => (
          <View className="flex-row items-center gap-4">
            <View className="flex-1 gap-0.5">
              <Typography type="body-sm" weight="semibold">
                {t("addOnManagement.allowMultiple")}
              </Typography>
              <Typography type="body-xs" muted>
                {t("addOnManagement.allowMultipleDescription")}
              </Typography>
            </View>
            <PanelSwitch
              value={value}
              label={t("addOnManagement.allowMultiple")}
              onValueChange={(selected) => {
                onChange(selected);
                setValue(`add_ons.${index}.max`, selected ? "2" : "1", {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue(`add_ons.${index}.min`, required ? "1" : "0", {
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
                  errorMessage={groupErrors?.min?.message}
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
                errorMessage={groupErrors?.max?.message}
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

      <View className="gap-3">
        <Typography type="body-sm" weight="semibold">
          {t("addOnManagement.options")}
        </Typography>
        {fields.map((field, optionIndex) => (
          <View key={field.id} className="flex-row items-start gap-3">
            <Controller
              control={control}
              name={`add_ons.${index}.options.${optionIndex}.name`}
              render={({ field: { value, onChange, onBlur, ref } }) => (
                <PanelInput
                  ref={ref}
                  containerClassName="flex-1"
                  label={t("addOnManagement.option")}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={t("addOnManagement.optionPlaceholder")}
                  variant="filled"
                  isRequired
                  errorMessage={groupErrors?.options?.[optionIndex]?.name?.message}
                />
              )}
            />
            <Controller
              control={control}
              name={`add_ons.${index}.options.${optionIndex}.price`}
              render={({ field: { value, onChange, onBlur, ref } }) => (
                <PanelInput
                  ref={ref}
                  containerClassName="flex-1"
                  label={t("addOnManagement.price")}
                  errorMessage={groupErrors?.options?.[optionIndex]?.price?.message}
                  variant="filled"
                  isRequired
                  keyboardType="numeric"
                  startContent={
                    <PanelTypography type="body-sm" weight="medium" muted>
                      {RUPIAH_PREFIX}
                    </PanelTypography>
                  }
                  interactiveContent={false}
                  {...getPriceInput(field.id, value, onChange, onBlur)}
                />
              )}
            />
            <PanelButton
              size="icon"
              variant="ghost"

              onPress={() => remove(optionIndex)}
              accessibilityLabel={t("addOnManagement.removeOption")}
            >
              <AppIcon icon={AppIcons.close} size={20} />
            </PanelButton>
          </View>
        ))}
        {optionsMessage ? (
          <Typography type="body-xs" className="text-destructive">
            {optionsMessage}
          </Typography>
        ) : null}
        <PanelButton variant="outline" onPress={() => append({ name: "", price: "0" })}>
          <AppIcon icon={AppIcons.add} size={16} />
          {t("addOnManagement.addOption")}
        </PanelButton>
      </View>
    </Surface>
  );
}

export default function NewProductAddOnsCard({
  control,
  errors,
  setValue,
}: NewProductAddOnsCardProps) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({ control, name: "add_ons" });

  return (
    <Card className="gap-3 overflow-hidden p-4">
      <Card.Header className="p-0">
        <View className="flex-1 gap-1">
          <Card.Title>{t("productForm.addOnsTitle")}</Card.Title>
          <Card.Description>{t("productForm.addOnsDescription")}</Card.Description>
        </View>
      </Card.Header>
      <Card.Content className="gap-3 p-0">
        {fields.length === 0 ? (
          <View className="items-center gap-2 py-3">
            <Typography type="body-sm" weight="semibold">
              {t("productForm.noAddOns")}
            </Typography>
            <Typography type="body-xs" muted align="center">
              {t("productForm.noAddOnsDescription")}
            </Typography>
          </View>
        ) : null}
        {fields.map((field, index) => (
          <NewProductAddOnGroup
            key={field.id}
            control={control}
            errors={errors}
            setValue={setValue}
            index={index}
            onRemove={() => remove(index)}
          />
        ))}
        <PanelButton
          variant="outline"
          onPress={() =>
            append({
              name: "",
              required: false,
              multiple: false,
              min: "0",
              max: "1",
              options: [{ name: "", price: "0" }],
            })
          }
        >
          <AppIcon icon={AppIcons.add} size={16} />
          {t("productForm.addAddOnGroup")}
        </PanelButton>
      </Card.Content>
    </Card>
  );
}
