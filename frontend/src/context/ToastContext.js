import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 999, display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === 'success' ? '#1a7a40' : t.type === 'error' ? '#c0392b' : '#1a1a18',
            color: '#fff', padding: '.75rem 1.25rem', fontFamily: 'Manrope, sans-serif',
            fontSize: '.8rem', fontWeight: 500, animation: 'slideIn .3s ease',
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
