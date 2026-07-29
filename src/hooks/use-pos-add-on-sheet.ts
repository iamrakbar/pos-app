import { usePOSStore } from "@/stores/use-pos-store";
import type { POSProduct } from "@/types/pos";
import { useTrueSheet } from "@lodev09/react-native-true-sheet";
import React from "react";

export const POS_ADD_ON_SHEET_NAME = "pos-add-ons";

export function usePOSAddOnSheet() {
  const { present } = useTrueSheet();
  const beginAddonSelection = usePOSStore((state) => state.beginAddonSelection);
  const clearAddonSelection = usePOSStore((state) => state.clearAddonSelection);

  return React.useCallback(
    async (product: POSProduct, editingCartItemId?: string) => {
      if (!beginAddonSelection(product, editingCartItemId)) return false;

      try {
        await present(POS_ADD_ON_SHEET_NAME, 1);
        return true;
      } catch {
        clearAddonSelection();
        return false;
      }
    },
    [beginAddonSelection, clearAddonSelection, present]
  );
}
