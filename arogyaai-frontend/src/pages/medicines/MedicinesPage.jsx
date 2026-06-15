import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Pill, Plus, Check, Trash2, Clock, AlertCircle } from 'lucide-react'
import { medicineService } from '@/services'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/contexts/ToastContext'
import { useDisclosure } from '@/hooks/useMediaQuery'
import { PeriodTabs } from '@/components/tracking/PeriodTabs'
import { MacroStat } from '@/components/tracking/MacroGrid'
import {
  PageHeader, Card, CardHeader, CardTitle, CardContent,
  Button, Modal, Input, Textarea, Badge, ProgressRing,
  SkeletonDashboard, EmptyState,
} from '@/components/ui'
import { TrendBarChart } from '@/components/charts/TrendChart'
import { formatDisplayDate, formatTime } from '@/utils/dates'
import { getErrorMessage } from '@/utils/errors'
import { buildMedicineAdherenceChart } from '@/utils/trackingAnalytics'

export default function MedicinesPage() {
  const toast = useToast()
  const [period, setPeriod] = useState('day')
  const modal = useDisclosure()

  const fetchData = useCallback(async () => {
    const [today, all, history7, history30] = await Promise.all([
      medicineService.today().then((r) => r.data),
      medicineService.list().then((r) => r.data),
      medicineService.history(7).then((r) => r.data),
      medicineService.history(30).then((r) => r.data),
    ])
    return { today, all, history7, history30 }
  }, [])

  const { data, isLoading, execute } = useAsync(fetchData, [fetchData])

  const historyData = period === 'week' ? data?.history7 : period === 'month' ? data?.history30 : null
  const schedule = data?.today?.schedule || []
  const adherenceRate = period === 'day'
    ? Number(data?.today?.adherenceRate) || 0
    : historyData?.summary?.adherenceRate || 0

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { frequency: 'Once daily' },
  })

  const onSubmit = async (formData) => {
    try {
      await medicineService.create({
        name: formData.name,
        dose: formData.dose,
        frequency: formData.frequency,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        notes: formData.notes || undefined,
        times: formData.times
          ? formData.times.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      })
      toast.success('Medicine added')
      modal.close()
      reset({ frequency: 'Once daily' })
      execute()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const markTaken = async (id) => {
    try {
      await medicineService.take(id)
      toast.success('Marked as taken')
      execute()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const removeMedicine = async (id) => {
    try {
      await medicineService.remove(id)
      toast.success('Removed')
      execute()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (isLoading) return <SkeletonDashboard />

  const missedToday = period === 'day'
    ? schedule.filter((m) => !m.takenToday)
    : historyData?.missedToday || []
  const historyLogs = historyData?.logs || []

  const adherenceChart = period === 'day'
    ? []
    : buildMedicineAdherenceChart(historyLogs, period === 'week' ? 7 : 30)

  return (
    <div>
      <PageHeader
        title="Medicines"
        description="Manage prescriptions, schedules, adherence, and history."
        action={<Button onClick={modal.open}><Plus className="h-4 w-4" /> Add medicine</Button>}
      />

      <div className="mb-6"><PeriodTabs value={period} onChange={setPeriod} /></div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card className="flex flex-col items-center justify-center p-6">
          <ProgressRing value={adherenceRate} max={100} size={100} strokeWidth={8} color="#8b5cf6">
            <span className="text-xl font-semibold tabular-nums">{adherenceRate}%</span>
          </ProgressRing>
          <p className="text-sm text-surface-500 mt-3">Adherence</p>
        </Card>
        <MacroStat label="Active medicines" value={data?.all?.active?.length || 0} />
        <MacroStat label="Taken" value={period === 'day' ? schedule.filter((m) => m.takenToday).length : historyData?.summary?.taken || 0} />
        <MacroStat label="Missed doses" value={period === 'day' ? missedToday.length : historyData?.summary?.missed || 0} subtext={period === 'day' ? 'Today' : `Last ${period === 'week' ? 7 : 30} days`} />
      </div>

      {period === 'day' && missedToday.length > 0 && (
        <Card className="mb-8 border-amber-100 bg-amber-50/50">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-900">Missed doses today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {missedToday.map((med) => (
                <div key={med.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white">
                  <div>
                    <p className="text-sm font-medium">{med.name}</p>
                    <p className="text-xs text-surface-400">{med.dose} · {med.frequency}</p>
                    {med.times?.length > 0 && (
                      <p className="text-xs text-surface-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> {med.times.join(', ')}
                      </p>
                    )}
                  </div>
                  <Button size="sm" onClick={() => markTaken(med.id)}><Check className="h-4 w-4" /> Take</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader><CardTitle>{period === 'day' ? "Today's schedule" : 'Medicine history'}</CardTitle></CardHeader>
          <CardContent>
            {period === 'day' ? (
              schedule.length === 0 ? (
                <EmptyState icon={Pill} title="No medicines today" action={<Button size="sm" onClick={modal.open}>Add medicine</Button>} />
              ) : (
                <div className="space-y-2">
                  {schedule.map((med) => (
                    <div key={med.id} className="flex items-center justify-between py-3 px-3 rounded-xl bg-surface-50">
                      <div>
                        <p className="text-sm font-medium">{med.name}</p>
                        <p className="text-xs text-surface-400">{med.dose} · {med.frequency}</p>
                        {med.times?.length > 0 && (
                          <p className="text-xs text-surface-400 mt-0.5">Times: {med.times.join(', ')}</p>
                        )}
                      </div>
                      {med.takenToday ? (
                        <Badge variant="success">Taken</Badge>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => markTaken(med.id)}>
                          <Check className="h-4 w-4" /> Take
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {historyLogs.length === 0 ? (
                  <p className="text-sm text-surface-500 py-4">No history yet.</p>
                ) : (
                  historyLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-surface-50">
                      <div>
                        <p className="text-sm font-medium">{log.medicine?.name}</p>
                        <p className="text-xs text-surface-400">
                          {log.medicine?.dose} · {formatDisplayDate(log.scheduledAt)} {formatTime(log.scheduledAt)}
                        </p>
                      </div>
                      <Badge variant={log.status === 'taken' ? 'success' : log.status === 'missed' ? 'danger' : 'default'}>
                        {log.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {period !== 'day' && adherenceChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Adherence trend</CardTitle></CardHeader>
            <CardContent>
              <TrendBarChart data={adherenceChart} dataKey="taken" color="#8b5cf6" label="doses" height={240} />
            </CardContent>
          </Card>
        )}

        {period === 'day' && (
          <Card>
            <CardHeader><CardTitle>All medicines</CardTitle></CardHeader>
            <CardContent>
              <MedicineList active={data?.all?.active} completed={data?.all?.completed} onRemove={removeMedicine} />
            </CardContent>
          </Card>
        )}
      </div>

      <Modal isOpen={modal.isOpen} onClose={modal.close} title="Add medicine">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Medicine name" {...register('name', { required: true })} />
          <Input label="Dose" placeholder="e.g. 500mg" {...register('dose', { required: true })} />
          <Input label="Frequency" placeholder="e.g. Twice daily" {...register('frequency', { required: true })} />
          <Input label="Time(s)" hint="Comma-separated, e.g. 08:00, 20:00" {...register('times')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start date" type="date" {...register('startDate', { required: true })} />
            <Input label="End date" type="date" {...register('endDate')} />
          </div>
          <Textarea label="Notes" {...register('notes')} />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>Save</Button>
        </form>
      </Modal>
    </div>
  )
}

function MedicineList({ active, completed, onRemove }) {
  if (!active?.length && !completed?.length) {
    return <p className="text-sm text-surface-500 py-4">No medicines added.</p>
  }
  return (
    <div className="space-y-4">
      {active?.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-surface-400 uppercase mb-2">Active</h4>
          <div className="space-y-2">
            {active.map((med) => <MedicineRow key={med.id} med={med} onRemove={onRemove} />)}
          </div>
        </div>
      )}
      {completed?.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-surface-400 uppercase mb-2">Completed</h4>
          <div className="space-y-2">
            {completed.map((med) => <MedicineRow key={med.id} med={med} onRemove={onRemove} completed />)}
          </div>
        </div>
      )}
    </div>
  )
}

function MedicineRow({ med, onRemove, completed }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface-50">
      <div>
        <p className="text-sm font-medium">{med.name}</p>
        <p className="text-xs text-surface-400">{med.dose} · {med.frequency}</p>
        {med.times?.length > 0 && <p className="text-xs text-surface-400">{med.times.join(', ')}</p>}
      </div>
      <div className="flex items-center gap-2">
        {completed && <Badge>Done</Badge>}
        <button type="button" onClick={() => onRemove(med.id)} className="p-1.5 text-surface-400 hover:text-red-500">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
