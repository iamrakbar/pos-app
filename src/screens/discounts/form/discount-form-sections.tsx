import AppIcon from "@/components/common/app-icon";
import StringNumberField from "@/components/common/string-number-field";
import type { Translate } from "@/locales";
import type { POSProduct } from "@/types/pos";
import type { DiscountFormValues } from "@/schemas/discount";
import { formatDate, IDR_NUMBER_FIELD_FORMAT_OPTIONS } from "@/utils/format";
import { Calendar, DatePicker, type DatePickerOption } from "heroui-native-pro";
import { Button, Card, Input, Label, Switch, TextField, Typography } from "heroui-native";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import { Pressable, View } from "react-native";

function FieldMessage({ message }: { message?: string }) {
  return message ? (
    <Typography type="body-xs" className="text-danger">
      {message}
    </Typography>
  ) : null;
}

function toDateOption(value: string): DatePickerOption | undefined {
  if (!value) return undefined;
  return {
    value,
    label: formatDate(new Date(`${value}T00:00:00`)),
  };
}

function DiscountDatePicker({
  label,
  value,
  onChange,
  presentation,
  isInvalid,
  message,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  presentation: "dialog" | "popover" | "bottom-sheet";
  isInvalid: boolean;
  message?: string;
}) {
  return (
    <View className="flex-1 gap-1">
      <DatePicker
        value={toDateOption(value)}
        onValueChange={(next) => onChange(next?.value ?? "")}
        locale="id-ID"
        dateDisplayFormat="medium"
        isInvalid={isInvalid}
      >
        <Label>{label}</Label>
        <DatePicker.Select presentation={presentation}>
          <DatePicker.Trigger>
            <DatePicker.Value />
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
          <DatePicker.Portal>
            <DatePicker.Overlay />
            <DatePicker.Content
              presentation={presentation}
              width={presentation === "popover" ? "trigger" : undefined}
            >
              <DatePicker.Calendar>
                <Calendar.Header>
                  <Calendar.Heading />
                  <Calendar.NavButton slot="previous" />
                  <Calendar.NavButton slot="next" />
                </Calendar.Header>
                <Calendar.Grid>
                  <Calendar.GridHeader>
                    {(day) => <Calendar.HeaderCell day={day} />}
                  </Calendar.GridHeader>
                  <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                </Calendar.Grid>
              </DatePicker.Calendar>
            </DatePicker.Content>
          </DatePicker.Portal>
        </DatePicker.Select>
      </DatePicker>
      <FieldMessage message={message} />
    </View>
  );
}

