import type { AddOnManagementValues } from "@/schemas/add-on-management";
import StringNumberField from "@/components/common/string-number-field";
import { Card, Input, Label, Switch, TextField, Typography } from "heroui-native";
import { Controller, useWatch } from "react-hook-form";
import type { Control, FieldErrors, UseFormSetValue } from "react-hook-form";
import { View } from "react-native";

type SelectionRulesCardProps = {
  control: Control<AddOnManagementValues>;
  errors: FieldErrors<AddOnManagementValues>;
  setValue: UseFormSetValue<AddOnManagementValues>;
};

export default function SelectionRulesCard({ control, errors, setValue }: SelectionRulesCardProps) {
  const required = useWatch({ control, name: "required" });
  const multiple = useWatch({ control, name: "multiple" });

  return (
    <Card className="gap-3">
      <Card.Header>
        <View className="gap-1">
          <Card.Title>Selection Rules</Card.Title>
          <Card.Description>Define how many options the cashier can select.</Card.Description>
        </View>
      </Card.Header>
      <Card.Body className="gap-4">
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange } }) => (
            <TextField isRequired isInvalid={Boolean(errors.name)}>
              <Label>Group name</Label>
              <Input value={value} onChangeText={onChange} placeholder="Toppings" />
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
                  Required selection
                </Typography>
                <Typography type="body-xs" color="muted">
                  The cashier must choose before adding the product.
                </Typography>
              </View>
              <Switch
                isSelected={value}
                onSelectedChange={(selected) => {
                  onChange(selected);
                  if (selected && multiple) {
                    setValue("min", "1", {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
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
                  Allow multiple selections
                </Typography>
                <Typography type="body-xs" color="muted">
                  Let the cashier choose more than one option.
                </Typography>
              </View>
              <Switch
                isSelected={value}
                onSelectedChange={(selected) => {
                  onChange(selected);
                  if (selected) {
                    setValue("max", "2", { shouldDirty: true, shouldValidate: true });
                    if (required) {
                      setValue("min", "1", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }
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
                  <StringNumberField
                    className="flex-1"
                    label="Minimum"
                    value={value}
                    onChange={onChange}
                    minValue={1}
                    isRequired
                    isInvalid={Boolean(errors.min)}
                  >
                    {errors.min?.message ? (
                      <Typography type="body-xs" className="text-danger">
                        {errors.min.message}
                      </Typography>
                    ) : null}
                  </StringNumberField>
                )}
              />
            ) : null}
            <Controller
              control={control}
              name="max"
              render={({ field: { value, onChange } }) => (
                <StringNumberField
                  className="flex-1"
                  label="Maximum"
                  value={value}
                  onChange={onChange}
                  minValue={2}
                  isRequired
                  isInvalid={Boolean(errors.max)}
                >
                  {errors.max?.message ? (
                    <Typography type="body-xs" className="text-danger">
                      {errors.max.message}
                    </Typography>
                  ) : null}
                </StringNumberField>
              )}
            />
          </View>
        ) : (
          <Typography type="body-xs" color="muted">
            {required
              ? "Exactly one option must be selected."
              : "The cashier may select one option or skip this group."}
          </Typography>
        )}
      </Card.Body>
    </Card>
  );
}
