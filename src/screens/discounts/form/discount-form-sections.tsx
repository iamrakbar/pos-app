import { Typography ,
  Button as PanelButton,
  DatePicker,
  Input as PanelInput,
  Label as PanelLabel,
  Typography as PanelTypography, Card, Switch } from "panelui-native";
import { formatLocalDate, parseLocalDate } from "@/utils/local-date";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useLocalizedNumberInput } from "@/hooks/use-localized-number-input";
import type { Translate } from "@/locales";
import type { POSProduct } from "@/types/pos";
import type { DiscountFormValues } from "@/schemas/discount";
import { formatDate, IDR_NUMBER_FIELD_FORMAT_OPTIONS, RUPIAH_PREFIX } from "@/utils/format";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller, useController, useWatch } from "react-hook-form";
import { Pressable, View } from "react-native";

export function DiscountDetailsCard({
  control,
  errors,
  localeTag,
  presentation,
  t,
}: {
  control: Control<DiscountFormValues>;
  errors: FieldErrors<DiscountFormValues>;
  localeTag: string;
  presentation: "popover" | "bottom-sheet";
  t: Translate;
}) {
  const unit = useWatch({ control, name: "unit" });
  const {
    field: {
      value: discountValueValue,
      onChange: discountValueChange,
      onBlur: discountValueBlur,
      ref: discountValueRef,
    },
  } = useController({ control, name: "value" });
  const { localizedInputProps: discountInput } = useLocalizedNumberInput({
    value: discountValueValue,
    onChange: discountValueChange,
    formatOptions:
      unit === "fixed"
        ? IDR_NUMBER_FIELD_FORMAT_OPTIONS
        : { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 2 },
    minValue: 0,
    maxValue: unit === "fixed" ? undefined : 100,
    inputProps: { onBlur: discountValueBlur },
  });

  return (
    <Card className="w-full max-w-3xl gap-5 p-4">
      <Card.Header className="p-0">
        <View className="gap-1">
          <Card.Title>{t("discounts.detailsTitle")}</Card.Title>
          <Card.Description>{t("discounts.detailsDescription")}</Card.Description>
        </View>
      </Card.Header>
      <Card.Content className="gap-5 p-0">
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <PanelInput
              ref={ref}
              label={t("discounts.name")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("discounts.namePlaceholder")}
              isRequired
              errorMessage={errors.name?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="unit"
          render={({ field: { value, onChange } }) => (
            <View className="gap-2">
              <PanelLabel>{t("discounts.unit")}</PanelLabel>
              <View className="flex-row gap-2">
                {(["percentage", "fixed"] as const).map((unit) => (
                  <PanelButton
                    key={unit}
                    variant={value === unit ? "primary" : "secondary"}
                    onPress={() => onChange(unit)}
                    className="flex-1"
                  >
                    {unit === "percentage" ? t("discounts.percentage") : t("discounts.fixed")}
                  </PanelButton>
                ))}
              </View>
            </View>
          )}
        />
        <PanelInput
          ref={discountValueRef}
          label={t("discounts.value")}
          placeholder="0"
          variant="filled"
          isRequired
          errorMessage={errors.value?.message}
          keyboardType="numeric"
          startContent={
            unit === "fixed" ? (
              <PanelTypography type="body-sm" weight="medium" muted>
                {RUPIAH_PREFIX}
              </PanelTypography>
            ) : undefined
          }
          interactiveContent={false}
          {...discountInput}
        />
        <View className="gap-1">
          <Typography type="body-xs" muted>
            {t("discounts.dateHelp")}
          </Typography>
          <View className="flex-row gap-3">
            {(["start", "end"] as const).map((fieldName) => (
              <Controller
                key={fieldName}
                control={control}
                name={fieldName}
                render={({ field: { value, onChange } }) => (
                  <View className="flex-1 gap-1">
                    <PanelLabel>{t(`discounts.${fieldName}`)}</PanelLabel>
                    <DatePicker
                      selected={
                        value && !Number.isNaN(parseLocalDate(value).getTime())
                          ? parseLocalDate(value)
                          : undefined
                      }
                      onSelect={(date) => onChange(date ? formatLocalDate(date) : "")}
                      locale={localeTag}
                      presentation={presentation}
                    >
                      <PanelButton
                        variant="outline"
                        accessibilityLabel={`${t(`discounts.${fieldName}`)}: ${value ? formatDate(parseLocalDate(value)) : t(`discounts.${fieldName}`)}`}
                      >
                        {value ? formatDate(parseLocalDate(value)) : t(`discounts.${fieldName}`)}
                      </PanelButton>
                    </DatePicker>
                    {errors[fieldName]?.message ? (
                      <PanelTypography type="body-xs" className="text-destructive">
                        {errors[fieldName]?.message}
                      </PanelTypography>
                    ) : null}
                  </View>
                )}
              />
            ))}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

export function DiscountProductsCard({
  selectedProductIds,
  selectedProducts,
  error,
  muted,
  onChangeProducts,
  t,
}: {
  selectedProductIds: string[];
  selectedProducts: POSProduct[];
  error?: string;
  muted: string;
  onChangeProducts: () => void;
  t: Translate;
}) {
  return (
    <Card className="w-full max-w-3xl p-4">
      <Card.Header className="p-0">
        <View className="gap-1">
          <Card.Title>{t("discounts.productsTitle")}</Card.Title>
          <Card.Description>{t("discounts.productsDescription")}</Card.Description>
        </View>
      </Card.Header>
      <Card.Content className="p-0">
        <Pressable
          accessibilityRole="button"
          onPress={onChangeProducts}
          className="flex-row items-center gap-3 rounded-xl bg-surface-secondary px-3 py-3 active:bg-surface-tertiary"
        >
          <View className="flex-1 gap-1">
            <Typography type="body-sm" weight="semibold">
              {selectedProductIds.length
                ? t("discounts.selectedProducts", { count: selectedProductIds.length })
                : t("discounts.noProductsSelected")}
            </Typography>
            <Typography type="body-xs" muted numberOfLines={1}>
              {selectedProductIds.length
                ? selectedProducts.map((product) => product.name).join(", ")
                : t("discounts.noProductsSelected")}
            </Typography>
            {error ? (
              <PanelTypography type="body-xs" className="text-destructive">
                {error}
              </PanelTypography>
            ) : null}
          </View>
          <Typography type="body-sm" className="text-accent">
            {t("discounts.changeProducts")}
          </Typography>
          <AppIcon icon={AppIcons.chevronForward} size={16} color={muted} />
        </Pressable>
      </Card.Content>
    </Card>
  );
}

export function DiscountStatusCard({
  control,
  t,
}: {
  control: Control<DiscountFormValues>;
  t: Translate;
}) {
  return (
    <Card className="w-full max-w-3xl p-4">
      <Card.Header className="p-0">
        <Card.Title>{t("discounts.statusTitle")}</Card.Title>
      </Card.Header>
      <Card.Content className="p-0">
        <Controller
          control={control}
          name="active"
          render={({ field: { value, onChange } }) => (
            <View className="flex-row items-center gap-3">
              <Switch value={value} onValueChange={onChange} label={t("discounts.statusTitle")} />
              <View className="flex-1">
                <Typography type="body-sm" weight="semibold">
                  {value ? t("common.active") : t("common.inactive")}
                </Typography>
                <Typography type="body-xs" muted>
                  {t("discounts.statusDescription")}
                </Typography>
              </View>
            </View>
          )}
        />
      </Card.Content>
    </Card>
  );
}
