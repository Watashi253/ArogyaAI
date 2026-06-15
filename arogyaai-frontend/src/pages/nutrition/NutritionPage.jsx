import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Camera, Plus, Download, Utensils } from 'lucide-react'
import { nutritionService, healthService } from '@/services'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/contexts/ToastContext'
import { useDisclosure } from '@/hooks/useMediaQuery'
import { PeriodTabs } from '@/components/tracking/PeriodTabs'
import { MacroGrid } from '@/components/tracking/MacroGrid'
import {
  PageHeader, Button, Card, CardHeader, CardTitle, CardContent,
  Modal, Input, Select, Badge, SkeletonDashboard, EmptyState, LoadingOverlay,
} from '@/components/ui'
import { DualLineChart, TrendBarChart } from '@/components/charts/TrendChart'
import { todayApiDate } from '@/utils/dates'
import { formatNumber, mealTypeLabel } from '@/utils/formatters'
import { getErrorMessage } from '@/utils/errors'
import { MEAL_TYPE_CONFIG, buildMacroChartData } from '@/utils/trackingAnalytics'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

export default function NutritionPage() {
  const toast = useToast()
  const { user } = useAuth()
  const [date, setDate] = useState(todayApiDate())
  const [period, setPeriod] = useState('day')
  const manualModal = useDisclosure()
  const scanModal = useDisclosure()
  const [scanning, setScanning] = useState(false)
  const [scanMealType, setScanMealType] = useState('breakfast')
  const targetCal = user?.profile?.targetCalories || 2000
  const targetProtein = user?.profile?.targetProteinG || 50

  const fetchData = useCallback(async () => {
    const [daily, week, month] = await Promise.all([
      nutritionService.getLogs(date).then((r) => r.data),
      nutritionService.getWeek().then((r) => r.data),
      nutritionService.getMonth().then((r) => r.data),
    ])
    return { daily, week, month }
  }, [date])

  const { data, isLoading, execute } = useAsync(fetchData, [fetchData])

  const manualForm = useForm({ defaultValues: { mealType: 'lunch', date } })

  const periodData = period === 'week' ? data?.week : period === 'month' ? data?.month : null
  const chartDays = period === 'month' ? 30 : 7
  const chartData = useMemo(
    () => buildMacroChartData(periodData?.groupedByDay || data?.week?.groupedByDay, chartDays),
    [periodData, data?.week, chartDays]
  )

  const displayTotals = period === 'day'
    ? data?.daily
    : periodData?.summary

  const macroItems = [
    { label: 'Calories', value: formatNumber(displayTotals?.totalCalories ?? displayTotals?.calories), unit: 'kcal', subtext: period === 'day' ? `Goal ${targetCal}` : `Avg ${displayTotals?.avgCalories || '—'}` },
    { label: 'Protein', value: formatNumber(displayTotals?.totalProtein ?? displayTotals?.proteinG, 1), unit: 'g', subtext: period === 'day' ? `Goal ${targetProtein}g` : `Avg ${displayTotals?.avgProtein || '—'}g` },
    { label: 'Fat', value: formatNumber(displayTotals?.totalFat ?? displayTotals?.fatG, 1), unit: 'g' },
    { label: 'Carbs', value: formatNumber(displayTotals?.totalCarbs ?? displayTotals?.carbsG, 1), unit: 'g' },
    { label: 'Fiber', value: formatNumber(displayTotals?.totalFiber ?? displayTotals?.fiberG, 1), unit: 'g' },
    { label: 'Sugar', value: formatNumber(displayTotals?.totalSugar ?? displayTotals?.sugarG, 1), unit: 'g' },
  ]

  const onManualSubmit = async (formData) => {
    try {
      await nutritionService.logMeal({
        date,
        mealType: formData.mealType,
        foodName: formData.foodName,
        calories: Number(formData.calories),
        proteinG: Number(formData.proteinG),
        fatG: Number(formData.fatG),
        carbsG: Number(formData.carbsG),
        fiberG: formData.fiberG ? Number(formData.fiberG) : undefined,
        sugarG: formData.sugarG ? Number(formData.sugarG) : undefined,
      })
      toast.success('Meal logged')
      manualModal.close()
      manualForm.reset({ mealType: 'lunch', date })
      execute()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const onScan = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      fd.append('mealType', scanMealType)
      await healthService.scanMeal(fd)
      toast.success('Meal scanned and logged')
      scanModal.close()
      execute()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setScanning(false)
    }
  }

  if (isLoading) return <SkeletonDashboard />

  return (
    <div>
      <PageHeader
        title="Nutrition"
        description="Track meals by type with full macro breakdown."
        action={
          <div className="flex flex-wrap gap-2">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
            <Button variant="secondary" onClick={() => healthService.downloadMealHistoryPdf().catch((e) => toast.error(getErrorMessage(e)))}>
              <Download className="h-4 w-4" /> PDF
            </Button>
            <Button variant="secondary" onClick={scanModal.open}><Camera className="h-4 w-4" /> Scan</Button>
            <Button onClick={manualModal.open}><Plus className="h-4 w-4" /> Log meal</Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PeriodTabs value={period} onChange={setPeriod} />
        {period !== 'day' && (
          <p className="text-sm text-surface-500">
            {periodData?.summary?.daysLogged || 0} days logged
          </p>
        )}
      </div>

      <div className="mb-8"><MacroGrid items={macroItems} /></div>

      {period === 'day' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {MEAL_TYPE_CONFIG.map(({ key, label, color }) => {
            const section = data?.daily?.byMealType?.[key]
            const meals = section?.meals || []
            return (
              <Card key={key}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                  </CardTitle>
                  <span className="text-xs text-surface-400 tabular-nums">
                    {formatNumber(section?.calories || 0)} kcal
                  </span>
                </CardHeader>
                <CardContent>
                  {meals.length === 0 ? (
                    <p className="text-sm text-surface-400 py-3">No {label.toLowerCase()} logged</p>
                  ) : (
                    <div className="space-y-2">
                      {meals.map((meal) => (
                        <div key={meal.id} className="flex justify-between py-2 border-b border-surface-50 last:border-0">
                          <div>
                            <p className="text-sm font-medium">{meal.foodName}</p>
                            <p className="text-xs text-surface-400">
                              P {formatNumber(meal.proteinG, 1)}g · C {formatNumber(meal.carbsG, 1)}g · F {formatNumber(meal.fatG, 1)}g
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold tabular-nums">{formatNumber(meal.calories)}</p>
                            {meal.source === 'ai_scan' && <Badge variant="brand" className="mt-0.5">AI</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader><CardTitle>Calories trend</CardTitle></CardHeader>
          <CardContent>
            <TrendBarChart data={chartData.map((d) => ({ ...d, calories: d.calories }))} dataKey="calories" color="#f59e0b" label="kcal" height={220} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Protein &amp; carbs</CardTitle></CardHeader>
          <CardContent>
            <DualLineChart
              data={chartData}
              height={220}
              lines={[
                { dataKey: 'protein', name: 'Protein (g)', color: '#ef4444' },
                { dataKey: 'carbs', name: 'Carbs (g)', color: '#8b5cf6' },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {period === 'day' && !data?.daily?.meals?.length && (
        <EmptyState icon={Utensils} title="No meals logged" description="Log breakfast, lunch, dinner, or snacks." action={<Button onClick={manualModal.open}>Log meal</Button>} />
      )}

      <Modal isOpen={manualModal.isOpen} onClose={manualModal.close} title="Log a meal">
        <form onSubmit={manualForm.handleSubmit(onManualSubmit)} className="space-y-4">
          <Select label="Meal type" {...manualForm.register('mealType')}>
            {MEAL_TYPES.map((t) => <option key={t} value={t}>{mealTypeLabel(t)}</option>)}
          </Select>
          <Input label="Food name" {...manualForm.register('foodName', { required: true })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Calories" type="number" {...manualForm.register('calories', { required: true })} />
            <Input label="Protein (g)" type="number" step="0.1" {...manualForm.register('proteinG', { required: true })} />
            <Input label="Fat (g)" type="number" step="0.1" {...manualForm.register('fatG', { required: true })} />
            <Input label="Carbs (g)" type="number" step="0.1" {...manualForm.register('carbsG', { required: true })} />
            <Input label="Fiber (g)" type="number" step="0.1" {...manualForm.register('fiberG')} />
            <Input label="Sugar (g)" type="number" step="0.1" {...manualForm.register('sugarG')} />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={manualModal.close}>Cancel</Button>
            <Button type="submit" className="flex-1" isLoading={manualForm.formState.isSubmitting}>Save</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={scanModal.isOpen} onClose={scanModal.close} title="AI meal scanner">
        <div className="space-y-4">
          {scanning && <LoadingOverlay message="Analyzing meal..." />}
          <Select label="Meal Type" value={scanMealType} onChange={(e) => setScanMealType(e.target.value)}>
            {MEAL_TYPES.map((type) => (
              <option key={type} value={type}>{mealTypeLabel(type)}</option>
            ))}
          </Select>
          <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-surface-200 rounded-2xl cursor-pointer hover:border-brand-300 transition-colors">
            <Camera className="h-10 w-10 text-surface-400" />
            <span className="text-sm text-surface-600">Upload meal photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={onScan} />
          </label>
        </div>
      </Modal>
    </div>
  )
}
