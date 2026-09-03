import { Button, Typography } from "heroui-native";
import React from "react";
import { View } from "react-native";

export default function ReorderChangesBanner({
  message,
  isSaving,
  cancelLabel,
  onCancel,
  onSave,
  saveLabel,
  savingLabel,
}: {
  message: string;
  isSaving: boolean;
  cancelLabel: string;
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
  savingLabel: string;
}): React.JSX.Element {
  return (
    <View className="flex-row items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 md:px-6">
      <Typography type="body-sm" color="muted" className="flex-1">
        {message}
      </Typography>
      <View className="flex-row gap-2">
        <Button size="sm" variant="ghost" onPress={onCancel} isDisabled={isSaving}>
          <Button.Label>{cancelLabel}</Button.Label>
        </Button>
        <Button size="sm" onPress={onSave} isDisabled={isSaving}>
          <Button.Label>{isSaving ? savingLabel : saveLabel}</Button.Label>
        </Button>
      </View>
    </View>
  );
}
