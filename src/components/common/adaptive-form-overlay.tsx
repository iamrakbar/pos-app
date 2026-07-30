import DialogCloseButton from "@/components/common/dialog-close-button";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { BottomSheet, Dialog, useBottomSheetAwareHandlers } from "heroui-native";
import type GorhomBottomSheet from "@gorhom/bottom-sheet";
import { useEffect, useRef, type ReactNode } from "react";
import { useKeyboardState } from "react-native-keyboard-controller";
import { View, useWindowDimensions } from "react-native";

export type AdaptiveFormOverlayProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
};

export function AdaptiveFormKeyboardHandlers({
  children,
}: {
  children: (handlers: ReturnType<typeof useBottomSheetAwareHandlers>) => ReactNode;
}): React.JSX.Element {
  const handlers = useBottomSheetAwareHandlers();
  return <>{children(handlers)}</>;
}

export default function AdaptiveFormOverlay({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidthClassName = "max-w-md",
}: AdaptiveFormOverlayProps): React.JSX.Element {
  const { isPhonePortrait } = useOverlayPresentation();
  const { height: windowHeight } = useWindowDimensions();
  const keyboardHeight = useKeyboardState((state) => state.height);
  const isKeyboardVisible = useKeyboardState((state) => state.isVisible);
  const bottomSheetRef = useRef<GorhomBottomSheet>(null);
  const wasKeyboardVisible = useRef(false);

  useEffect(() => {
    if (isPhonePortrait && wasKeyboardVisible.current && !isKeyboardVisible) {
      requestAnimationFrame(() => {
        bottomSheetRef.current?.snapToIndex(0);
      });
    }
    wasKeyboardVisible.current = isKeyboardVisible;
  }, [isKeyboardVisible, isPhonePortrait]);

  if (isPhonePortrait) {
    return (
      <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            ref={bottomSheetRef}
            enablePanDownToClose={false}
            snapPoints={["90%"]}
            keyboardBehavior="extend"
            keyboardBlurBehavior="restore"
            android_keyboardInputMode="adjustResize"
            maxDynamicContentSize={windowHeight * 0.9}
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
          style={{
            marginBottom: isKeyboardVisible ? keyboardHeight : 0,
          }}
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
