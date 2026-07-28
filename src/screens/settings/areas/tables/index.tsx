import { getErrorMessage } from "@/api/api-error";
import CreateFAB from "@/components/common/create-fab";
import ActionDialog from "@/components/common/action-dialog";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import { useArea } from "@/hooks/db/use-areas";
import { useAreaTables, useDeleteTable } from "@/hooks/db/use-tables";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { Button, Chip, Separator, Typography, useThemeColor, useToast } from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import TableFormDialog from "./table-form-dialog";

type TableData = App.Data.Merchant.Area.TableData;

export default function AreaTablesScreen(): React.JSX.Element {
  const { areaId } = useLocalSearchParams<{ areaId: string }>();
  const { toast } = useToast();
  const [mutedColor, accentColor] = useThemeColor(["muted", "accent"]);
  const areaQuery = useArea(areaId);
  const tablesQuery = useAreaTables(areaId);
  const deleteMutation = useDeleteTable(areaId);
  const [editingTable, setEditingTable] = React.useState<TableData | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [deletingTable, setDeletingTable] = React.useState<TableData | null>(null);

  const openCreate = () => {
    setEditingTable(null);
    setIsFormOpen(true);
  };

  const openEdit = (table: TableData) => {
    setEditingTable(table);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTable) return;
    try {
      await deleteMutation.mutateAsync(deletingTable.id);
      setDeletingTable(null);
      toast.show({ variant: "success", label: "Table deleted" });
    } catch (error) {
      toast.show({
        variant: "danger",
        label: "Could not delete table",
        description: getErrorMessage(error),
      });
    }
  };

  if (tablesQuery.isLoading) return <LoadingState message="Loading tables…" />;
  if (tablesQuery.isError) {
    return <ErrorState error={tablesQuery.error} onRetry={tablesQuery.refetch} />;
  }

  const tables = tablesQuery.data ?? [];

  return (
    <>
      <Stack.Screen options={{ title: areaQuery.data?.name ?? "Tables" }} />
      <View className="flex-1 bg-background">
        <ScrollView className="flex-1" contentContainerClassName="py-2 pb-24">
          {tables.length === 0 ? (
            <EmptyState className="py-20">
              <EmptyState.Header>
                <EmptyState.Media variant="icon">
                  <Ionicons name="restaurant-outline" size={20} color={mutedColor} />
                </EmptyState.Media>
                <EmptyState.Title>No tables in this area</EmptyState.Title>
                <EmptyState.Description>Add the first dine-in table.</EmptyState.Description>
              </EmptyState.Header>
            </EmptyState>
          ) : (
            tables.map((table, index) => (
              <View key={table.id}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Edit table ${table.name}`}
                  onPress={() => openEdit(table)}
                  className="min-h-20 flex-row items-center gap-4 px-4 py-3 active:bg-surface-secondary md:px-6"
                >
                  <View className="size-11 items-center justify-center rounded-panel-inner bg-accent-soft">
                    <Ionicons name="restaurant-outline" size={20} color={accentColor} />
                  </View>
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center gap-2">
                      <Typography type="body-sm" weight="semibold" className="flex-1">
                        {table.name}
                      </Typography>
                      <Chip size="sm" variant="soft" color={table.active ? "success" : "default"}>
                        <Chip.Label>{table.active ? "Active" : "Inactive"}</Chip.Label>
                      </Chip>
                    </View>
                    <Typography type="body-xs" color="muted">
                      Capacity: {table.pax}
                    </Typography>
                  </View>
                  <Button
                    size="sm"
                    variant="ghost"
                    isIconOnly
                    accessibilityLabel={`Delete table ${table.name}`}
                    onPress={() => setDeletingTable(table)}
                  >
                    <Ionicons name="trash-outline" size={18} color={mutedColor} />
                  </Button>
                </Pressable>
                {index < tables.length - 1 ? <Separator className="mx-5" /> : null}
              </View>
            ))
          )}
        </ScrollView>
        <CreateFAB accessibilityLabel="Add table" onPress={openCreate} />
      </View>

      <TableFormDialog
        areaId={areaId}
        table={editingTable}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
      <ActionDialog
        isOpen={Boolean(deletingTable)}
        onOpenChange={(open) => {
          if (!open) setDeletingTable(null);
        }}
        title="Delete table?"
        description="The server may reject deletion when an order references this table."
        actionLabel={deleteMutation.isPending ? "Deleting…" : "Delete"}
        actionVariant="danger"
        isActionDisabled={deleteMutation.isPending}
        onAction={handleDelete}
      />
    </>
  );
}
