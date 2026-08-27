import { create } from "zustand";

export type OrderRealtimeStatus =
  "connected" | "connecting" | "reconnecting" | "disconnected" | "failed";

type OrderRealtimeState = {
  status: OrderRealtimeStatus;
  setStatus: (status: OrderRealtimeStatus) => void;
};

export const useOrderRealtimeStatus = create<OrderRealtimeState>((set) => ({
  status: "disconnected",
  setStatus: (status) => set({ status }),
}));
