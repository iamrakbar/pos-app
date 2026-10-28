import { useRef, useState } from "react";
import { FlatList, Modal, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { EncodingType, File as ExpoFile, Paths } from "expo-file-system";
import { captureRef } from "react-native-view-shot";
import { useLocale } from "@/stores/use-locale";
import { getLocaleTag } from "@/locales";
import { useLocalizedNumberInput } from "@/hooks/use-localized-number-input";
import { IDR_NUMBER_FIELD_FORMAT_OPTIONS } from "@/utils/format";
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
  QRCode,
  RadioGroup,
  Select,
  SearchBar,
  ScrollFade,
  SlideButton,
  TimePicker,
  Table,
  Typography,
  useToast,
} from "panelui-native";

/** Development-only acceptance screen; uses the application's single root provider. */
export default function PanelUIIntegrationScreen({ standalone = false }: { standalone?: boolean }) {
  const locale = useLocale((state) => state.locale);
  const sheet = useRef<TrueSheet>(null);
  const qrCapture = useRef<View>(null);
  const [qrCaptureStatus, setQrCaptureStatus] = useState("");
  const [value, setValue] = useState("first");
  const [searchFixture, setSearchFixture] = useState("");
  const [slideCount, setSlideCount] = useState(0);
  const [sortAscending, setSortAscending] = useState(true);
  const [radioFixture, setRadioFixture] = useState("first");
  const [inputValue, setInputValue] = useState("");
  const [currencyValue, setCurrencyValue] = useState("");
  const [decimalValue, setDecimalValue] = useState("");
  const { localizedInputProps: currencyInput } = useLocalizedNumberInput({
    value: currencyValue,
    onChange: setCurrencyValue,
    formatOptions: IDR_NUMBER_FIELD_FORMAT_OPTIONS,
    minValue: 0,
  });
  const { localizedInputProps: decimalInput } = useLocalizedNumberInput({
    value: decimalValue,
    onChange: setDecimalValue,
    formatOptions: { useGrouping: false, maximumFractionDigits: 2 },
    minValue: 0,
  });
  const [date, setDate] = useState<Date>();
  const [hostVisible, setHostVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [time, setTime] = useState({ hour: 13, minute: 5 });
  const [selectGeneration, setSelectGeneration] = useState(0);
  const { toast } = useToast();

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <View className="flex-1 gap-4 bg-background p-6">
      {!standalone && (
        <Stack.Screen options={{ headerShown: true, title: "PanelUI / TrueSheet acceptance" }} />
      )}
      <Typography>Verify visibility and touch input in light and dark mode.</Typography>

      <RadioGroup
        value={radioFixture}
        onValueChange={setRadioFixture}
        variant="card"
        orientation="horizontal"
      >
        {["first", "second"].map((choice) => (
          <RadioGroup.Item key={choice} value={choice} hideIndicator>
            <View>
              <Typography>{choice}</Typography>
            </View>
          </RadioGroup.Item>
        ))}
      </RadioGroup>
      <SearchBar
        value={searchFixture}
        onChangeText={setSearchFixture}
        placeholder="Search fixture"
        clearLabel="Clear"
        panel="never"
      />
      <SlideButton
        autoReset
        autoResetDelay={600}
        onComplete={() => setSlideCount((count) => count + 1)}
        accessibilityActionLabel="Confirm fixture"
      >
        <SlideButton.Label>Slide fixture</SlideButton.Label>
      </SlideButton>
      <Typography>Completed: {slideCount}</Typography>
      <ScrollFade style={{ height: 100 }}>
        <FlatList
          data={Array.from({ length: 12 }, (_, index) => index)}
          keyExtractor={(item) => String(item)}
          renderItem={({ item }) => <Typography>Scroll row {item}</Typography>}
        />
      </ScrollFade>
      <Table columns={[{ width: 180 }]}>
        <Table.Header>
          <Table.Row>
            <Table.Head
              sortable
              sortDirection={sortAscending ? "asc" : "desc"}
              onPress={() => setSortAscending((value) => !value)}
            >
              Sort fixture
            </Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {(sortAscending ? ["A", "B"] : ["B", "A"]).map((value) => (
            <Table.Row key={value}>
              <Table.Cell>{value}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Input label="Currency fixture" keyboardType="numeric" {...currencyInput} />
      <Typography>Currency value: {currencyValue}</Typography>
      <Input label="Decimal fixture" keyboardType="decimal-pad" {...decimalInput} />
      <Typography>Decimal value: {decimalValue}</Typography>
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
                triggerClassName="h-12"
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
                triggerClassName="h-12"
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
              <TimePicker
                value={time}
                onValueChange={setTime}
                hourCycle={24}
                minuteStep={5}
                locale={getLocaleTag(locale)}
                presentation="bottom-sheet"
                open={timeOpen}
                onOpenChange={(open) => {
                  setTimeOpen(open);
                  setHostVisible(open);
                }}
              />
              <Typography>
                Time: {String(time.hour).padStart(2, "0")}:{String(time.minute).padStart(2, "0")}
              </Typography>
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
              <View ref={qrCapture} collapsable={false} style={{ alignSelf: "center" }}>
                <QRCode value="https://example.com/panelui-qr-test" size="lg" errorCorrection="H">
                  <QRCode.Panel>
                    <QRCode.Canvas pixelSize={240} />
                    <QRCode.Logo>
                      <Image
                        source={require("../../assets/images/logo.svg")}
                        style={{ width: 40, height: 40 }}
                        contentFit="contain"
                      />
                    </QRCode.Logo>
                  </QRCode.Panel>
                </QRCode>
              </View>
              <Button
                onPress={() => {
                  void captureRef(qrCapture, {
                    format: "png",
                    result: "base64",
                    width: 1024,
                    height: 1024,
                  })
                    .then((base64) => {
                      const file = new ExpoFile(Paths.cache, "panelui-qr-base64-test.png");
                      file.create({ overwrite: true });
                      file.write(base64, { encoding: EncodingType.Base64 });
                      setQrCaptureStatus(file.uri);
                    })
                    .catch((error) => setQrCaptureStatus(String(error)));
                }}
              >
                Capture test QR
              </Button>
              <Typography>{qrCaptureStatus}</Typography>
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
                setTimeOpen(false);
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
