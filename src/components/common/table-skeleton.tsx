import { Skeleton } from "heroui-native";
import { Table } from "heroui-native-pro";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";

type TableSkeletonProps = {
  columnWidths: readonly number[];
  rows?: number;
};

const CELL_SKELETON_WIDTHS = [
  "w-32",
  "w-16",
  "w-20",
  "w-20",
  "w-24",
  "w-32",
  "w-20",
  "w-28",
  "w-28",
] as const;

export default function TableSkeleton({ columnWidths, rows = 6 }: TableSkeletonProps): JSX.Element {
  return (
    <ScrollView className="flex-1" contentContainerClassName="w-full px-4 py-4 pb-24 md:px-6">
      <View className="flex-1 items-center w-full">
        <Table variant="secondary">
          <Table.ScrollContainer className="w-full self-center">
            <Table.Content className="w-full">
              <Table.Header>
                {columnWidths.map((width, index) => (
                  <Table.Column key={`skeleton-column-${index}`} width={width}>
                    <Skeleton
                      variant="shimmer"
                      animation={{ state: "disabled", shimmer: { duration: 1800, speed: 0.75 } }}
                      className="h-3 w-20 rounded-md"
                    />
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body>
                {Array.from({ length: rows }, (_, rowIndex) => (
                  <Table.Row key={`skeleton-row-${rowIndex}`} id={`skeleton-row-${rowIndex}`}>
                    {columnWidths.map((_, columnIndex) => (
                      <Table.Cell key={`skeleton-cell-${rowIndex}-${columnIndex}`}>
                        <Skeleton
                          variant="shimmer"
                          animation={{
                            state: "disabled",
                            shimmer: { duration: 1800, speed: 0.75 },
                          }}
                          className={
                            columnIndex === 6
                              ? `h-6 ${CELL_SKELETON_WIDTHS[columnIndex] ?? "w-24"} rounded-full`
                              : `h-4 ${CELL_SKELETON_WIDTHS[columnIndex] ?? "w-24"} rounded-md`
                          }
                        />
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </View>
    </ScrollView>
  );
}
