import {
  Surface,
  Typography,
  Input as PanelInput,
  Typography as PanelTypography,
  Card,
  NumberInput,
  Switch as PanelSwitch,
  Button as PanelButton,
} from "panelui-native";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useLocalizedNumberInputList } from "@/hooks/use-localized-number-input";
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
    field: { value: minValue, onChange: changeMin, onBlur: blurMin },
  } = useController({ control, name: `add_ons.${index}.min` });
  const {
    field: { value: maxValue, onChange: changeMax, onBlur: blurMax },
  } = useController({ control, name: `add_ons.${index}.max` });
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
            <NumberInput
              containerClassName="flex-1"
              label={t("addOnManagement.minimum")}
              value={Number(minValue || 1)}
              min={1}
              max={Number(maximum) || undefined}
              step={1}
              onValueChange={(value) => changeMin(String(value))}
              onBlur={blurMin}
              errorMessage={groupErrors?.min?.message}
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
            errorMessage={groupErrors?.max?.message}
          />
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
