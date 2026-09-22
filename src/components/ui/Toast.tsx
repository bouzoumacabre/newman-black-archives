import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastKind = 'info' | 'success' | 'warning' | 'danger'
interface ToastItem { id: number; message: string; kind: ToastKind }
interface ToastContextValue { pushToast: (message: string, kind?: ToastKind) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const pushToast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random()
    setItems((prev) => [...prev, { id, message, kind }])
    window.setTimeout(() => setItems((prev) => prev.filter((item) => item.id !== id)), 4200)
  }, [])
  const value = useMemo(() => ({ pushToast }), [pushToast])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map((item) => <div key={item.id} className={`toast toast-${item.kind}`}>{item.message}</div>)}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside ToastProvider')
  return value
}
