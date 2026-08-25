import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  render: (row: T) => React.ReactNode;
}

interface DataGridProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  emptyMessage?: string;
}

export function DataGrid<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  sortKey,
  sortDir,
  onSort,
  emptyMessage = 'No data',
}: DataGridProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/60 text-left">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const canSort = col.sortable && onSort;
                return (
                  <th
                    key={col.key}
                    onClick={() => canSort && onSort!(col.key)}
                    className={cn(
                      'px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-400',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      canSort && 'cursor-pointer select-none hover:text-stone-600',
                      col.className,
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {canSort && (
                        <span className={cn('text-[10px] transition', isSorted ? 'text-stone-700' : 'text-transparent')}>
                          {isSorted ? (sortDir === 'asc' ? '↑' : '↓') : '↑'}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-stone-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-stone-50 transition',
                    onRowClick && 'cursor-pointer hover:bg-stone-50/60',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-2.5 text-stone-700',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.className,
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
