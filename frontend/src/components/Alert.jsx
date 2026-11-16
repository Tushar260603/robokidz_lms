import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function Alert({ type = 'error', message, onClose }) {
  if (!message) return null;

  const styles = {
    error: { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', Icon: AlertCircle },
    success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534', Icon: CheckCircle },
    info: { bg: '#f0f9ff', border: '#bae6fd', color: '#075985', Icon: Info },
  };

  const current = styles[type] || styles.error;
  const { Icon } = current;

  return (
    <div style={{
      backgroundColor: current.bg, border: `1px solid ${current.border}`,
      color: current.color, padding: '0.75rem 1rem', borderRadius: '6px',
      display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem',
      fontSize: '0.875rem'
    }}>
      <Icon size={18} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 'bold' }}>
          ×
        </button>
      )}
    </div>
  );
}
