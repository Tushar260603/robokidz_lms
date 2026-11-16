import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loader({ fullScreen = false, text = 'Loading...' }) {
  if (fullScreen) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: '#64748b' }}>
        <Loader2 size={36} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.875rem' }}>{text}</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '0.875rem' }}>{text}</span>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
