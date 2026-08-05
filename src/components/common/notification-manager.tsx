import { configureNotifications } from "@/services/notifications";
import React from "react";

export default function NotificationManager(): null {
  React.useEffect(() => {
    void configureNotifications().catch(() => undefined);
  }, []);

  return null;
}
