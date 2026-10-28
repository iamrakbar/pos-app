import { useCSSVariable } from "uniwind";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useRouter } from "expo-router";
import { Frame, Typography } from "panelui-native";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";
import { useAuth } from "@/stores/use-auth";
import { useMerchantProfile } from "@/hooks/db/use-merchant-profile";
import { hasMerchantFeature } from "@/utils/merchant-features";

type InventoryMenuItem = {
  id: string;
  href: string;
  icon: React.ComponentProps<typeof AppIcon>["icon"];
  label: string;
  description: string;
};

export default function InventoryOverviewScreen(): JSX.Element {
  const router = useRouter();
  const { t } = useTranslation();
  const [themeColorMuted] = useCSSVariable(["--color-muted-foreground"]) as [string];
  const activeMerchant = useAuth((state) => state.activeMerchant);
  const { data: merchantProfile } = useMerchantProfile();
  const recipeInventoryEnabled = hasMerchantFeature(
    merchantProfile?.features ?? activeMerchant?.features,
    "inventory_recipe"
  );
  const manageItems: InventoryMenuItem[] = recipeInventoryEnabled
    ? [
        {
          id: "ingredients",
          href: "/settings/inventory/ingredients",
          icon: AppIcons.food,
          label: t("navigation.ingredients"),
          description: t("navigation.ingredientsDescription"),
        },
        {
          id: "suppliers",
          href: "/settings/inventory/suppliers",
          icon: AppIcons.people,
          label: t("navigation.suppliers"),
          description: t("navigation.suppliersDescription"),
        },
      ]
    : [];
  const monitorItems: InventoryMenuItem[] = [
    {
      id: "movements",
      href: "/settings/inventory/movements",
      icon: AppIcons.swapVertical,
      label: t("navigation.movements"),
      description: t("navigation.movementsDescription"),
    },
    {
      id: "operations",
      href: "/settings/inventory/operations",
      icon: AppIcons.list,
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
        {manageItems.length > 0 ? (
          <View className="gap-2">
            <Typography type="body-sm" weight="semibold">
              {t("navigation.inventoryManage")}
            </Typography>
            <Frame variant="plain">
              <Frame.Panel>
                {manageItems.map((item) => (
                  <Frame.Row key={item.id} chevron onPress={() => router.push(item.href as never)}>
                    <Frame.Media>
                      <AppIcon icon={item.icon} size={21} color={themeColorMuted} />
                    </Frame.Media>
                    <Frame.Content>
                      <Frame.Title>{item.label}</Frame.Title>
                      <Frame.Description numberOfLines={2}>{item.description}</Frame.Description>
                    </Frame.Content>
                  </Frame.Row>
                ))}
              </Frame.Panel>
            </Frame>
          </View>
        ) : null}

        <View className="gap-2">
          <Typography type="body-sm" weight="semibold">
            {t("navigation.inventoryMonitor")}
          </Typography>
          <Frame variant="plain">
            <Frame.Panel>
              {monitorItems.map((item) => (
                <Frame.Row key={item.id} chevron onPress={() => router.push(item.href as never)}>
                  <Frame.Media>
                    <AppIcon icon={item.icon} size={21} color={themeColorMuted} />
                  </Frame.Media>
                  <Frame.Content>
                    <Frame.Title>{item.label}</Frame.Title>
                    <Frame.Description numberOfLines={2}>{item.description}</Frame.Description>
                  </Frame.Content>
                </Frame.Row>
              ))}
            </Frame.Panel>
          </Frame>
        </View>
      </View>
    </ScrollView>
  );
}
