import { useCallback, useMemo, useState } from 'react'
import { Droplets, Trash2, Plus } from 'lucide-react'
import { waterService } from '@/services'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/contexts/ToastContext'
import { PeriodTabs } from '@/components/tracking/PeriodTabs'
import { MacroStat } from '@/components/tracking/MacroGrid'
import {
  PageHeader, Card, CardHeader, CardTitle, CardContent,
  ProgressRing, Button, Input, SkeletonDashboard,
} from '@/components/ui'
import { TrendBarChart } from '@/components/charts/TrendChart'
import { todayApiDate, formatTime } from '@/utils/dates'
import { formatMl } from '@/utils/formatters'
import { getErrorMessage } from '@/utils/errors'
import { buildWaterChartData } from '@/utils/trackingAnalytics'

export default function WaterPage() {
  const toast = useToast()
  const { user } = useAuth()
  const [period, setPeriod] = useState('day')
  const [customMl, setCustomMl] = useState('')
  const targetMl = user?.profile?.targetWaterMl || 2000

  const fetchData = useCallback(async () => {
    const [daily, week, month] = await Promise.all([
      waterService.getDaily().then((r) => r.data),
      waterService.getWeek().then((r) => r.data),
      waterService.getMonth().then((r) => r.data),
    ])
    return { daily, week, month }
  }, [])

  const { data, isLoading, execute } = useAsync(fetchData, [fetchData])

  const periodData = period === 'week' ? data?.week : period === 'month' ? data?.month : null
  const chartDays = period === 'month' ? 30 : 7
  const chartData = useMemo(
    () => buildWaterChartData(periodData?.groupedByDay || data?.week?.groupedByDay, chartDays),
    [periodData, data?.week, chartDays]
  )

  const summary = period === 'day' ? data?.daily?.summary : periodData?.summary
  const goal = summary?.targetMl || targetMl

  const displayProgress = period === 'day'
    ? Math.min(100, Math.round(((summary?.totalMl || 0) / goal) * 100))
    : Math.round(((summary?.complianceDays || 0) / Math.max(summary?.daysLogged || 1, 1)) * 100)

  const logWater = async (amountMl) => {
    if (!amountMl || amountMl <= 0) return
    try {
      await waterService.log({ date: todayApiDate(), amountMl })
      toast.success(`Added ${formatMl(amountMl)}`)
      setCustomMl('')
      execute()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const removeLog = async (id) => {
    try {
      await waterService.remove(id)
      toast.success('Removed')
      execute()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (isLoading) return <SkeletonDashboard />

  const quickOptions = data?.daily?.quickAddOptions || [
    { label: '200ml', amount: 200 }, { label: '250ml', amount: 250 },
    { label: '500ml', amount: 500 }, { label: '1L', amount: 1000 },
  ]

  const historyLogs = period === 'day'
    ? data?.daily?.logs || []
    : (periodData?.logs || []).slice(0, 20)

  return (
    <div>
      <PageHeader title="Hydration" description="Track water intake, goals, and history." />

      <div className="mb-6"><PeriodTabs value={period} onChange={setPeriod} /></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center">
            <ProgressRing value={period === 'day' ? summary?.totalMl || 0 : summary?.averageDailyMl || 0} max={goal} size={160} strokeWidth={10} color="#0ea5e9">
              <div className="text-center">
                <Droplets className="h-5 w-5 text-sky-500 mx-auto mb-1" />
                <p className="text-2xl font-semibold tabular-nums">
                  {period === 'day' ? formatMl(summary?.totalMl) : formatMl(summary?.averageDailyMl)}
                </p>
                <p className="text-xs text-surface-400">{displayProgress}% {period === 'day' ? 'of goal' : 'compliance'}</p>
              </div>
            </ProgressRing>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MacroStat label="Intake" value={period === 'day' ? formatMl(summary?.totalMl) : formatMl(summary?.totalMl)} subtext={period === 'day' ? 'Today' : `Last ${chartDays} days`} />
          <MacroStat label="Goal" value={formatMl(goal)} subtext="Daily target" />
          <MacroStat label="Progress" value={`${displayProgress}%`} subtext={period !== 'day' ? `${summary?.complianceDays || 0} goal days` : `${formatMl(summary?.remaining || Math.max(0, goal - (summary?.totalMl || 0)))} left`} />
        </div>
      </div>

      {period === 'day' && (
        <Card className="mb-8">
          <CardHeader><CardTitle>Quick add</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickOptions.map((opt) => (
                <Button key={opt.amount} variant="secondary" className="h-auto py-4 flex-col" onClick={() => logWater(opt.amount)}>
                  <span className="text-lg font-semibold">+{formatMl(opt.amount)}</span>
                  <span className="text-xs text-surface-400">{opt.label}</span>
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input type="number" placeholder="Custom ml" value={customMl} onChange={(e) => setCustomMl(e.target.value)} />
              <Button onClick={() => logWater(Number(customMl))}><Plus className="h-4 w-4" /> Add</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>History</CardTitle></CardHeader>
          <CardContent>
            {!historyLogs.length ? (
              <p className="text-sm text-surface-500 py-4">No entries yet.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {historyLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-surface-50">
                    <div>
                      <span className="text-sm font-medium">{formatMl(log.amountMl)}</span>
                      {log.loggedAt && <span className="text-xs text-surface-400 ml-2">{formatTime(log.loggedAt)}</span>}
                    </div>
                    {period === 'day' && (
                      <button type="button" onClick={() => removeLog(log.id)} className="p-1.5 text-surface-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{period === 'month' ? 'Monthly' : 'Weekly'} trend</CardTitle>
            {periodData?.summary && (
              <p className="text-xs text-surface-400">Avg {formatMl(periodData.summary.averageDailyMl)} / day</p>
            )}
          </CardHeader>
          <CardContent>
            <TrendBarChart data={chartData} dataKey="total" color="#0ea5e9" label="ml" height={240} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
