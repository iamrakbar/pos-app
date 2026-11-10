import { Skeleton, Table } from "panelui-native";
import { ScrollView, View } from "react-native";

const SKELETON_CELL_WIDTHS: Record<number, string> = {
  0: "w-32",
  1: "w-16",
  2: "w-20",
  3: "w-20",
  4: "w-24",
  5: "w-32",
  6: "w-20",
  7: "w-28",
  8: "w-28",
};

type InventoryTableSkeletonProps = {
  headings: readonly { id: string }[];
  columnWidths: number[];
  tableWidth: number;
};

export default function InventoryTableSkeleton({
  headings,
  columnWidths,
  tableWidth,
}: InventoryTableSkeletonProps) {
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="w-full px-4 py-4 pb-24 md:px-6"
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    >
      <ScrollView horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false}>
        <View style={{ width: tableWidth }} accessibilityRole="progressbar">
          <Table.Frame columns={columnWidths.map((width) => ({ width }))}>
            <Table.Header>
              <Table.Row>
                {headings.map(({ id }) => (
                  <Table.Head key={id}>
                    <Skeleton className="h-3 w-20 rounded-md" />
                  </Table.Head>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {Array.from({ length: 6 }, (_, rowIndex) => (
                <Table.Row key={`row-${rowIndex}`}>
                  {columnWidths.map((_, columnIndex) => (
                    <Table.Cell key={`cell-${rowIndex}-${columnIndex}`}>
                      <Skeleton
                        className={
                          columnIndex === 6
                            ? `h-6 ${SKELETON_CELL_WIDTHS[columnIndex] ?? "w-24"} rounded-full`
                            : `h-4 ${SKELETON_CELL_WIDTHS[columnIndex] ?? "w-24"} rounded-md`
                        }
                      />
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Frame>
        </View>
      </ScrollView>
    </ScrollView>
  );
}
