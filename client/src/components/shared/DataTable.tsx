import React from 'react';

export interface Column<T = any> {
  header: string;
  accessor?: (item: T) => React.ReactNode;
  cell?: (item: T) => React.ReactNode;
  accessorKey?: string;
}

export function DataTable<T = any>({
  columns, data, loading, emptyMessage = 'No data available', onRowClick,
}: {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}) {
  if (loading) {
    return (
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ height: '48px', background: '#161616', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center', color: '#4b4b4b', background: '#111111', border: '1px solid #2a2a2a', borderRadius: '10px', fontSize: '0.875rem' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', border: '1px solid #2a2a2a', borderRadius: '10px', background: '#111111' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1f1f1f', background: '#0d0d0d' }}>
            {columns.map((col, i) => (
              <th key={i} style={{ padding: '12px 16px', textAlign: 'left', color: '#4b4b4b', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, i) => (
            <tr key={row._id || i}
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default', borderBottom: '1px solid #141414', transition: 'background 0.1s' }}
              onMouseEnter={e => { if (onRowClick) (e.currentTarget as HTMLElement).style.background = '#161616'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              {columns.map((col, j) => (
                <td key={j} style={{ padding: '12px 16px', color: '#ffffff', verticalAlign: 'middle' }}>
                  {col.accessor
                    ? col.accessor(row)
                    : col.cell
                    ? col.cell(row)
                    : col.accessorKey
                    ? row[col.accessorKey]
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