export function DiscountDetailsCard({
  control,
  errors,
  presentation,
  t,
}: {
  control: Control<DiscountFormValues>;
  errors: FieldErrors<DiscountFormValues>;
  presentation: "dialog" | "popover" | "bottom-sheet";
  t: Translate;
}) {
  const unit = useWatch({ control, name: "unit" });

  return (
    <Card className="w-full max-w-3xl gap-5">
      <Card.Header>
        <View className="gap-1">
          <Card.Title>{t("discounts.detailsTitle")}</Card.Title>
          <Card.Description>{t("discounts.detailsDescription")}</Card.Description>
        </View>
      </Card.Header>
      <Card.Body className="gap-5">
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange } }) => (
            <TextField isRequired isInvalid={!!errors.name}>
              <Label>{t("discounts.name")}</Label>
              <Input
                value={value}
                onChangeText={onChange}
                placeholder={t("discounts.namePlaceholder")}
              />
              <FieldMessage message={errors.name?.message} />
            </TextField>
          )}
        />
        <Controller
          control={control}
          name="unit"
          render={({ field: { value, onChange } }) => (
            <View className="gap-2">
              <Label>{t("discounts.unit")}</Label>
              <View className="flex-row gap-2">
                {(["percentage", "fixed"] as const).map((unit) => (
                  <Button
                    key={unit}
                    variant={value === unit ? "primary" : "secondary"}
                    onPress={() => onChange(unit)}
                    className="flex-1"
                  >
                    <Button.Label>
                      {unit === "percentage" ? t("discounts.percentage") : t("discounts.fixed")}
                    </Button.Label>
                  </Button>
                ))}
              </View>
            </View>
          )}
        />
        <Controller
          control={control}
          name="value"
          render={({ field: { value, onChange } }) => (
            <StringNumberField
              label={t("discounts.value")}
              value={value}
              onChange={onChange}
              placeholder="0"
              minValue={0}
              maxValue={unit === "percentage" ? 100 : undefined}
              step={unit === "fixed" ? 1000 : 1}
              formatOptions={
                unit === "fixed" ? IDR_NUMBER_FIELD_FORMAT_OPTIONS : { maximumFractionDigits: 2 }
              }
              prefix={unit === "fixed" ? "Rp" : undefined}
              inputVariant="secondary"
              isRequired
              isInvalid={!!errors.value}
            >
              <FieldMessage message={errors.value?.message} />
            </StringNumberField>
          )}
        />
        <View className="gap-1">
          <Typography type="body-xs" color="muted">
            {t("discounts.dateHelp")}
          </Typography>
          <View className="flex-row gap-3">
            {(["start", "end"] as const).map((fieldName) => (
              <Controller
                key={fieldName}
                control={control}
                name={fieldName}
                render={({ field: { value, onChange } }) => (
                  <DiscountDatePicker
                    label={t(`discounts.${fieldName}`)}
                    value={value}
                    onChange={onChange}
                    presentation={presentation}
                    isInvalid={!!errors[fieldName]}
                    message={errors[fieldName]?.message}
                  />
                )}
              />
            ))}
          </View>
        </View>
      </Card.Body>
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
    <Card className="w-full max-w-3xl">
      <Card.Header>
        <View className="gap-1">
          <Card.Title>{t("discounts.productsTitle")}</Card.Title>
          <Card.Description>{t("discounts.productsDescription")}</Card.Description>
        </View>
      </Card.Header>
      <Card.Body>
        <Pressable
          accessibilityRole="button"
          onPress={onChangeProducts}
          className="flex-row items-center gap-3 rounded-panel-inner bg-surface-secondary px-3 py-3 active:bg-surface-tertiary"
        >
          <View className="flex-1 gap-1">
            <Typography type="body-sm" weight="semibold">
              {selectedProductIds.length
                ? t("discounts.selectedProducts", { count: selectedProductIds.length })
                : t("discounts.noProductsSelected")}
            </Typography>
            <Typography type="body-xs" color="muted" numberOfLines={1}>
              {selectedProductIds.length
                ? selectedProducts.map((product) => product.name).join(", ")
                : t("discounts.noProductsSelected")}
            </Typography>
            <FieldMessage message={error} />
          </View>
          <Typography type="body-sm" className="text-accent">
            {t("discounts.changeProducts")}
          </Typography>
          <AppIcon name="chevron-forward" size={16} color={muted} />
        </Pressable>
      </Card.Body>
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
    <Card className="w-full max-w-3xl">
      <Card.Header>
        <Card.Title>{t("discounts.statusTitle")}</Card.Title>
      </Card.Header>
      <Card.Body>
        <Controller
          control={control}
          name="active"
          render={({ field: { value, onChange } }) => (
            <View className="flex-row items-center gap-3">
              <Switch isSelected={value} onSelectedChange={onChange}>
                <Switch.Thumb />
              </Switch>
              <View className="flex-1">
                <Typography type="body-sm" weight="semibold">
                  {value ? t("common.active") : t("common.inactive")}
                </Typography>
                <Typography type="body-xs" color="muted">
                  {t("discounts.statusDescription")}
                </Typography>
              </View>
            </View>
          )}
        />
      </Card.Body>
    </Card>
  );
}
