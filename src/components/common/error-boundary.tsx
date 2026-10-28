import { Component, type ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, EmptyState, Typography } from "panelui-native";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { t } from "@/locales";
import { Uniwind } from "uniwind";

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
        <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom", "left", "right"]}>
          <View className="flex-1 items-center justify-center px-6 py-8">
            <EmptyState className="w-full max-w-md">
              <EmptyState.Header>
                <EmptyState.Media variant="icon">
                  <AppIcon
                    icon={AppIcons.warning}
                    size={22}
                    color={Uniwind.getCSSVariable("--color-destructive") as string}
                  />
                </EmptyState.Media>
                <EmptyState.Title>{t("errors.unexpected")}</EmptyState.Title>
                <EmptyState.Description>{t("errors.recoveryDescription")}</EmptyState.Description>
              </EmptyState.Header>
              <EmptyState.Content>
                <Button fullWidth onPress={() => this.setState({ error: null })}>
                  {t("errors.reload")}
                </Button>
                {__DEV__ ? (
                  <Typography type="body-xs" muted align="center" selectable>
                    {this.state.error.message}
                  </Typography>
                ) : null}
              </EmptyState.Content>
            </EmptyState>
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}
