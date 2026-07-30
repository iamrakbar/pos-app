import Logo from "@/components/common/logo";
import { Button, Card, InputGroup, Typography, useThemeColor } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, type JSX } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
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
  const themeColorAccent = useThemeColor("accent");
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
            className={`items-center gap-4 w-full max-w-md self-center ${isCompact ? "py-6" : "py-10 md:gap-6"}`}
          >
            <Logo tintColor={themeColorAccent} />

            <View className="w-full gap-1 mt-5">
              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <InputGroup className="w-full">
                    <InputGroup.Prefix isDecorative>
                      <Ionicons name="person-outline" size={16} color="#888" />
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
                <Typography className="text-xs text-danger">{errors.email.message}</Typography>
              )}
            </View>

            <View className="w-full gap-1">
              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <InputGroup className="w-full">
                    <InputGroup.Prefix isDecorative>
                      <Ionicons name="lock-closed-outline" size={16} color="#888" />
                    </InputGroup.Prefix>
                    <InputGroup.Input
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder={t("auth.passwordPlaceholder")}
                      secureTextEntry={!isPasswordVisible}
                    />
                    <InputGroup.Suffix>
                      <Pressable
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        hitSlop={20}
                        accessibilityRole="button"
                        accessibilityLabel={
                          isPasswordVisible ? t("auth.hidePassword") : t("auth.showPassword")
                        }
                      >
                        <Ionicons
                          name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                          size={16}
                          color="#888"
                        />
                      </Pressable>
                    </InputGroup.Suffix>
                  </InputGroup>
                )}
              />
              {errors.password && (
                <Typography className="text-xs text-danger">{errors.password.message}</Typography>
              )}
            </View>

            {login.isError && (
              <Typography className="text-sm text-danger text-center">
                {getErrorMessage(login.error)}
              </Typography>
            )}

            <Button
              className="w-full"
              onPress={handleSubmit(onSubmit)}
              isDisabled={login.isPending}
            >
              {login.isPending ? <ActivityIndicator color="#fff" /> : t("auth.login")}
            </Button>
          </Card>
        </View>
      </KeyboardAwareScrollView>
      <KeyboardToolbar />
    </>
  );
}
