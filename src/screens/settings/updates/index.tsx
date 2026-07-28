import AppUpdateManager from "@/components/common/app-update-manager";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";

export default function UpdateSettingsScreen(): JSX.Element {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 py-6 pb-10 md:px-6"
    >
      <View className="gap-4">
        <AppUpdateManager mode="settings" />
      </View>
    </ScrollView>
  );
}
