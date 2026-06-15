import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Moon, Plus, Trash2, Star } from 'lucide-react'
import { sleepService } from '@/services'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/contexts/ToastContext'
import { useDisclosure } from '@/hooks/useMediaQuery'
import { PeriodTabs } from '@/components/tracking/PeriodTabs'
import { MacroStat } from '@/components/tracking/MacroGrid'
import {
  PageHeader, Card, CardHeader, CardTitle, CardContent,
  Button, Modal, Input, SkeletonDashboard, EmptyState,
} from '@/components/ui'
import { TrendAreaChart } from '@/components/charts/TrendChart'
import { todayApiDate } from '@/utils/dates'
import { formatHours } from '@/utils/formatters'
import { getErrorMessage } from '@/utils/errors'
import { buildSleepChartData, formatBedWake } from '@/utils/trackingAnalytics'

function QualityStars({ rating }) {
  if (!rating) return <span className="text-surface-400 text-xs">—</span>
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-surface-200'}`} />
      ))}
    </div>
  )
}

export default function SleepPage() {
  const toast = useToast()
  const { user } = useAuth()
  const [period, setPeriod] = useState('day')
  const modal = useDisclosure()
  const date = todayApiDate()
  const targetHrs = user?.profile?.targetSleepHrs || 8

  const fetchData = useCallback(async () => {
    const [daily, week, month] = await Promise.all([
      sleepService.getLogs(date).then((r) => r.data),
      sleepService.getWeek().then((r) => r.data),
      sleepService.getMonth().then((r) => r.data),
    ])
    return { daily, week, month }
  }, [date])

  const { data, isLoading, execute } = useAsync(fetchData, [fetchData])

  const periodData = period === 'week' ? data?.week : period === 'month' ? data?.month : null
  const chartDays = period === 'month' ? 30 : 7
  const chartData = useMemo(
    () => buildSleepChartData(periodData?.logs || data?.week?.logs, chartDays),
    [periodData, data?.week, chartDays]
  )

  const summary = period === 'day' ? null : periodData?.summary
  const logs = period === 'day' ? data?.daily?.logs || [] : periodData?.logs || []

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { date, qualityRating: 3 },
  })

  const onSubmit = async (formData) => {
    try {
      const bedtime = new Date(`${formData.date}T${formData.bedtime}`)
      const wakeTime = new Date(`${formData.date}T${formData.wakeTime}`)
      if (wakeTime <= bedtime) wakeTime.setDate(wakeTime.getDate() + 1)
      await sleepService.log({
        date: formData.date,
        bedtime: bedtime.toISOString(),
        wakeTime: wakeTime.toISOString(),
        qualityRating: Number(formData.qualityRating),
      })
      toast.success('Sleep logged')
      modal.close()
      reset({ date, qualityRating: 3 })
      execute()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const removeLog = async (id) => {
    try {
      await sleepService.remove(id)
      toast.success('Removed')
      execute()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (isLoading) return <SkeletonDashboard />

  const todayLog = data?.daily?.logs?.[0]
  const todayMeta = formatBedWake(todayLog)

  return (
    <div>
      <PageHeader
        title="Sleep"
        description="Track bedtime, wake time, duration, and quality."
        action={<Button onClick={modal.open}><Plus className="h-4 w-4" /> Log sleep</Button>}
      />

      <div className="mb-6"><PeriodTabs value={period} onChange={setPeriod} /></div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {period === 'day' ? (
          <>
            <MacroStat label="Bedtime" value={todayMeta.bedtime} />
            <MacroStat label="Wake time" value={todayMeta.wakeTime} />
            <MacroStat label="Duration" value={todayMeta.duration} subtext={`Goal ${targetHrs}h`} />
            <MacroStat label="Quality" value={todayLog?.qualityRating ? `${todayLog.qualityRating}/5` : '—'} />
          </>
        ) : (
          <>
            <MacroStat label="Avg duration" value={summary?.averageHours ? formatHours(Number(summary.averageHours)) : '—'} />
            <MacroStat label="Nights logged" value={summary?.totalNights || 0} />
            <MacroStat label="Avg quality" value={summary?.averageQuality ? `${summary.averageQuality}/5` : '—'} />
            <MacroStat label="Target" value={`${targetHrs}h`} subtext="Per night" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader><CardTitle>{period === 'day' ? "Today's sleep" : 'Sleep history'}</CardTitle></CardHeader>
          <CardContent>
            {!logs.length ? (
              <EmptyState icon={Moon} title="No sleep logged" action={<Button size="sm" onClick={modal.open}>Log sleep</Button>} />
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log) => {
                  const meta = formatBedWake(log)
                  return (
                    <div key={log.id} className="flex items-center justify-between py-3 px-3 rounded-xl bg-surface-50">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 text-sm">
                        <div><p className="text-xs text-surface-400">Bedtime</p><p className="font-medium">{meta.bedtime}</p></div>
                        <div><p className="text-xs text-surface-400">Wake</p><p className="font-medium">{meta.wakeTime}</p></div>
                        <div><p className="text-xs text-surface-400">Duration</p><p className="font-medium">{meta.duration}</p></div>
                        <div><p className="text-xs text-surface-400">Quality</p><QualityStars rating={log.qualityRating} /></div>
                      </div>
                      {period === 'day' && (
                        <button type="button" onClick={() => removeLog(log.id)} className="p-1.5 text-surface-400 hover:text-red-500 ml-2">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{period === 'month' ? 'Monthly' : 'Weekly'} hours</CardTitle></CardHeader>
          <CardContent>
            <TrendAreaChart data={chartData} dataKey="hours" color="#6366f1" label="hours" height={280} />
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={modal.isOpen} onClose={modal.close} title="Log sleep">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Date" type="date" {...register('date', { required: true })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Bedtime" type="time" {...register('bedtime', { required: true })} />
            <Input label="Wake time" type="time" {...register('wakeTime', { required: true })} />
          </div>
          <Input label="Quality (1–5)" type="number" min={1} max={5} {...register('qualityRating')} />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>Save</Button>
        </form>
      </Modal>
    </div>
  )
}
