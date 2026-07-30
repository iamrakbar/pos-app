import DialogCloseButton from "@/components/common/dialog-close-button";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { BottomSheet, Dialog } from "heroui-native";
import type { ReactNode } from "react";
import { useKeyboardState } from "react-native-keyboard-controller";
import { View } from "react-native";

export type AdaptiveFormOverlayProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
  moveAboveKeyboardOnPhone?: boolean;
};

export default function AdaptiveFormOverlay({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidthClassName = "max-w-md",
  moveAboveKeyboardOnPhone = false,
}: AdaptiveFormOverlayProps): React.JSX.Element {
  const { isPhonePortrait } = useOverlayPresentation();
  const keyboardHeight = useKeyboardState((state) => state.height);

  if (isPhonePortrait) {
    return (
      <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            enablePanDownToClose={false}
            keyboardBehavior="interactive"
            bottomInset={moveAboveKeyboardOnPhone ? keyboardHeight : 0}
            contentContainerClassName="p-0 pb-safe"
          >
            <BottomSheet.Close className="absolute right-3 top-3 z-50" />
            <View className="gap-1.5 px-5 pb-4 pr-14 pt-5">
              <BottomSheet.Title>{title}</BottomSheet.Title>
              {description ? (
                <BottomSheet.Description>{description}</BottomSheet.Description>
              ) : null}
            </View>
            {children}
            {footer}
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    );
  }

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          isSwipeable={false}
          className={`w-full self-center overflow-hidden p-0 ${maxWidthClassName}`}
        >
          <DialogCloseButton />
          <View className="gap-1.5 px-5 pb-4 pr-14 pt-5">
            <Dialog.Title>{title}</Dialog.Title>
            {description ? <Dialog.Description>{description}</Dialog.Description> : null}
          </View>
          {children}
          {footer}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
