import AppIcon from "@/components/common/app-icon";
import StringNumberField from "@/components/common/string-number-field";
import type { ProductFormValues } from "@/schemas/product";
import { IDR_NUMBER_FIELD_FORMAT_OPTIONS } from "@/utils/format";
import { Button, Card, Input, Label, Surface, Switch, TextField, Typography } from "heroui-native";
import { Controller, useFieldArray, useWatch } from "react-hook-form";
import type { Control, FieldErrors, UseFormSetValue } from "react-hook-form";
import { View } from "react-native";
import { useTranslation } from "@/stores/use-locale";
import SelectionRuleStepper from "../add-ons/form/selection-rule-stepper";

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
  const required = useWatch({ control, name: `add_ons.${index}.required` });
  const multiple = useWatch({ control, name: `add_ons.${index}.multiple` });
  const minimum = useWatch({ control, name: `add_ons.${index}.min` });
  const maximum = useWatch({ control, name: `add_ons.${index}.max` });
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
          render={({ field: { value, onChange } }) => (
            <TextField className="flex-1" isRequired isInvalid={Boolean(groupErrors?.name)}>
              <Label>{t("addOnManagement.groupName")}</Label>
              <Input
                value={value}
                onChangeText={onChange}
                placeholder={t("addOnManagement.groupNamePlaceholder")}
                variant="secondary"
              />
              {groupErrors?.name?.message ? (
                <Typography type="body-xs" className="text-danger">
                  {groupErrors.name.message}
                </Typography>
              ) : null}
            </TextField>
          )}
        />
        <Button
          size="sm"
          variant="danger-soft"
          isIconOnly
          onPress={onRemove}
          accessibilityLabel={t("productForm.removeAddOnGroup")}
        >
          <AppIcon name="close-outline" size={20} />
        </Button>
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
              <Typography type="body-xs" color="muted">
                {t("addOnManagement.requiredSelectionDescription")}
              </Typography>
            </View>
            <Switch
              isSelected={value}
              onSelectedChange={(selected) => {
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
              <Typography type="body-xs" color="muted">
                {t("addOnManagement.allowMultipleDescription")}
              </Typography>
            </View>
            <Switch
              isSelected={value}
              onSelectedChange={(selected) => {
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
            <Controller
              control={control}
              name={`add_ons.${index}.min`}
              render={({ field: { value, onChange } }) => (
                <SelectionRuleStepper
                  label={t("addOnManagement.minimum")}
                  value={value}
                  onChange={onChange}
                  minValue={1}
                  maxValue={Number(maximum) || undefined}
                  isRequired
                  error={groupErrors?.min?.message}
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
            name={`add_ons.${index}.max`}
            render={({ field: { value, onChange } }) => (
              <SelectionRuleStepper
                label={t("addOnManagement.maximum")}
                value={value}
                onChange={onChange}
                minValue={Math.max(2, Number(minimum) || 2)}
                error={groupErrors?.max?.message}
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

      <View className="gap-3">
        <Typography type="body-sm" weight="semibold">
          {t("addOnManagement.options")}
        </Typography>
        {fields.map((field, optionIndex) => (
          <View key={field.id} className="flex-row items-start gap-3">
            <Controller
              control={control}
              name={`add_ons.${index}.options.${optionIndex}.name`}
              render={({ field: { value, onChange } }) => (
                <TextField
                  className="flex-1"
                  isRequired
                  isInvalid={Boolean(groupErrors?.options?.[optionIndex]?.name)}
                >
                  <Label>{t("addOnManagement.option")}</Label>
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder={t("addOnManagement.optionPlaceholder")}
                    variant="secondary"
                  />
                  {groupErrors?.options?.[optionIndex]?.name?.message ? (
                    <Typography type="body-xs" className="text-danger">
                      {groupErrors.options[optionIndex]?.name?.message}
                    </Typography>
                  ) : null}
                </TextField>
              )}
            />
            <Controller
              control={control}
              name={`add_ons.${index}.options.${optionIndex}.price`}
              render={({ field: { value, onChange } }) => (
                <StringNumberField
                  className="flex-1"
                  label={t("addOnManagement.price")}
                  value={value}
                  onChange={onChange}
                  minValue={0}
                  step={1000}
                  formatOptions={IDR_NUMBER_FIELD_FORMAT_OPTIONS}
                  prefix="Rp"
                  isRequired
                  isInvalid={Boolean(groupErrors?.options?.[optionIndex]?.price)}
                  inputVariant="secondary"
                >
                  {groupErrors?.options?.[optionIndex]?.price?.message ? (
                    <Typography type="body-xs" className="text-danger">
                      {groupErrors.options[optionIndex]?.price?.message}
                    </Typography>
                  ) : null}
                </StringNumberField>
              )}
            />
            <Button
              size="sm"
              variant="danger-soft"
              isIconOnly
              onPress={() => remove(optionIndex)}
              accessibilityLabel={t("addOnManagement.removeOption")}
            >
              <AppIcon name="close-outline" size={20} />
            </Button>
          </View>
        ))}
        {optionsMessage ? (
          <Typography type="body-xs" className="text-danger">
            {optionsMessage}
          </Typography>
        ) : null}
        <Button variant="outline" onPress={() => append({ name: "", price: "0" })}>
          <AppIcon name="add-outline" size={16} />
          <Button.Label>{t("addOnManagement.addOption")}</Button.Label>
        </Button>
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
    <Card className="gap-3 overflow-hidden">
      <Card.Header>
        <View className="flex-1 gap-1">
          <Card.Title>{t("productForm.addOnsTitle")}</Card.Title>
          <Card.Description>{t("productForm.addOnsDescription")}</Card.Description>
        </View>
      </Card.Header>
      <Card.Body className="gap-3">
        {fields.length === 0 ? (
          <View className="items-center gap-2 py-3">
            <Typography type="body-sm" weight="semibold">
              {t("productForm.noAddOns")}
            </Typography>
            <Typography type="body-xs" color="muted" className="text-center">
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
        <Button
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
          <AppIcon name="add-outline" size={16} />
          <Button.Label>{t("productForm.addAddOnGroup")}</Button.Label>
        </Button>
      </Card.Body>
    </Card>
  );
}
