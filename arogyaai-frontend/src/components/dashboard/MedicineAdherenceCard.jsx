import { Link } from 'react-router-dom'
import { Check, Pill } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, ProgressRing, Badge, Button } from '@/components/ui'

export function MedicineAdherenceCard({ schedule = [], adherenceRate = 0 }) {
  const taken = schedule.filter((m) => m.takenToday).length
  const total = schedule.length

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-violet-500" />
          <CardTitle>Medicine adherence</CardTitle>
        </div>
        <Link to="/medicines" className="text-xs text-brand-600 font-medium">
          Manage
        </Link>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-surface-500 mb-3">No medicines scheduled today.</p>
            <Link to="/medicines">
              <Button size="sm" variant="secondary">Add medicine</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-6 mb-5">
              <ProgressRing
                value={adherenceRate}
                max={100}
                size={88}
                strokeWidth={8}
                color="#8b5cf6"
              >
                <span className="text-lg font-semibold tabular-nums">{adherenceRate}%</span>
              </ProgressRing>
              <div>
                <p className="text-2xl font-semibold text-surface-900 tabular-nums">
                  {taken}/{total}
                </p>
                <p className="text-sm text-surface-500">doses taken today</p>
              </div>
            </div>
            <div className="space-y-2">
              {schedule.slice(0, 3).map((med) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">{med.name}</p>
                    <p className="text-xs text-surface-400">{med.dose}</p>
                  </div>
                  {med.takenToday ? (
                    <Badge variant="success" className="shrink-0 gap-1">
                      <Check className="h-3 w-3" /> Taken
                    </Badge>
                  ) : (
                    <Badge className="shrink-0">Pending</Badge>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
