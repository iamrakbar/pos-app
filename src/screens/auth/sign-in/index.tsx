import { Button, Card, InputGroup, Typography, cn } from "panelui-native";
import { useCSSVariable } from "uniwind";
import Logo from "@/components/common/logo";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useEffect, useState, type JSX } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView, KeyboardToolbar } from "react-native-keyboard-controller";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLoginSchema, type LoginFormValues } from "@/schemas/auth";
import { useLogin } from "@/hooks/use-login";
import { getErrorMessage } from "@/api/api-error";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useTranslation } from "@/stores/use-locale";

export default function SignInScreen(): JSX.Element {
  const { locale, t } = useTranslation();
  const { isCompact } = useResponsiveLayout();
  const themeColorAccent = useCSSVariable("--color-primary") as string;
  const themeColorMuted = useCSSVariable("--color-muted-foreground") as string;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const login = useLogin();
  const loginSchema = createLoginSchema(t);

  const {
    control,
    clearErrors,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values);
  };

  return (
    <>
      <KeyboardAwareScrollView
        bottomOffset={62}
        contentContainerClassName="flex-grow bg-background justify-center px-4 py-safe"
      >
        <View className="w-full">
          <Card
            className={cn(
              "items-center gap-4 w-full max-w-md self-center p-4",
              isCompact ? "py-6" : "py-10 md:gap-6"
            )}
          >
            <Logo tintColor={themeColorAccent} />

            <View className="w-full gap-1 mt-5">
              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <InputGroup className="w-full">
                    <InputGroup.Prefix isDecorative>
                      <AppIcon icon={AppIcons.person} size={16} color={themeColorMuted} />
                    </InputGroup.Prefix>
                    <InputGroup.Input
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder={t("auth.emailPlaceholder")}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </InputGroup>
                )}
              />
              {errors.email && (
                <Typography className="text-destructive-foreground" type="body-xs">
                  {errors.email.message}
                </Typography>
              )}
            </View>

            <View className="w-full gap-1">
              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <InputGroup className="w-full">
                    <InputGroup.Prefix isDecorative>
                      <AppIcon icon={AppIcons.lockClosed} size={16} color={themeColorMuted} />
                    </InputGroup.Prefix>
                    <InputGroup.Input
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder={t("auth.passwordPlaceholder")}
                      secureTextEntry={!isPasswordVisible}
                    />
                    <InputGroup.Suffix>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11"
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        accessibilityLabel={
                          isPasswordVisible ? t("auth.hidePassword") : t("auth.showPassword")
                        }
                      >
                        <AppIcon
                          icon={isPasswordVisible ? AppIcons.eyeOff : AppIcons.eye}
                          size={16}
                          color={themeColorMuted}
                        />
                      </Button>
                    </InputGroup.Suffix>
                  </InputGroup>
                )}
              />
              {errors.password && (
                <Typography className="text-destructive-foreground" type="body-xs">
                  {errors.password.message}
                </Typography>
              )}
            </View>

            {login.isError && (
              <Typography className="text-destructive-foreground" type="body-sm" align="center">
                {getErrorMessage(login.error)}
              </Typography>
            )}

            <Button
              className="w-full"
              onPress={handleSubmit(onSubmit)}
              loading={login.isPending}
              disabled={login.isPending}
            >
              {t("auth.login")}
            </Button>
          </Card>
        </View>
      </KeyboardAwareScrollView>
      <KeyboardToolbar />
    </>
  );
}
