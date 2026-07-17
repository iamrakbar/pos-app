export type PrintErrorCode =
  | "NOT_CONFIGURED"
  | "PERMISSION_DENIED"
  | "BLUETOOTH_OFF"
  | "CONNECTION_TIMEOUT"
  | "LOST_PAIRING"
  | "CONNECTION_FAILED"
  | "TRANSMIT_FAILED";

export class PrintError extends Error {
  constructor(
    public readonly code: PrintErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "PrintError";
  }
}
