import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Droplets,
  Utensils,
  Moon,
  Activity,
  Pill,
  RefreshCw,
  Flame,
  Beef,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import {
  waterService,
  nutritionService,
  sleepService,
  activityService,
  medicineService,
  healthService,
} from '@/services'
import { SkeletonDashboard, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import {
  TrendAreaChart,
  TrendBarChart,
  DualLineChart,
  WeeklyRhythmChart,
} from '@/components/charts/TrendChart'
import { HealthScoreHero, ObservationsPanel } from '@/components/dashboard/HealthScoreHero'
import { MetricRingCard } from '@/components/dashboard/MetricRingCard'
import { MedicineAdherenceCard } from '@/components/dashboard/MedicineAdherenceCard'
import { todayApiDate } from '@/utils/dates'
import { formatMl, formatNumber, formatHours } from '@/utils/formatters'
import {
  computeHealthScore,
  metricPercent,
  caloriesScore,
  buildWeeklyRhythm,
  buildMacroChartData,
  buildWaterTrend,
  buildSleepTrend,
  buildActivityTrend,
  getTargetsFromProfile,
} from '@/utils/dashboardAnalytics'

const METRIC_COLORS = {
  calories: '#f59e0b',
  protein: '#ef4444',
  water: '#0ea5e9',
  sleep: '#6366f1',
  activity: '#f43f5e',
  medicine: '#8b5cf6',
}

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const today = todayApiDate()
  const targets = getTargetsFromProfile(user?.profile)

  const fetchDashboard = useCallback(async () => {
    const [
      water, waterWeek, nutrition, nutritionWeek, sleep, sleepWeek,
      activity, activityWeek, medicines, medicineHistory, insightsRes,
    ] = await Promise.all([
      waterService.getDaily().then((r) => r.data),
      waterService.getWeek().then((r) => r.data),
      nutritionService.getLogs(today).then((r) => r.data),
      nutritionService.getWeek().then((r) => r.data),
      sleepService.getLogs(today).then((r) => r.data),
      sleepService.getWeek().then((r) => r.data),
      activityService.getLogs(today).then((r) => r.data),
      activityService.getWeek().then((r) => r.data),
      medicineService.today().then((r) => r.data),
      medicineService.history(7).then((r) => r.data),
      healthService.getInsights().then((r) => r.data.data).catch(() => null),
    ])

    return {
      water, waterWeek, nutrition, nutritionWeek, sleep, sleepWeek,
      activity, activityWeek, medicines, medicineHistory, insights: insightsRes,
    }
  }, [today])

  const { data, isLoading, execute } = useAsync(fetchDashboard, [fetchDashboard])

  const analytics = useMemo(() => {
    if (!data) return null

    const todaySleepHrs = data.sleep?.logs?.[0]?.hours || 0
    const todayActivityMins = data.activity?.summary?.totalDurationMins || 0
    const medicineAdherence = data.medicines?.schedule?.length
      ? data.medicines.adherenceRate
      : null

    const healthScore = computeHealthScore(
      {
        calories: data.nutrition?.totalCalories || 0,
        protein: data.nutrition?.totalProtein || 0,
        waterMl: data.water?.summary?.totalMl || 0,
        sleepHrs: todaySleepHrs,
        activityMins: todayActivityMins,
        medicineAdherence,
      },
      targets
    )

    return {
      healthScore,
      weeklyRhythm: buildWeeklyRhythm({
        waterWeek: data.waterWeek,
        sleepWeek: data.sleepWeek,
        activityWeek: data.activityWeek,
        meals: data.nutritionWeek?.meals || [],
        targets,
      }),
      nutritionTrend: buildMacroChartData(data.nutritionWeek?.groupedByDay, 7),
      waterTrend: buildWaterTrend(data.waterWeek),
      sleepTrend: buildSleepTrend(data.sleepWeek),
      activityTrend: buildActivityTrend(data.activityWeek),
      metrics: {
        calories: {
          percent: caloriesScore(data.nutrition?.totalCalories || 0, targets.targetCalories),
          display: formatNumber(data.nutrition?.totalCalories),
        },
        protein: {
          percent: metricPercent(data.nutrition?.totalProtein || 0, targets.targetProteinG),
          display: `${formatNumber(data.nutrition?.totalProtein, 1)}g`,
        },
        fat: {
          percent: 0,
          display: `${formatNumber(data.nutrition?.totalFat, 1)}g`,
        },
        carbs: {
          percent: 0,
          display: `${formatNumber(data.nutrition?.totalCarbs, 1)}g`,
        },
        water: {
          percent: metricPercent(data.water?.summary?.totalMl || 0, targets.targetWaterMl),
          display: formatMl(data.water?.summary?.totalMl),
        },
        sleep: {
          percent: todaySleepHrs
            ? metricPercent(todaySleepHrs, targets.targetSleepHrs)
            : metricPercent(Number(data.sleepWeek?.summary?.averageHours) || 0, targets.targetSleepHrs),
          display: todaySleepHrs
            ? formatHours(todaySleepHrs)
            : data.sleepWeek?.summary?.averageHours
              ? `${data.sleepWeek.summary.averageHours}h avg`
              : '—',
        },
        activity: {
          percent: metricPercent(todayActivityMins, targets.activityTargetMins),
          display: todayActivityMins ? `${todayActivityMins} min` : '—',
        },
        medicine: {
          percent: medicineAdherence ?? 0,
          display: data.medicines?.schedule?.length
            ? `${data.medicines.schedule.filter((m) => m.takenToday).length}/${data.medicines.schedule.length}`
            : '—',
        },
      },
    }
  }, [data, targets])

  if (isLoading) return <SkeletonDashboard />

  const firstName = user?.name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="pb-4">
      <HealthScoreHero
        score={analytics?.healthScore}
        greeting={greeting}
        name={firstName}
      />

      {/* Today's metrics */}
      <motion.section {...fadeIn} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wider">
            Today&apos;s metrics
          </h2>
          <button
            type="button"
            onClick={() => execute()}
            className="text-xs text-surface-400 hover:text-brand-600 inline-flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricRingCard
            label="Calories"
            percent={analytics?.metrics.calories.percent}
            display={analytics?.metrics.calories.display}
            color={METRIC_COLORS.calories}
            icon={Flame}
            to="/nutrition"
          />
          <MetricRingCard
            label="Protein"
            percent={analytics?.metrics.protein.percent}
            display={analytics?.metrics.protein.display}
            color={METRIC_COLORS.protein}
            icon={Beef}
            to="/nutrition"
          />
          <MetricRingCard
            label="Water"
            percent={analytics?.metrics.water.percent}
            display={analytics?.metrics.water.display}
            color={METRIC_COLORS.water}
            icon={Droplets}
            to="/water"
          />
          <MetricRingCard
            label="Sleep"
            percent={analytics?.metrics.sleep.percent}
            display={analytics?.metrics.sleep.display}
            color={METRIC_COLORS.sleep}
            icon={Moon}
            to="/sleep"
          />
          <MetricRingCard
            label="Activity"
            percent={analytics?.metrics.activity.percent}
            display={analytics?.metrics.activity.display}
            color={METRIC_COLORS.activity}
            icon={Activity}
            to="/activity"
          />
          <MetricRingCard
            label="Medicines"
            percent={analytics?.metrics.medicine.percent}
            display={analytics?.metrics.medicine.display}
            color={METRIC_COLORS.medicine}
            icon={Pill}
            to="/medicines"
          />
        </div>
      </motion.section>

      {/* Weekly cycle + nutrition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-brand-600" />
                <CardTitle>Weekly cycle</CardTitle>
              </div>
              <p className="text-xs text-surface-400 mt-1">
                Daily health score across your 7-day rhythm
              </p>
            </CardHeader>
            <CardContent>
              <WeeklyRhythmChart data={analytics?.weeklyRhythm || []} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-amber-500" />
                <CardTitle>Nutrition trends</CardTitle>
              </div>
              <p className="text-xs text-surface-400 mt-1">
                Calories &amp; protein — last 7 days
              </p>
            </CardHeader>
            <CardContent>
              <DualLineChart
                data={analytics?.nutritionTrend || []}
                lines={[
                  { dataKey: 'calories', name: 'Calories', color: '#f59e0b' },
                  { dataKey: 'protein', name: 'Protein (g)', color: '#ef4444' },
                ]}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly analytics charts */}
      <motion.section {...fadeIn} transition={{ delay: 0.15 }} className="mb-8">
        <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wider mb-4">
          Weekly analytics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Droplets className="h-4 w-4 text-sky-500" /> Hydration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrendBarChart
                data={analytics?.waterTrend || []}
                dataKey="total"
                color="#0ea5e9"
                label="ml"
                height={200}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Moon className="h-4 w-4 text-indigo-500" /> Sleep
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrendAreaChart
                data={analytics?.sleepTrend || []}
                dataKey="hours"
                color="#6366f1"
                label="hours"
                height={200}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-rose-500" /> Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrendBarChart
                data={analytics?.activityTrend || []}
                dataKey="minutes"
                color="#f43f5e"
                label="min"
                height={200}
              />
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* Medicine + AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
          <MedicineAdherenceCard
            schedule={data?.medicines?.schedule}
            adherenceRate={data?.medicines?.adherenceRate || 0}
          />
        </motion.div>
        <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
          <ObservationsPanel insights={data?.insights?.insights} />
        </motion.div>
      </div>

      {/* Quick log */}
      <motion.section {...fadeIn} transition={{ delay: 0.3 }}>
        <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wider mb-3">
          Quick log
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/water', label: 'Water', icon: Droplets, bg: 'bg-sky-50', text: 'text-sky-600' },
            { to: '/nutrition', label: 'Meal', icon: Utensils, bg: 'bg-amber-50', text: 'text-amber-600' },
            { to: '/sleep', label: 'Sleep', icon: Moon, bg: 'bg-indigo-50', text: 'text-indigo-600' },
            { to: '/activity', label: 'Workout', icon: Activity, bg: 'bg-rose-50', text: 'text-rose-600' },
          ].map(({ to, label, icon: Icon, bg, text }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-surface-100 shadow-card hover:shadow-elevated transition-shadow"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${text}`} />
              </div>
              <span className="text-sm font-medium text-surface-700">{label}</span>
            </Link>
          ))}
        </div>
      </motion.section>
    </div>
  )
}
