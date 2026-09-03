import { Calendar, DatePicker, type DatePickerOption } from "heroui-native-pro";
import { Label } from "heroui-native";
import React from "react";

type DatePickerPresentation = "dialog" | "popover" | "bottom-sheet";

export default function DatePickerField({
  className,
  label,
  value,
  onValueChange,
  locale,
  presentation,
  isRequired,
  isInvalid,
}: {
  className?: string;
  label: string;
  value: DatePickerOption | undefined;
  onValueChange: (value: DatePickerOption | undefined) => void;
  locale: string;
  presentation: DatePickerPresentation;
  isRequired?: boolean;
  isInvalid?: boolean;
}): React.JSX.Element {
  return (
    <DatePicker
      className={className}
      value={value}
      onValueChange={onValueChange}
      isRequired={isRequired}
      isInvalid={isInvalid}
      locale={locale}
      dateDisplayFormat="medium"
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
  );
}
