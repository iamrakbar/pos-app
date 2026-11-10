import type { TranslationKey } from "@/locales";
import { useTranslation } from "@/stores/use-locale";
import { Table } from "panelui-native";

type TableHeadingsProps = { columns: readonly TranslationKey[] };

export default function TableHeadings({ columns }: TableHeadingsProps) {
  const { t } = useTranslation();
  return (
    <Table.Header>
      <Table.Row>
        {columns.map((column) => (
          <Table.Head key={column}>{t(column)}</Table.Head>
        ))}
      </Table.Row>
    </Table.Header>
  );
}
