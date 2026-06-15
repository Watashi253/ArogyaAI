import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/utils/cn'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, message, type }])

      if (duration > 0) {
        setTimeout(() => dismiss(id), duration)
      }
    },
    [dismiss]
  )

  const value = useMemo(
    () => ({
      toast,
      success: (msg) => toast(msg, 'success'),
      error: (msg) => toast(msg, 'error'),
      info: (msg) => toast(msg, 'info'),
    }),
    [toast]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type] || Info
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                className={cn(
                  'pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-elevated min-w-[280px] max-w-sm',
                  t.type === 'success' && 'bg-brand-700 text-white',
                  t.type === 'error' && 'bg-red-600 text-white',
                  t.type === 'info' && 'bg-surface-800 text-white'
                )}
              >
                <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm flex-1">{t.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="opacity-70 hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
