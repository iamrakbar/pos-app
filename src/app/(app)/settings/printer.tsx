import { Redirect } from "expo-router";
import type { JSX } from "react";

export default function PrinterSettingsRoute(): JSX.Element {
  return <Redirect href="/settings/printers" />;
}
