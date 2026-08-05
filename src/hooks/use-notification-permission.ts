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

export function useNotificationPermission(): NotificationPermissionResult {
  const [permission, setPermission] = React.useState(INITIAL_STATE);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRequesting, setIsRequesting] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    try {
      setPermission(await getNotificationPermissionState());
    } catch {
      setPermission({ status: "unavailable", canAskAgain: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const request = React.useCallback(async () => {
    setIsRequesting(true);
    try {
      const nextPermission = await requestNotificationPermission();
      setPermission(nextPermission);
      return nextPermission;
    } finally {
      setIsRequesting(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    void getNotificationPermissionState()
      .then((nextPermission) => {
        if (isMounted) setPermission(nextPermission);
      })
      .catch(() => {
        if (isMounted) setPermission({ status: "unavailable", canAskAgain: false });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") void refresh();
    });
    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [refresh]);

  return { ...permission, isLoading, isRequesting, refresh, request };
}
