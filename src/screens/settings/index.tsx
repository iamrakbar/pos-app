import NavigationFrameRow from "@/components/common/navigation-frame-row";
import ConfirmationDialog from "@/components/common/confirmation-dialog";
import { Typography, Button, Frame } from "panelui-native";
import { useCSSVariable } from "uniwind";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";
import { useAuth } from "@/stores/use-auth";
import { useTranslation } from "@/stores/use-locale";
import { useState } from "react";
import { useMerchantProfile } from "@/hooks/db/use-merchant-profile";
import { hasMerchantFeature } from "@/utils/merchant-features";

type SettingsItem = {
  id: string;
  href: string;
  icon: React.ComponentProps<typeof AppIcon>["icon"];
  label: string;
  description: string;
};

export default function SettingsScreen(): JSX.Element {
  const router = useRouter();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [themeColorMuted, themeColorDestructiveForeground] = useCSSVariable([
    "--color-muted-foreground",
    "--color-destructive-solid-foreground",
  ]) as [string, string];
  const logout = useAuth((s) => s.logout);
  const activeMerchant = useAuth((s) => s.activeMerchant);
  const { data: merchantProfile } = useMerchantProfile();
  const inventoryEnabled = hasMerchantFeature(
    merchantProfile?.features ?? activeMerchant?.features,
    "inventory"
  );
  const { t } = useTranslation();
  const accountItems: SettingsItem[] = [
    {
      id: "account",
      href: "/settings/account",
      icon: AppIcons.personCircle,
      label: t("settings.account"),
      description: t("settings.accountDescription"),
    },
  ];
  const storeItems: SettingsItem[] = [
    {
      id: "merchant-profile",
      href: "/settings/merchant-profile",
      icon: AppIcons.storefront,
      label: t("settings.merchantProfile"),
      description: t("settings.merchantProfileDescription"),
    },
    {
      id: "payments",
      href: "/settings/payments",
      icon: AppIcons.card,
      label: t("settings.payments"),
      description: t("settings.paymentsDescription"),
    },
    {
      id: "categories",
      href: "/settings/categories",
      icon: AppIcons.layers,
      label: t("settings.categories"),
      description: t("settings.categoriesDescription"),
    },
    {
      id: "discounts",
      href: "/settings/discounts",
      icon: AppIcons.priceTag,
      label: t("settings.discounts"),
      description: t("settings.discountsDescription"),
    },
    {
      id: "areas",
      href: "/settings/areas",
      icon: AppIcons.diningTable,
      label: t("settings.areas"),
      description: t("settings.areasDescription"),
    },
  ];
  if (inventoryEnabled) {
    storeItems.push({
      id: "inventory",
      href: "/settings/inventory",
      icon: AppIcons.cube,
      label: t("navigation.inventory"),
      description: t("navigation.descriptions.inventory"),
    });
  }
  const printingItems: SettingsItem[] = [
    {
      id: "printer",
      href: "/settings/printers",
      icon: AppIcons.print,
      label: t("settings.printer"),
      description: t("settings.printerDescription"),
    },
    {
      id: "receipt",
      href: "/settings/receipt",
      icon: AppIcons.receipt,
      label: t("settings.receipt"),
      description: t("settings.receiptDescription"),
    },
  ];
  const applicationItems: SettingsItem[] = [
    {
      id: "notifications",
      href: "/settings/notifications",
      icon: AppIcons.notifications,
      label: t("settings.notifications"),
      description: t("settings.notificationsDescription"),
    },
    {
      id: "preferences",
      href: "/settings/preferences",
      icon: AppIcons.options,
      label: t("settings.appPreferences"),
      description: t("settings.appPreferencesDescription"),
    },
  ];

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="flex-grow px-4 py-6 md:px-6"
      >
        <View className="mx-auto w-full max-w-3xl flex-1 justify-between gap-8 pb-safe">
          <View className="gap-6">
            {[
              { title: t("settings.accountAndAccess"), items: accountItems },
              { title: t("settings.storeSetup"), items: storeItems },
              { title: t("settings.printing"), items: printingItems },
              { title: t("settings.application"), items: applicationItems },
            ].map((group) => (
              <View key={group.title} className="gap-2">
                <Typography type="body-sm" weight="semibold">
                  {group.title}
                </Typography>
                <Frame variant="plain">
                  <Frame.Panel>
                    {group.items.map((item) => (
                      <NavigationFrameRow
                        key={item.id}
                        icon={item.icon}
                        color={themeColorMuted}
                        label={item.label}
                        description={item.description}
                        onPress={() => router.push(item.href as never)}
                      />
                    ))}
                  </Frame.Panel>
                </Frame>
              </View>
            ))}
          </View>

          <Button variant="destructive" onPress={() => setIsLogoutOpen(true)} className="w-full">
            <AppIcon icon={AppIcons.logout} size={18} color={themeColorDestructiveForeground} />
            {t("settings.logout")}
          </Button>
        </View>
      </ScrollView>
      <ConfirmationDialog
        open={isLogoutOpen}
        onOpenChange={setIsLogoutOpen}
        title={t("logout.title")}
        description={t("logout.description")}
        onConfirm={logout}
        confirmLabel={t("logout.confirm")}
      />
    </>
  );
}
