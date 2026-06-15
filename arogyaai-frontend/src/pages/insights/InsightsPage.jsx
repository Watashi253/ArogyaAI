import { useCallback } from 'react'
import { Download, Sparkles, Stethoscope } from 'lucide-react'
import { healthService } from '@/services'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/contexts/ToastContext'
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  SkeletonDashboard,
  StatCard,
} from '@/components/ui'
import { formatDisplayDate } from '@/utils/dates'
import { formatMl, formatNumber } from '@/utils/formatters'
import { getErrorMessage } from '@/utils/errors'

export default function InsightsPage() {
  const toast = useToast()

  const fetchData = useCallback(async () => {
    const [insights, doctorSummary] = await Promise.all([
      healthService.getInsights().then((r) => r.data.data),
      healthService.getDoctorSummary().then((r) => r.data.data).catch(() => null),
    ])
    return { insights, doctorSummary }
  }, [])

  const { data, isLoading } = useAsync(fetchData, [fetchData])

  const download = async (fn, label) => {
    try {
      await fn()
      toast.success(`${label} downloaded`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (isLoading) return <SkeletonDashboard />

  const stats = data?.insights?.stats

  return (
    <div>
      <PageHeader
        title="AI Insights"
        description="Personalized health analysis powered by your data."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => download(healthService.downloadWeeklyReportPdf, 'Weekly report')}
            >
              <Download className="h-4 w-4" />
              Weekly PDF
            </Button>
            <Button
              variant="secondary"
              onClick={() => download(healthService.downloadDoctorSummaryPdf, 'Doctor summary')}
            >
              <Download className="h-4 w-4" />
              Doctor's PDF
            </Button>
            <Button
              onClick={() => download(healthService.downloadComprehensiveReportPdf, 'Comprehensive report')}
            >
              <Download className="h-4 w-4" />
              Full report
            </Button>
          </div>
        }
      />

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Avg sleep" value={`${stats.avgSleep}h`} subtext={`Target: ${stats.targetSleepHrs}h`} />
          <StatCard label="Avg calories" value={formatNumber(stats.avgCalories)} subtext={`Target: ${stats.targetCalories}`} />
          <StatCard label="Weekly water" value={formatMl(stats.totalWater)} subtext={`Daily target: ${formatMl(stats.targetWaterMl)}`} />
          <StatCard label="Activity" value={`${stats.totalActivity} min`} subtext={`${stats.activitySessions} sessions`} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <CardTitle>Weekly insights</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.insights?.insights?.length ? (
              <ul className="space-y-3">
                {data.insights.insights.map((insight, i) => (
                  <li key={i} className="text-sm text-surface-700 leading-relaxed pl-4 border-l-2 border-brand-200">
                    {insight}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-surface-500">Log more health data to generate insights.</p>
            )}
            {data?.insights?.generatedAt && (
              <p className="text-xs text-surface-400 mt-4">
                Generated {formatDisplayDate(data.insights.generatedAt)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Stethoscope className="h-5 w-5 text-brand-600" />
            <CardTitle>Summary for Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.doctorSummary ? (
              <div className="space-y-4">
                <p className="text-sm text-surface-700 leading-relaxed">
                  {data.doctorSummary.summary}
                </p>
                {data.doctorSummary.keyFindings?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2">
                      Key findings
                    </h4>
                    <ul className="space-y-1">
                      {data.doctorSummary.keyFindings.map((f, i) => (
                        <li key={i} className="text-sm text-surface-600">• {f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.doctorSummary.recommendations?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2">
                      Recommendations
                    </h4>
                    <ul className="space-y-1">
                      {data.doctorSummary.recommendations.map((r, i) => (
                        <li key={i} className="text-sm text-surface-600">• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-surface-500">
                Doctor summary requires more logged health data.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
