import { Dialog } from "heroui-native";
import type { JSX } from "react";

export default function DialogCloseButton(): JSX.Element {
  return <Dialog.Close variant="ghost" className="absolute right-3 top-3 z-50" />;
}
