import { Outlet, Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative bg-brand-800 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-600/40 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <div className="flex items-center gap-2.5 mb-16">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur font-semibold">
                A
              </div>
              <span className="font-semibold text-lg">Arogya</span>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-display text-4xl xl:text-5xl leading-tight mb-4">
                Your health journey,
                <br />
                intelligently guided.
              </h1>
              <p className="text-brand-100 text-lg max-w-md leading-relaxed">
                Track nutrition, sleep, hydration, and more — with AI insights
                that help you make better decisions every day.
              </p>
            </motion.div>
          </div>
          <p className="text-brand-200/60 text-sm">
            Trusted by people who take their wellness seriously.
          </p>
        </div>
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-surface-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-semibold text-sm">
                A
              </div>
              <span className="font-semibold text-surface-900 text-lg">Arogya</span>
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
