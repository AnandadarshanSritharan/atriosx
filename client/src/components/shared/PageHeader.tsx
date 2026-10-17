import React from 'react';

interface PageHeaderProps { title: string; subtitle?: string; actions?: React.ReactNode }

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '0.85rem', color: '#6b6b6b', marginTop: '4px' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

export default PageHeader;
