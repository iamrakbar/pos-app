import { Component, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Typography } from "heroui-native";
import AppIcon from "@/components/common/app-icon";
import { t } from "@/locales";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    if (__DEV__) console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 items-center justify-center gap-3 bg-background px-6">
          <AppIcon name="warning-outline" size={40} color="#ef4444" />
          <Typography className="text-base font-semibold text-foreground text-center">
            {t("errors.unexpected")}
          </Typography>
          <Typography className="text-sm text-muted-foreground text-center">
            {this.state.error.message}
          </Typography>
          <Pressable
            onPress={() => this.setState({ error: null })}
            className="mt-2 px-4 py-2 rounded-full border border-border active:opacity-70"
          >
            <Typography className="text-sm text-foreground">{t("errors.reload")}</Typography>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
