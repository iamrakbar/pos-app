import AppIcon from "@/components/common/app-icon";
import SettingsMenuRow from "@/components/common/settings-menu-row";
import { useRouter } from "expo-router";
import { ListGroup, Separator, Typography, useThemeColor } from "heroui-native";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

type InventoryMenuItem = {
  id: string;
  href: string;
  icon: React.ComponentProps<typeof AppIcon>["name"];
  label: string;
  description: string;
};

export default function InventoryOverviewScreen(): JSX.Element {
  const router = useRouter();
  const { t } = useTranslation();
  const [themeColorMuted] = useThemeColor(["muted"]);
  const manageItems: InventoryMenuItem[] = [
    {
      id: "ingredients",
      href: "/settings/inventory/ingredients",
      icon: "nutrition-outline",
      label: t("navigation.ingredients"),
      description: t("navigation.ingredientsDescription"),
    },
    {
      id: "suppliers",
      href: "/settings/inventory/suppliers",
      icon: "people-outline",
      label: t("navigation.suppliers"),
      description: t("navigation.suppliersDescription"),
    },
  ];
  const monitorItems: InventoryMenuItem[] = [
    {
      id: "movements",
      href: "/settings/inventory/movements",
      icon: "swap-vertical-outline",
      label: t("navigation.movements"),
      description: t("navigation.movementsDescription"),
    },
    {
      id: "operations",
      href: "/settings/inventory/operations",
      icon: "list-outline",
      label: t("navigation.operations"),
      description: t("navigation.operationsDescription"),
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="flex-grow px-4 py-6 md:px-6"
    >
      <View className="mx-auto w-full max-w-3xl gap-6 pb-safe">
        <View className="gap-2">
          <Typography type="body-sm" weight="semibold">
            {t("navigation.inventoryManage")}
          </Typography>
          <ListGroup>
            {manageItems.map((item, index) => (
              <View key={item.id}>
                <SettingsMenuRow
                  item={item}
                  iconColor={themeColorMuted}
                  onPress={() => router.push(item.href as never)}
                />
                {index < manageItems.length - 1 ? <Separator className="mx-4" /> : null}
              </View>
            ))}
          </ListGroup>
        </View>

        <View className="gap-2">
          <Typography type="body-sm" weight="semibold">
            {t("navigation.inventoryMonitor")}
          </Typography>
          <ListGroup>
            {monitorItems.map((item, index) => (
              <View key={item.id}>
                <SettingsMenuRow
                  item={item}
                  iconColor={themeColorMuted}
                  onPress={() => router.push(item.href as never)}
                />
                {index < monitorItems.length - 1 ? <Separator className="mx-4" /> : null}
              </View>
            ))}
          </ListGroup>
        </View>
      </View>
    </ScrollView>
  );
}
