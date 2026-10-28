import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useEffect, useRef } from "react";
import { useKeyboardState } from "react-native-keyboard-controller";

export function useAdaptiveOverlayPresentation(
  isOpen: boolean,
  onOpenChange: (isOpen: boolean) => void
) {
  const { isPhonePortrait } = useOverlayPresentation();
  const sheetRef = useRef<TrueSheet>(null);
  const isOpenRef = useRef(isOpen);
  const keyboardHeight = useKeyboardState((state) => state.height);
  const isKeyboardVisible = useKeyboardState((state) => state.isVisible);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (!isPhonePortrait) return;
    if (isOpen) void sheetRef.current?.present();
    else void sheetRef.current?.dismiss();
  }, [isOpen, isPhonePortrait]);

  const handleDidDismiss = () => {
    if (isOpenRef.current) onOpenChange(false);
  };

  const dialogKeyboardStyle = { marginBottom: isKeyboardVisible ? keyboardHeight : 0 };

  return { isPhonePortrait, sheetRef, handleDidDismiss, dialogKeyboardStyle };
}
