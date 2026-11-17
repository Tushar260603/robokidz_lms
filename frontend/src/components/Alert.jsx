import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export default function Alert({ type = 'error', message, onClose }) {
  if (!message) return null;

  const map = {
    error:   { cls: 'alert-error',   Icon: AlertCircle },
    success: { cls: 'alert-success', Icon: CheckCircle },
    info:    { cls: 'alert-info',    Icon: Info },
  };
  const { cls, Icon } = map[type] || map.error;

  return (
    <div className={`alert ${cls}`}>
      <Icon size={17} style={{ flexShrink: 0, marginTop: '1px' }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', fontSize: '1.1rem', lineHeight: 1, padding: 0, opacity: 0.7 }}
          title="Dismiss">×</button>
      )}
    </div>
  );
}
