import { apiRequest } from '../client';

type PosTablesResponse = {
    success: boolean;
    data: App.Data.Merchant.Pos.PosTableData[];
};

export function getPosTables(merchantId: string): Promise<PosTablesResponse> {
    return apiRequest<PosTablesResponse>(`/${merchantId}/pos/tables`);
}
