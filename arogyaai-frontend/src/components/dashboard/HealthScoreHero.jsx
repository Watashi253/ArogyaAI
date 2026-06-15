import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { ProgressRing, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui'
import { getScoreLabel } from '@/utils/dashboardAnalytics'

export function HealthScoreHero({ score, greeting, name }) {
  const { label, color } = getScoreLabel(score)

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 text-white p-6 sm:p-8 mb-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <p className="text-brand-200 text-sm font-medium mb-1">{greeting}</p>
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight mb-2">{name}</h1>
          <p className="text-brand-100/80 text-sm max-w-md">
            Your daily health score reflects nutrition, hydration, sleep, activity, and medicine adherence.
          </p>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <ProgressRing
            value={score ?? 0}
            max={100}
            size={120}
            strokeWidth={10}
            color="#5eead4"
            trackColor="rgba(255,255,255,0.15)"
          >
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums">{score ?? '—'}</p>
              <p className="text-[10px] uppercase tracking-wider text-brand-200">Score</p>
            </div>
          </ProgressRing>
          <div>
            <Badge className="bg-white/15 text-white border-0 mb-1">{label}</Badge>
            <p className="text-xs text-brand-200">Updated today</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ObservationsPanel({ insights }) {
  if (!insights?.length) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-600" />
          <CardTitle>AI observations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-surface-500 py-4">
            Log more health data to unlock personalized AI observations.
          </p>
          <Link to="/insights" className="text-sm text-brand-600 font-medium inline-flex items-center gap-1">
            View insights <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="h-full bg-gradient-to-br from-brand-50/80 to-white border-brand-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <CardTitle>AI observations</CardTitle>
          </div>
          <Link to="/insights" className="text-xs text-brand-600 font-medium hover:text-brand-700">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {insights.map((text, i) => (
              <li
                key={i}
                className="text-sm text-surface-700 leading-relaxed pl-3 border-l-2 border-brand-300"
              >
                {text}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  )
}
