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
  showRowNumber?: boolean;
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
  showRowNumber = true,
}: DataGridProps<T>) {
  const colCount = columns.length + (showRowNumber ? 1 : 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm shadow-stone-200/30">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-150 bg-gradient-to-b from-stone-50 to-stone-50/30 text-left">
              {showRowNumber && (
                <th className="w-12 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-stone-400">
                  #
                </th>
              )}
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const canSort = col.sortable && onSort;
                return (
                  <th
                    key={col.key}
                    onClick={() => canSort && onSort!(col.key)}
                    className={cn(
                      'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-400 transition-colors',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      canSort && 'cursor-pointer select-none hover:text-stone-700',
                      col.className,
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {canSort && (
                        <span className={cn(
                          'text-[10px] transition',
                          isSorted ? 'text-stone-700' : 'text-stone-300',
                        )}>
                          {isSorted ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
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
                <td colSpan={colCount} className="px-4 py-16 text-center text-sm text-stone-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-stone-100/80 transition-colors duration-100',
                    idx % 2 === 1 && 'bg-stone-50/40',
                    onRowClick ? 'cursor-pointer' : 'hover:bg-stone-50/60',
                    onRowClick && 'hover:bg-stone-50/60',
                  )}
                >
                  {showRowNumber && (
                    <td className="px-3 py-2.5 text-center text-xs font-medium tabular-nums text-stone-400">
                      {idx + 1}
                    </td>
                  )}
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
      {rows.length > 0 && (
        <div className="border-t border-stone-100/80 bg-stone-50/30 px-4 py-2.5 text-xs text-stone-400">
          {rows.length} {rows.length === 1 ? 'row' : 'rows'}
        </div>
      )}
    </div>
  );
}
