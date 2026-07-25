import {
  createTable,
  deleteTable,
  getAreaTables,
  getPosTables,
  updateTable,
} from "@/api/endpoints/tables";
import { areaKeys } from "@/hooks/db/use-areas";
import { useAuth } from "@/stores/use-auth";
import type { POSTable } from "@/types/pos";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const TABLES_STALE_TIME_MS = 5 * 60 * 1000;

export function useTables() {
  const merchantId = useAuth((s) => s.merchantId);
  return useQuery<POSTable[]>({
    queryKey: ["tables", merchantId],
    queryFn: async () => (await getPosTables(merchantId!)).data,
    enabled: !!merchantId,
    staleTime: TABLES_STALE_TIME_MS,
  });
}

export const areaTableKeys = {
  all: (merchantId: string | null) => ["area-tables", merchantId] as const,
  list: (merchantId: string | null, areaId: string) => ["area-tables", merchantId, areaId] as const,
};

export function useAreaTables(areaId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  return useQuery({
    queryKey: areaTableKeys.list(merchantId, areaId),
    queryFn: async () => (await getAreaTables(merchantId!, areaId)).data,
    enabled: !!merchantId && !!areaId,
    staleTime: TABLES_STALE_TIME_MS,
  });
}

function useInvalidateTables(areaId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: areaTableKeys.list(merchantId, areaId) }),
      queryClient.invalidateQueries({ queryKey: ["tables", merchantId] }),
      queryClient.invalidateQueries({ queryKey: areaKeys.all(merchantId) }),
    ]);
  };
}

export function useCreateTable(areaId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateTables = useInvalidateTables(areaId);
  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.Area.StoreTableRequest) =>
      (await createTable(merchantId!, areaId, values)).data,
    onSuccess: invalidateTables,
  });
}

export function useUpdateTable(areaId: string, tableId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateTables = useInvalidateTables(areaId);
  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.Area.UpdateTableRequest) =>
      (await updateTable(merchantId!, areaId, tableId, values)).data,
    onSuccess: invalidateTables,
  });
}

export function useDeleteTable(areaId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateTables = useInvalidateTables(areaId);
  return useMutation({
    mutationFn: async (tableId: string) => deleteTable(merchantId!, areaId, tableId),
    onSuccess: invalidateTables,
  });
}
