import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  accessor?: (row: T) => string | number
  sortable?: boolean
  align?: 'left' | 'right'
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  getRowId: (row: T) => string
  emptyState?: ReactNode
  onRowClick?: (row: T) => void
}

/** Minimal generic sortable table — no virtualization or pagination; add those when a dataset needs them. */
export function DataTable<T>({ columns, data, getRowId, emptyState, onRowClick }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sorted = useMemo(() => {
    const column = columns.find((c) => c.key === sortKey)
    if (!column?.accessor) return data
    const accessor = column.accessor
    return [...data].sort((a, b) => {
      const av = accessor(a)
      const bv = accessor(b)
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir, columns])

  function toggleSort(column: DataTableColumn<T>) {
    if (!column.sortable) return
    if (sortKey === column.key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(column.key)
      setSortDir('asc')
    }
  }

  if (data.length === 0 && emptyState) return <>{emptyState}</>

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key} className={column.align === 'right' ? 'text-right' : undefined}>
              {column.sortable ? (
                <button
                  type="button"
                  onClick={() => toggleSort(column)}
                  className="focus-ring inline-flex items-center gap-1 rounded transition-fast hover:text-foreground"
                >
                  {column.header}
                  <ArrowUpDown className={cn('size-3', sortKey === column.key && 'text-accent')} />
                </button>
              ) : (
                column.header
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow
            key={getRowId(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={onRowClick ? 'cursor-pointer' : undefined}
          >
            {columns.map((column) => (
              <TableCell key={column.key} className={column.align === 'right' ? 'text-right' : undefined}>
                {column.render ? column.render(row) : (column.accessor?.(row) ?? '')}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
