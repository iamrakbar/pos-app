import { PortalHost, PortalProvider } from "panelui-native";
import type { ReactNode } from "react";
import { Modal, Platform, View } from "react-native";
import { FullWindowOverlay } from "react-native-screens";

type SheetOverlayHostProps = {
  enabled?: boolean;
  visible: boolean;
  onRequestClose: () => void;
  children: ReactNode;
};

/** Hosts PanelUI portals above a native TrueSheet rather than behind it. */
export default function SheetOverlayHost({
  enabled = true,
  visible,
  onRequestClose,
  children,
}: SheetOverlayHostProps) {
  if (!enabled) return <>{children}</>;

  return (
    <PortalProvider>
      {children}
      {Platform.OS === "ios" ? (
        visible ? (
          <FullWindowOverlay>
            <View className="flex-1" pointerEvents="box-none">
              <PortalHost />
            </View>
          </FullWindowOverlay>
        ) : null
      ) : (
        <Modal visible={visible} transparent onRequestClose={onRequestClose}>
          <View className="flex-1" pointerEvents="box-none">
            <PortalHost />
          </View>
        </Modal>
      )}
    </PortalProvider>
  );
}
