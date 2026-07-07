declare module "@haroldtran/react-native-thermal-printer" {
  export type Alignment = "left" | "center" | "right";

  export interface PrinterOptions {
    beep?: boolean;
    cut?: boolean;
    tailingLine?: boolean;
    encoding?: string;
    onError?: (error: Error) => void;
  }

  export interface PrinterImageOptions extends PrinterOptions {
    imageWidth?: number;
    align?: Alignment;
    paddingX?: number;
  }

  export interface IBLEPrinter {
    device: unknown;
    device_name: string;
    inner_mac_address: string;
  }

  export interface INetPrinter {
    device: unknown;
    device_name?: string;
    host: string;
    port: number;
  }

  export interface IUSBPrinter {
    device: unknown;
    manufacturer_name: string;
    product_name: string;
    device_name: string;
    vendor_id: string;
    product_id: string;
  }

  interface PrinterDriver<TDevice> {
    init: () => Promise<void>;
    getDeviceList: () => Promise<TDevice[]>;
    closeConn: () => Promise<void>;
    printText: (text: string, opts?: PrinterOptions) => void;
    printBill: (text: string, opts?: PrinterOptions) => void;
    printImage: (imgUrl: string, opts?: PrinterImageOptions) => void;
    printColumnsText: (
      texts: string[],
      columnWidth: number[],
      columnAlignment: Alignment[],
      columnStyle: string[],
      opts?: PrinterOptions
    ) => void;
  }

  export const BLEPrinter: PrinterDriver<IBLEPrinter> & {
    connectPrinter: (innerMacAddress: string) => Promise<IBLEPrinter>;
  };

  export const NetPrinter: PrinterDriver<INetPrinter> & {
    connectPrinter: (host: string, port: number, timeout?: number) => Promise<INetPrinter>;
  };

  export const USBPrinter: PrinterDriver<IUSBPrinter> & {
    connectPrinter: (vendorId: string, productId: string) => Promise<IUSBPrinter>;
  };

  export const COMMANDS: {
    HORIZONTAL_LINE: {
      HR3_58MM: string;
      HR3_80MM: string;
    };
    CASH_DRAWER: {
      CD_KICK_2: string;
      CD_KICK_5: string;
    };
    TEXT_FORMAT: {
      TXT_BOLD_ON: string;
      TXT_BOLD_OFF: string;
      TXT_ALIGN_CT: string;
      TXT_ALIGN_LT: string;
      TXT_2HEIGHT: string;
      TXT_NORMAL: string;
    };
  };
}
