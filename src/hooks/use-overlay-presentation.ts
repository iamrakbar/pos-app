import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export type OverlayChoicePresentation = "bottom-sheet" | "popover";

export type OverlayPresentation = {
  isPhonePortrait: boolean;
  choicePresentation: OverlayChoicePresentation;
  pickerPresentation: OverlayChoicePresentation;
};

export function getOverlayPresentation(
  isCompact: boolean,
  isPortrait: boolean
): OverlayPresentation {
  const isPhonePortrait = isCompact && isPortrait;
  const presentation = isPhonePortrait ? "bottom-sheet" : "popover";

  return {
    isPhonePortrait,
    choicePresentation: presentation,
    pickerPresentation: presentation,
  };
}

export function useOverlayPresentation(): OverlayPresentation {
  const { isCompact, isPortrait } = useResponsiveLayout();

  return getOverlayPresentation(isCompact, isPortrait);
}
