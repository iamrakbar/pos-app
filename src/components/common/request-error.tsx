import { getErrorMessage } from "@/api/api-error";
import { useTranslation } from "@/stores/use-locale";
import { Alert, Button } from "panelui-native";
import { View } from "react-native";

type RequestErrorProps = {
  error: unknown;
  onRetry: () => void;
};

export default function RequestError({ error, onRetry }: RequestErrorProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
      <Alert variant="destructive">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Description>{getErrorMessage(error)}</Alert.Description>
        </Alert.Content>
      </Alert>
      <Button variant="outline" onPress={onRetry}>
        {t("common.retry")}
      </Button>
    </View>
  );
}
