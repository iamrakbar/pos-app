import Echo from "laravel-echo";
import type { ChannelAuthorizationCallback, ChannelAuthorizationHandler } from "pusher-js";
import { z } from "zod";
import { apiRequest } from "@/api/client";
import { isApiError } from "@/api/api-error";
import { API_BASE_URL } from "@/api/config";

const reverbAppKey = process.env.EXPO_PUBLIC_REVERB_APP_KEY;
const reverbHost = process.env.EXPO_PUBLIC_REVERB_HOST;
const reverbPort = Number(process.env.EXPO_PUBLIC_REVERB_PORT ?? "443");
const reverbScheme = process.env.EXPO_PUBLIC_REVERB_SCHEME ?? "https";

const merchantOrderPaidEventSchema = z.object({
  order_id: z.string().min(1),
  merchant_id: z.string().min(1),
  code: z.string().nullable(),
  payment_status: z.literal("settlement"),
  paid_at: z.string().nullable(),
  total: z.union([z.number(), z.string(), z.null()]),
  order_type: z.string().nullable(),
});

export type MerchantOrderPaidEvent = z.infer<typeof merchantOrderPaidEventSchema>;

type EchoAuthResponse = { auth: string; channel_data?: string; shared_secret?: string };

function getSafeErrorDetails(error: unknown): Record<string, string | number> {
  if (isApiError(error)) {
    return {
      status: error.status,
      ...(error.code ? { code: error.code } : {}),
      message: error.message,
    };
  }
  return { message: error instanceof Error ? error.message : "Unknown authorization error" };
}

function parseEventPayload(payload: unknown): unknown {
  if (typeof payload === "string") {
    try {
      return parseEventPayload(JSON.parse(payload));
    } catch {
      return null;
    }
  }

  if (!payload || typeof payload !== "object") return null;
  const candidate = payload as { data?: unknown };
  if (typeof candidate.data === "string") {
    try {
      return JSON.parse(candidate.data);
    } catch {
      return null;
    }
  }
  return candidate.data && typeof candidate.data === "object" ? candidate.data : payload;
}

export function parseMerchantOrderPaidEvent(payload: unknown): MerchantOrderPaidEvent | null {
  const result = merchantOrderPaidEventSchema.safeParse(parseEventPayload(payload));
  return result.success ? result.data : null;
}

function authorizeChannel(token: string): ChannelAuthorizationHandler {
  return ({ socketId, channelName }, callback: ChannelAuthorizationCallback) => {
    const body = new URLSearchParams({ socket_id: socketId, channel_name: channelName });

    void apiRequest<EchoAuthResponse>("/broadcasting/auth", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => callback(null, response))
      .catch((error: unknown) => {
        if (__DEV__) {
          console.warn(
            "[reverb] merchant channel authorization failed",
            getSafeErrorDetails(error)
          );
        }
        callback(error instanceof Error ? error : new Error("Channel authorization failed"), null);
      });
  };
}

export function createMerchantEcho(token: string): Echo<"reverb"> {
  if (!reverbAppKey || !reverbHost || !Number.isFinite(reverbPort)) {
    throw new Error("Reverb configuration is incomplete");
  }

  return new Echo({
    broadcaster: "reverb",
    key: reverbAppKey,
    wsHost: reverbHost,
    wsPort: reverbPort,
    wssPort: reverbPort,
    forceTLS: reverbScheme === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${API_BASE_URL}/broadcasting/auth`,
    channelAuthorization: { customHandler: authorizeChannel(token) },
    namespace: false,
  });
}
