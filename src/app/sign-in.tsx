import Logo from "@/components/common/logo";
import { Button, Card, InputGroup, Typography, useThemeColor } from "heroui-native";
import { Ionicons } from '@expo/vector-icons';
import { useState, type JSX } from "react";
import { Pressable, View } from "react-native";
import { KeyboardAwareScrollView, KeyboardToolbar } from "react-native-keyboard-controller";

export default function HomeScreen(): JSX.Element {
    const themeColorAccent = useThemeColor("accent");

    const [value, setValue] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
        <>
            <KeyboardAwareScrollView bottomOffset={62} contentContainerClassName="flex-1">
                <View className="flex-1 bg-background justify-center px-4">
                    <Card className="items-center gap-4 md:gap-6 w-full max-w-md self-center">
                        <Logo tintColor={themeColorAccent} />
                        <InputGroup className="w-full">
                            <InputGroup.Prefix isDecorative>
                                <Ionicons name="person-outline" size={16} color="#888" />
                            </InputGroup.Prefix>
                            <InputGroup.Input
                                value={value}
                                onChangeText={setValue}
                                placeholder="Enter your username"
                            />
                        </InputGroup>
                        <InputGroup className="w-full">
                            <InputGroup.Prefix isDecorative>
                                <Ionicons name="lock-closed-outline" size={16} color="#888" />
                            </InputGroup.Prefix>
                            <InputGroup.Input
                                value={value}
                                onChangeText={setValue}
                                placeholder="Enter your password"
                                secureTextEntry={!isPasswordVisible}
                            />
                            <InputGroup.Suffix>
                                <Pressable
                                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                    hitSlop={20}
                                >
                                    <Ionicons
                                        name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                                        size={16}
                                        color="#888"
                                    />
                                </Pressable>
                            </InputGroup.Suffix>
                        </InputGroup>
                        <Button className="w-full">Login</Button>
                    </Card>
                </View>
            </KeyboardAwareScrollView>
            <KeyboardToolbar />
        </>
    );
}
