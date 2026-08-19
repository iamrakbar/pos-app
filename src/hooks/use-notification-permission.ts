import {
  getNotificationPermissionState,
  requestNotificationPermission,
  type NotificationPermissionState,
} from "@/services/notifications";
import React from "react";
import { AppState } from "react-native";

type NotificationPermissionResult = NotificationPermissionState & {
  isLoading: boolean;
  isRequesting: boolean;
  refresh: () => Promise<void>;
  request: () => Promise<NotificationPermissionState>;
};

const INITIAL_STATE: NotificationPermissionState = {
  status: "undetermined",
  canAskAgain: true,
};

async function loadPermission(): Promise<NotificationPermissionState> {
  try {
    return await getNotificationPermissionState();
  } catch {
    return { status: "unavailable", canAskAgain: false };
  }
}

export function useNotificationPermission(): NotificationPermissionResult {
  const [permission, setPermission] = React.useState(INITIAL_STATE);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRequesting, setIsRequesting] = React.useState(false);

  const refresh = async () => {
    setIsLoading(true);
    setPermission(await loadPermission());
    setIsLoading(false);
  };

  const request = async () => {
    setIsRequesting(true);
    return requestNotificationPermission()
      .then((nextPermission) => {
        setPermission(nextPermission);
        return nextPermission;
      })
      .finally(() => setIsRequesting(false));
  };

  React.useEffect(() => {
    let isMounted = true;
    const load = () => {
      setIsLoading(true);
      void loadPermission().then((nextPermission) => {
        if (isMounted) {
          setPermission(nextPermission);
          setIsLoading(false);
        }
      });
    };
    load();
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") load();
    });
    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return { ...permission, isLoading, isRequesting, refresh, request };
}
