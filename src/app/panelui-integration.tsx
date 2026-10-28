import { useRef, useState } from "react";
import { Modal, ScrollView, View } from "react-native";
import { useLocale } from "@/stores/use-locale";
import { getLocaleTag } from "@/locales";
import { Redirect, Stack } from "expo-router";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import {
  Button,
  DatePicker,
  Dialog,
  Input,
  Label,
  PortalHost,
  PortalProvider,
  Select,
  Typography,
  useToast,
} from "panelui-native";

/** Development-only acceptance screen; uses the application's single root provider. */
export default function PanelUIIntegrationScreen({ standalone = false }: { standalone?: boolean }) {
  const locale = useLocale((state) => state.locale);
  const sheet = useRef<TrueSheet>(null);
  const [value, setValue] = useState("first");
  const [inputValue, setInputValue] = useState("");
  const [date, setDate] = useState<Date>();
  const [hostVisible, setHostVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [selectGeneration, setSelectGeneration] = useState(0);
  const { toast } = useToast();

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <View className="flex-1 gap-4 bg-background p-6">
      {!standalone && (
        <Stack.Screen options={{ headerShown: true, title: "PanelUI / TrueSheet acceptance" }} />
      )}
      <Typography>Verify visibility and touch input in light and dark mode.</Typography>
      <Button onPress={() => void sheet.current?.present()}>Open TrueSheet</Button>
      <TrueSheet ref={sheet} detents={[0.75, 1]} scrollable grabber>
        <PortalProvider>
          <View style={{ flex: 1 }}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 24, gap: 16 }}
            >
              <Typography>PanelUI inside the native TrueSheet</Typography>
              <Label>Keyboard reachability</Label>
              <Input
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Type here, then open each overlay"
              />
              <Label>Select sheet</Label>
              <Select
                key={`sheet-${selectGeneration}`}
                value={value}
                onValueChange={setValue}
                title="Pick a value"
                onOpenChange={setHostVisible}
              >
                <Select.Item value="first" label="First" />
                <Select.Item value="second" label="Second" />
              </Select>
              <Label>Select overlay</Label>
              <Select
                key={`overlay-${selectGeneration}`}
                value={value}
                onValueChange={setValue}
                presentation="overlay"
                onOpenChange={setHostVisible}
              >
                <Select.Item value="first" label="First" />
                <Select.Item value="second" label="Second" />
              </Select>
              <Typography>Selected: {value}</Typography>
              <DatePicker
                presentation="bottom-sheet"
                selected={date}
                onSelect={setDate}
                locale={getLocaleTag(locale)}
                open={dateOpen}
                onOpenChange={(open) => {
                  setDateOpen(open);
                  setHostVisible(open);
                }}
              />
              <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                  setDialogOpen(open);
                  setHostVisible(open);
                }}
              >
                <Dialog.Trigger>
                  <Button variant="outline">Open dialog</Button>
                </Dialog.Trigger>
                <Dialog.Content>
                  <Dialog.Title>Dialog above TrueSheet</Dialog.Title>
                  <Dialog.Description>
                    Check this is visible and the close button responds.
                  </Dialog.Description>
                  <Dialog.Footer>
                    <Dialog.Close>
                      <Button>Close dialog</Button>
                    </Dialog.Close>
                  </Dialog.Footer>
                </Dialog.Content>
              </Dialog>
              <Button
                onPress={() => {
                  toast.show({
                    variant: "success",
                    label: "Toast above TrueSheet",
                    placement: "top",
                    duration: 4000,
                    actionLabel: "Dismiss",
                    onActionPress: ({ hide }) => {
                      hide();
                    },
                  });
                }}
              >
                Show persistent toast
              </Button>
              <Button variant="outline" onPress={() => toast.hideAll()}>
                Dismiss toasts
              </Button>
              <Button variant="secondary" onPress={() => void sheet.current?.resize(1)}>
                Expand sheet
              </Button>
              <Button variant="ghost" onPress={() => void sheet.current?.dismiss()}>
                Close sheet
              </Button>
            </ScrollView>
            <Modal
              visible={hostVisible}
              transparent
              onRequestClose={() => {
                setDialogOpen(false);
                setDateOpen(false);
                setSelectGeneration((generation) => generation + 1);
                toast.hideAll();
                setHostVisible(false);
              }}
            >
              <View style={{ flex: 1 }} pointerEvents="box-none">
                <PortalHost />
              </View>
            </Modal>
          </View>
        </PortalProvider>
      </TrueSheet>
    </View>
  );
}
