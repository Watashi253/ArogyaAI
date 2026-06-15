import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Activity as ActivityIcon, Plus, Trash2, Trophy } from 'lucide-react'
import { activityService } from '@/services'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/contexts/ToastContext'
import { useDisclosure } from '@/hooks/useMediaQuery'
import { PeriodTabs } from '@/components/tracking/PeriodTabs'
import { MacroStat } from '@/components/tracking/MacroGrid'
import {
  PageHeader, Card, CardHeader, CardTitle, CardContent,
  Button, Modal, Input, Select, Textarea, Badge, SkeletonDashboard, EmptyState,
} from '@/components/ui'
import { TrendBarChart } from '@/components/charts/TrendChart'
import { todayApiDate } from '@/utils/dates'
import { formatNumber, capitalize } from '@/utils/formatters'
import { getErrorMessage } from '@/utils/errors'
import { FEATURED_ACTIVITIES, buildActivityChartData, buildActivityTypeBreakdown } from '@/utils/trackingAnalytics'

export default function ActivityPage() {
  const toast = useToast()
  const [period, setPeriod] = useState('day')
  const modal = useDisclosure()
  const date = todayApiDate()

  const fetchData = useCallback(async () => {
    const [daily, week, month, stats, types] = await Promise.all([
      activityService.getLogs(date).then((r) => r.data),
      activityService.getWeek().then((r) => r.data),
      activityService.getMonth().then((r) => r.data),
      activityService.getStats().then((r) => r.data),
      activityService.getTypes().then((r) => r.data),
    ])
    return { daily, week, month, stats, types }
  }, [date])

  const { data, isLoading, execute } = useAsync(fetchData, [fetchData])

  const periodData = period === 'week' ? data?.week : period === 'month' ? data?.month : null
  const chartDays = period === 'month' ? 30 : 7
  const chartData = useMemo(
    () => buildActivityChartData(periodData?.logs || data?.week?.logs, chartDays),
    [periodData, data?.week, chartDays]
  )
  const typeBreakdown = useMemo(
    () => buildActivityTypeBreakdown(periodData?.groupedByType || data?.week?.groupedByType),
    [periodData, data?.week]
  )

  const summary = period === 'day' ? data?.daily?.summary : periodData?.summary
  const logs = period === 'day' ? data?.daily?.logs || [] : periodData?.logs || []

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { date, type: 'walking' },
  })

  const onSubmit = async (formData) => {
    try {
      await activityService.log({
        date: formData.date,
        type: formData.type,
        durationMins: Number(formData.durationMins),
        notes: formData.notes || undefined,
      })
      toast.success('Activity logged')
      modal.close()
      reset({ date, type: 'walking' })
      execute()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const removeLog = async (id) => {
    try {
      await activityService.remove(id)
      toast.success('Removed')
      execute()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const quickLog = (type) => {
    reset({ date, type })
    modal.open()
  }

  if (isLoading) return <SkeletonDashboard />

  const activityTypes = data?.types || {}
  const achievements = data?.stats?.achievements

  return (
    <div>
      <PageHeader
        title="Activity"
        description="Log walking, running, cycling, gym, yoga, swimming and more."
        action={<Button onClick={modal.open}><Plus className="h-4 w-4" /> Log activity</Button>}
      />

      <div className="mb-6"><PeriodTabs value={period} onChange={setPeriod} /></div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MacroStat label="Duration" value={`${summary?.totalDurationMins || 0}`} unit="min" />
        <MacroStat label="Calories" value={formatNumber(summary?.totalCalories)} unit="kcal" />
        <MacroStat label="Sessions" value={summary?.activityCount || 0} />
        <MacroStat label="Active days" value={summary?.daysActive || (period === 'day' ? (logs.length ? 1 : 0) : '—')} />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-8">
        {FEATURED_ACTIVITIES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => quickLog(key)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-surface-100 hover:border-brand-200 hover:bg-brand-50/30 transition-colors"
          >
            <ActivityIcon className="h-5 w-5 text-brand-600" />
            <span className="text-xs font-medium text-surface-700">{label}</span>
          </button>
        ))}
      </div>

      {achievements && period === 'day' && (
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(achievements).map(([key, earned]) => (
                <Badge key={key} variant={earned ? 'success' : 'default'}>
                  {capitalize(key.replace(/([A-Z])/g, ' $1'))}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader><CardTitle>{period === 'day' ? "Today's log" : 'Activity history'}</CardTitle></CardHeader>
          <CardContent>
            {!logs.length ? (
              <EmptyState icon={ActivityIcon} title="No activities" action={<Button size="sm" onClick={modal.open}>Log activity</Button>} />
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-3 px-3 rounded-xl bg-surface-50">
                    <div>
                      <p className="text-sm font-medium capitalize">{activityTypes[log.type]?.name || log.type}</p>
                      <p className="text-xs text-surface-400">{log.durationMins} min · {formatNumber(log.caloriesBurned)} kcal</p>
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
          <CardHeader><CardTitle>{period === 'month' ? 'Monthly' : 'Weekly'} minutes</CardTitle></CardHeader>
          <CardContent>
            <TrendBarChart data={chartData} dataKey="minutes" color="#f43f5e" label="min" height={240} />
          </CardContent>
        </Card>
      </div>

      {typeBreakdown.length > 0 && period !== 'day' && (
        <Card>
          <CardHeader><CardTitle>By activity type</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {typeBreakdown.map((t) => (
                <div key={t.type} className="p-3 rounded-xl bg-surface-50">
                  <p className="text-sm font-medium capitalize">{t.name}</p>
                  <p className="text-xs text-surface-400 mt-1">{t.minutes} min · {t.count} sessions · {formatNumber(t.calories)} kcal</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Modal isOpen={modal.isOpen} onClose={modal.close} title="Log activity">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Date" type="date" {...register('date', { required: true })} />
          <Select label="Activity" {...register('type', { required: true })}>
            {Object.entries(activityTypes).map(([key, val]) => (
              <option key={key} value={key}>{val.name || capitalize(key)} ({val.caloriesPerHour} cal/hr)</option>
            ))}
          </Select>
          <Input label="Duration (minutes)" type="number" {...register('durationMins', { required: true })} />
          <Textarea label="Notes" {...register('notes')} />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>Save</Button>
        </form>
      </Modal>
    </div>
  )
}
