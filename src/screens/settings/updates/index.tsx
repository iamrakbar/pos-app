import AppUpdateManager from "@/components/common/app-update-manager";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";

export default function UpdateSettingsScreen(): JSX.Element {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 py-6 pb-10 md:px-6"
    >
      <View className="w-full max-w-3xl mx-auto">
        <AppUpdateManager mode="settings" />
      </View>
    </ScrollView>
  );
}
