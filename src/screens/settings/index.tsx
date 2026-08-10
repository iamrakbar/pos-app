import AppIcon from "@/components/common/app-icon";
import { useRouter } from "expo-router";
import { Button, ListGroup, Separator, Typography, useThemeColor } from "heroui-native";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";
import { useAuth } from "@/stores/use-auth";
import { useTranslation } from "@/stores/use-locale";
import LogoutConfirmationDialog from "@/components/common/logout-confirmation-dialog";
import { useState } from "react";

type SettingsItem = {
  id: string;
  href: string;
  icon: React.ComponentProps<typeof AppIcon>["name"];
  label: string;
  description: string;
};

function SettingsLinkRow({
  item,
  iconColor,
  onPress,
}: {
  item: SettingsItem;
  iconColor: string;
  onPress: () => void;
}) {
  return (
    <ListGroup.Item accessibilityRole="button" onPress={onPress}>
      <ListGroup.ItemPrefix>
        <AppIcon name={item.icon} size={21} color={iconColor} />
      </ListGroup.ItemPrefix>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{item.label}</ListGroup.ItemTitle>
        <ListGroup.ItemDescription numberOfLines={2}>{item.description}</ListGroup.ItemDescription>
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix />
    </ListGroup.Item>
  );
}

export default function SettingsScreen(): JSX.Element {
  const router = useRouter();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [themeColorMuted, themeColorDangerSoftForeground] = useThemeColor([
    "muted",
    "danger-soft-foreground",
  ]);
  const logout = useAuth((s) => s.logout);
  const { t } = useTranslation();
  const accountItems: SettingsItem[] = [
    {
      id: "account",
      href: "/settings/account",
      icon: "person-circle-outline",
      label: t("settings.account"),
      description: t("settings.accountDescription"),
    },
  ];
  const storeItems: SettingsItem[] = [
    {
      id: "payments",
      href: "/settings/payments",
      icon: "card-outline",
      label: t("settings.payments"),
      description: t("settings.paymentsDescription"),
    },
    {
      id: "categories",
      href: "/categories",
      icon: "albums-outline",
      label: t("settings.categories"),
      description: t("settings.categoriesDescription"),
    },
    {
      id: "areas",
      href: "/settings/areas",
      icon: "restaurant-outline",
      label: t("settings.areas"),
      description: t("settings.areasDescription"),
    },
  ];
  const printingItems: SettingsItem[] = [
    {
      id: "printer",
      href: "/settings/printers",
      icon: "print-outline",
      label: t("settings.printer"),
      description: t("settings.printerDescription"),
    },
    {
      id: "receipt",
      href: "/settings/receipt",
      icon: "receipt-outline",
      label: t("settings.receipt"),
      description: t("settings.receiptDescription"),
    },
  ];
  const applicationItems: SettingsItem[] = [
    {
      id: "notifications",
      href: "/settings/notifications",
      icon: "notifications-outline",
      label: t("settings.notifications"),
      description: t("settings.notificationsDescription"),
    },
    {
      id: "preferences",
      href: "/settings/preferences",
      icon: "options-outline",
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
                <ListGroup>
                  {group.items.map((item, index) => (
                    <View key={item.id}>
                      <SettingsLinkRow
                        item={item}
                        iconColor={themeColorMuted}
                        onPress={() => router.push(item.href as never)}
                      />
                      {index < group.items.length - 1 ? <Separator className="mx-4" /> : null}
                    </View>
                  ))}
                </ListGroup>
              </View>
            ))}
          </View>

          <Button variant="danger-soft" onPress={() => setIsLogoutOpen(true)} className="w-full">
            <AppIcon name="log-out-outline" size={18} color={themeColorDangerSoftForeground} />
            <Button.Label>{t("settings.logout")}</Button.Label>
          </Button>
        </View>
      </ScrollView>
      <LogoutConfirmationDialog
        isOpen={isLogoutOpen}
        onOpenChange={setIsLogoutOpen}
        onConfirm={logout}
      />
    </>
  );
}
