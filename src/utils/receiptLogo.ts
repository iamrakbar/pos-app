import { ImageFormat, Skia } from "@shopify/react-native-skia";
import { Directory, File, Paths } from "expo-file-system";

const RECEIPT_LOGO_WIDTH = 384;
const RECEIPT_LOGO_MAX_HEIGHT = 192;
const GRAYSCALE_MATRIX = [
  0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0, 0, 0, 1, 0,
];

export async function optimizeReceiptLogo(uri: string): Promise<string> {
  const encoded = await Skia.Data.fromURI(uri);
  const image = Skia.Image.MakeImageFromEncoded(encoded);
  if (!image) throw new Error("The selected image could not be processed.");

  const scale = Math.min(
    RECEIPT_LOGO_WIDTH / image.width(),
    RECEIPT_LOGO_MAX_HEIGHT / image.height(),
    1
  );
  const width = Math.max(1, Math.round(image.width() * scale));
  const height = Math.max(1, Math.round(image.height() * scale));
  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) throw new Error("Could not prepare the receipt logo.");

  const paint = Skia.Paint();
  paint.setColorFilter(Skia.ColorFilter.MakeMatrix(GRAYSCALE_MATRIX));
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color("white"));
  canvas.drawImageRect(
    image,
    Skia.XYWHRect(0, 0, image.width(), image.height()),
    Skia.XYWHRect(0, 0, width, height),
    paint
  );
  surface.flush();

  const base64 = surface.makeImageSnapshot().encodeToBase64(ImageFormat.PNG, 100);
  const directory = new Directory(Paths.document, "receipt-logos");
  if (!directory.exists) directory.create({ intermediates: true });
  const destination = new File(directory, `logo-${Date.now()}.png`);
  destination.write(base64, { encoding: "base64" });

  return destination.uri;
}
