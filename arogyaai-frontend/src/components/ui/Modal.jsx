import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

export function Modal({ isOpen, onClose, title, description, children, className }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-surface-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'pointer-events-auto w-full max-w-lg bg-white rounded-2xl shadow-elevated',
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between p-5 border-b border-surface-100">
                <div>
                  {title && (
                    <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
                  )}
                  {description && (
                    <p className="text-sm text-surface-500 mt-0.5">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
