import { PermissionsAndroid, Platform } from "react-native";
import { PrintError } from "./errors";

type RuntimePermission = Parameters<typeof PermissionsAndroid.check>[0];

/**
 * BLUETOOTH and BLUETOOTH_ADMIN are install-time permissions on Android <= 11.
 * Fine location is the runtime permission required to inspect Bluetooth devices there.
 * Android 12+ replaces that runtime requirement with SCAN and CONNECT.
 */
export function getBluetoothRuntimePermissions(): RuntimePermission[] {
  if (Platform.OS !== "android") return [];

  if (Number(Platform.Version) >= 31) {
    return [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ];
  }

  return [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
}

export async function ensureBluetoothPermissions(): Promise<void> {
  const permissions = getBluetoothRuntimePermissions();
  if (permissions.length === 0) return;

  const checks = await Promise.all(
    permissions.map((permission) => PermissionsAndroid.check(permission))
  );
  if (checks.every(Boolean)) return;

  const results = await PermissionsAndroid.requestMultiple(permissions);
  const granted = permissions.every(
    (permission) => results[permission] === PermissionsAndroid.RESULTS.GRANTED
  );

  if (!granted) {
    throw new PrintError(
      "PERMISSION_DENIED",
      "Bluetooth permission is required to print receipts."
    );
  }
}
