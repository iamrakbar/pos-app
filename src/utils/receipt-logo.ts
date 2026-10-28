import { Image } from "react-native";
import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

const RECEIPT_LOGO_WIDTH = 384;
const RECEIPT_LOGO_MAX_HEIGHT = 192;

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

export async function optimizeReceiptLogo(uri: string): Promise<string> {
  const { width: originalWidth, height: originalHeight } = await getImageSize(uri);
  const scale = Math.min(
    RECEIPT_LOGO_WIDTH / originalWidth,
    RECEIPT_LOGO_MAX_HEIGHT / originalHeight,
    1
  );
  const context = ImageManipulator.manipulate(uri);
  if (scale < 1) {
    context.resize({
      width: Math.max(1, Math.round(originalWidth * scale)),
      height: Math.max(1, Math.round(originalHeight * scale)),
    });
  }

  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.PNG });
  const directory = new Directory(Paths.document, "receipt-logos");
  if (!directory.exists) directory.create({ intermediates: true });
  const destination = new File(directory, `logo-${Date.now()}.png`);
  await new File(result.uri).copy(destination);

  return destination.uri;
}
