import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from '@tanstack/react-table';
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';

import { cn } from '#/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table';

export type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T, unknown>[];

  /**
   * Multi-column sort as a single dot-separated expression.
   * Bare id = asc, `-` prefix = desc. Tokens are split on `.`.
   * Order is the sort priority (first = primary).
   * Example: `"name.-age"` → name asc, then age desc.
   * Note: this wire format reserves `.` as the field separator, so nested
   * sort-on paths (e.g. `owner.name`) are not expressible.
   */
  sortBy?: string;
  onSort?: (expr: string) => void;

  multiSelect?: boolean;
  onSelected?: (rows: T[]) => void;

  onRowClick?: (row: T) => void;

  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  getRowId?: (row: T) => string;
  className?: string;
};

export function parseSortBy(value: string | undefined): SortingState {
  if (!value) return [];
  return value
    .split('.')
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => (token.startsWith('-') ? { id: token.slice(1), desc: true } : { id: token, desc: false }))
    .filter((s) => s.id.length > 0);
}

export function formatSortBy(state: SortingState): string {
  return state.map((s) => (s.desc ? `-${s.id}` : s.id)).join('.');
}

const SELECTION_COLUMN_ID = '__select__';

export function DataTable<T>({
  data,
  columns,
  sortBy,
  onSort,
  multiSelect = false,
  onSelected,
  onRowClick,
  isLoading,
  emptyMessage = 'No data',
  getRowId,
  className,
}: DataTableProps<T>) {
  const sorting = React.useMemo(() => parseSortBy(sortBy), [sortBy]);

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const selectionEnabled = !!onSelected;

  const composedColumns = React.useMemo<ColumnDef<T, unknown>[]>(() => {
    if (!selectionEnabled) return columns;
    const selectionColumn: ColumnDef<T, unknown> = {
      id: SELECTION_COLUMN_ID,
      enableSorting: false,
      size: 32,
      header: ({ table }) =>
        multiSelect ? (
          <input
            type="checkbox"
            aria-label="Select all"
            className="size-4 cursor-pointer rounded border-input accent-primary"
            checked={table.getIsAllRowsSelected()}
            ref={(el) => {
              if (el) el.indeterminate = table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected();
            }}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ) : null,
      cell: ({ row }) => (
        <input
          type={multiSelect ? 'checkbox' : 'radio'}
          aria-label="Select row"
          className="size-4 cursor-pointer rounded border-input accent-primary"
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onClick={(e) => e.stopPropagation()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    };
    return [selectionColumn, ...columns];
  }, [columns, multiSelect, selectionEnabled]);

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === 'function' ? (updater as (prev: SortingState) => SortingState)(sorting) : updater;
    onSort?.(formatSortBy(next));
  };

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater: Updater<RowSelectionState>) => {
    setRowSelection((prev) => {
      const next =
        typeof updater === 'function' ? (updater as (p: RowSelectionState) => RowSelectionState)(prev) : updater;
      return next;
    });
  };

  const table = useReactTable({
    data,
    columns: composedColumns,
    state: { sorting, rowSelection },
    manualSorting: true,
    enableMultiSort: true,
    enableSortingRemoval: true,
    enableRowSelection: selectionEnabled,
    enableMultiRowSelection: selectionEnabled && multiSelect,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
    onSortingChange: handleSortingChange,
    onRowSelectionChange: handleRowSelectionChange,
  });

  const lastSelectedKey = React.useRef<string>('');
  React.useEffect(() => {
    if (!selectionEnabled) return;
    const selected = table.getSelectedRowModel().rows;
    const key = selected.map((r) => r.id).join(',');
    if (key === lastSelectedKey.current) return;
    lastSelectedKey.current = key;
    onSelected?.(selected.map((r) => r.original));
  }, [rowSelection, selectionEnabled, onSelected, table]);

  const totalCols = composedColumns.length;
  const sortChainLength = sorting.length;

  return (
    <Table className={className}>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const canSort = header.column.getCanSort();
              const sortDir = header.column.getIsSorted();
              const sortIndex = header.column.getSortIndex();
              const content = header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext());
              return (
                <TableHead key={header.id}>
                  {canSort ? (
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      <span>{content}</span>
                      <SortIcon dir={sortDir} />
                      {sortChainLength > 1 && sortDir && (
                        <span className="ml-0.5 rounded bg-muted px-1 text-[10px] leading-4 text-muted-foreground">
                          {sortIndex + 1}
                        </span>
                      )}
                    </button>
                  ) : (
                    content
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <SkeletonRows colCount={totalCols} />
        ) : table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={totalCols} className="text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => <DataTableRow key={row.id} row={row} onRowClick={onRowClick} />)
        )}
      </TableBody>
    </Table>
  );
}

function DataTableRow<T>({ row, onRowClick }: { row: Row<T>; onRowClick?: (row: T) => void }) {
  return (
    <TableRow
      data-state={row.getIsSelected() ? 'selected' : undefined}
      className={cn(onRowClick && 'cursor-pointer')}
      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
      ))}
    </TableRow>
  );
}

function SortIcon({ dir }: { dir: false | 'asc' | 'desc' }) {
  if (dir === 'asc') return <ChevronUp className="size-3" />;
  if (dir === 'desc') return <ChevronDown className="size-3" />;
  return <ChevronsUpDown className="size-3 opacity-50" />;
}

function SkeletonRows({ colCount }: { colCount: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: colCount }).map((__, j) => (
            <TableCell key={j}>
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export { createColumnHelper } from '@tanstack/react-table';
export type { ColumnDef, RowSelectionState, SortingState } from '@tanstack/react-table';
