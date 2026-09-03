import { Button, Typography } from "heroui-native";
import React from "react";
import { View } from "react-native";

export function FieldMessage({ message }: { message?: string }): React.JSX.Element | null {
  return message ? (
    <Typography type="body-xs" className="text-danger">
      {message}
    </Typography>
  ) : null;
}

export function OverlayFooter({
  isPending,
  submitLabel,
  pendingLabel,
  cancelLabel,
  onSubmit,
  onCancel,
}: {
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
  cancelLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
}): React.JSX.Element {
  return (
    <View className="gap-3 px-5 pb-safe pt-4 flex-row">
      <Button variant="ghost" onPress={onCancel} isDisabled={isPending}>
        <Button.Label>{cancelLabel}</Button.Label>
      </Button>
      <Button onPress={onSubmit} isDisabled={isPending} className="flex-1">
        <Button.Label>{isPending ? pendingLabel : submitLabel}</Button.Label>
      </Button>
    </View>
  );
}
