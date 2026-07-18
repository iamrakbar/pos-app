import { Accordion, Typography } from "heroui-native";
import type { JSX } from "react";

type QrUrlDisclosureProps = {
  url: string;
};

export default function QrUrlDisclosure({ url }: QrUrlDisclosureProps): JSX.Element {
  return (
    <Accordion hideSeparator className="rounded-lg bg-surface-secondary px-3">
      <Accordion.Item value="qr-image-url">
        <Accordion.Trigger className="py-2.5">
          <Typography type="body-xs" weight="semibold" color="muted" className="flex-1">
            QR image URL
          </Typography>
          <Accordion.Indicator />
        </Accordion.Trigger>
        <Accordion.Content className="pb-3">
          <Typography selectable type="body-xs">
            {url}
          </Typography>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}
