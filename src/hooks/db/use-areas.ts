import { createArea, deleteArea, getArea, getAreas, updateArea } from "@/api/endpoints/areas";
import { useAuth } from "@/stores/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const AREA_STALE_TIME_MS = 5 * 60 * 1000;

export const areaKeys = {
  all: (merchantId: string | null) => ["areas", merchantId] as const,
  list: (merchantId: string | null) => ["areas", merchantId, "list"] as const,
  detail: (merchantId: string | null, areaId: string) =>
    ["areas", merchantId, "detail", areaId] as const,
};

export function useAreas() {
  const merchantId = useAuth((state) => state.merchantId);
  return useQuery({
    queryKey: areaKeys.list(merchantId),
    queryFn: async () => (await getAreas(merchantId!)).data,
    enabled: !!merchantId,
    staleTime: AREA_STALE_TIME_MS,
  });
}

export function useArea(areaId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  return useQuery({
    queryKey: areaKeys.detail(merchantId, areaId),
    queryFn: async () => (await getArea(merchantId!, areaId)).data,
    enabled: !!merchantId && areaId !== "new",
    staleTime: AREA_STALE_TIME_MS,
  });
}

function useInvalidateAreas() {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  return async (areaId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: areaKeys.all(merchantId) }),
      queryClient.invalidateQueries({ queryKey: ["tables", merchantId] }),
      areaId
        ? queryClient.invalidateQueries({ queryKey: areaKeys.detail(merchantId, areaId) })
        : Promise.resolve(),
    ]);
  };
}

export function useCreateArea() {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateAreas = useInvalidateAreas();
  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.Area.StoreAreaRequest) =>
      (await createArea(merchantId!, values)).data,
    onSuccess: async (area) => invalidateAreas(area.id),
  });
}

export function useUpdateArea(areaId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateAreas = useInvalidateAreas();
  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.Area.UpdateAreaRequest) =>
      (await updateArea(merchantId!, areaId, values)).data,
    onSuccess: async () => invalidateAreas(areaId),
  });
}

export function useDeleteArea() {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateAreas = useInvalidateAreas();
  return useMutation({
    mutationFn: async (areaId: string) => deleteArea(merchantId!, areaId),
    onSuccess: async () => invalidateAreas(),
  });
}
