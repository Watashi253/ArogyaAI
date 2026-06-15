import { useCallback, useState } from 'react'
import { FileText, Upload, Trash2, TrendingUp, ChevronDown } from 'lucide-react'
import { recordsService } from '@/services'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/contexts/ToastContext'
import { useDisclosure } from '@/hooks/useMediaQuery'
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  SkeletonList,
  EmptyState,
  LoadingOverlay,
  Select,
  Input,
  Modal,
} from '@/components/ui'
import { TrendAreaChart } from '@/components/charts/TrendChart'
import { formatDisplayDate } from '@/utils/dates'
import { capitalize } from '@/utils/formatters'
import { getErrorMessage } from '@/utils/errors'

const RECORD_TYPES = [
  { value: 'blood_report', label: 'Blood report' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'scan', label: 'Scan' },
  { value: 'other', label: 'Other' },
]

export default function RecordsPage() {
  const toast = useToast()
  const [uploading, setUploading] = useState(false)
  const [selectedParam, setSelectedParam] = useState('')
  const [uploadMeta, setUploadMeta] = useState({ title: '', type: 'blood_report', notes: '' })
  const [selectedRecord, setSelectedRecord] = useState(null)
  const labValuesModal = useDisclosure()

  const fetchRecords = useCallback(async () => {
    const { data } = await recordsService.list()
    return data
  }, [])

  const { data: records, isLoading, execute } = useAsync(fetchRecords, [fetchRecords])

  const fetchTrend = useCallback(async () => {
    if (!selectedParam) return null
    const { data } = await recordsService.getLabTrend(selectedParam)
    return data
  }, [selectedParam])

  const { data: trendData, isLoading: trendLoading } = useAsync(fetchTrend, [fetchTrend], {
    immediate: !!selectedParam,
  })

  const allParams = [...new Set(
    (records || []).flatMap((r) => r.labValues?.map((l) => l.parameter) || [])
  )].sort()

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', uploadMeta.title || file.name)
      formData.append('type', uploadMeta.type)
      if (uploadMeta.notes) formData.append('notes', uploadMeta.notes)

      const { data } = await recordsService.upload(formData)
      toast.success(`Uploaded — ${data.labValues?.length || 0} lab values extracted`)
      execute()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeRecord = async (id) => {
    try {
      await recordsService.remove(id)
      toast.success('Record deleted')
      execute()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const chartData = (trendData || []).map((v) => ({
    label: formatDisplayDate(v.testDate).split(',')[0],
    value: v.value,
  }))

  return (
    <div>
      <PageHeader
        title="Health records"
        description="Upload reports and track lab values over time."
      />

      <Card className="mb-8 relative">
        {uploading && <LoadingOverlay message="Uploading and extracting values..." />}
        <CardHeader>
          <CardTitle>Upload document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Title"
              value={uploadMeta.title}
              onChange={(e) => setUploadMeta((m) => ({ ...m, title: e.target.value }))}
              placeholder="e.g. Annual blood work"
            />
            <Select
              label="Type"
              value={uploadMeta.type}
              onChange={(e) => setUploadMeta((m) => ({ ...m, type: e.target.value }))}
            >
              {RECORD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
            <Input
              label="Notes"
              value={uploadMeta.notes}
              onChange={(e) => setUploadMeta((m) => ({ ...m, notes: e.target.value }))}
            />
          </div>
          <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-surface-200 rounded-2xl cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-colors">
            <Upload className="h-5 w-5 text-surface-400" />
            <span className="text-sm text-surface-600">Choose file (PDF, image — max 10MB)</span>
            <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,image/*" />
          </label>
        </CardContent>
      </Card>

      {allParams.length > 0 && (
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-600" />
            <CardTitle>Lab trends</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              label="Parameter"
              value={selectedParam}
              onChange={(e) => setSelectedParam(e.target.value)}
              className="mb-4 max-w-xs"
            >
              <option value="">Select a parameter</option>
              {allParams.map((p) => (
                <option key={p} value={p}>{capitalize(p)}</option>
              ))}
            </Select>
            {selectedParam && (
              trendLoading ? (
                <div className="h-[280px] flex items-center justify-center text-surface-400 text-sm">
                  Loading trend...
                </div>
              ) : chartData.length > 0 ? (
                <TrendAreaChart data={chartData} dataKey="value" color="#0d9488" label={selectedParam} />
              ) : (
                <p className="text-sm text-surface-500 py-8 text-center">No trend data for this parameter.</p>
              )
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonList count={3} />
          ) : !records?.length ? (
            <EmptyState
              icon={FileText}
              title="No records yet"
              description="Upload a blood report or prescription to get started."
            />
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-start justify-between p-4 rounded-xl border border-surface-100"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-surface-900">{record.title}</p>
                      <Badge variant="brand">{capitalize(record.type)}</Badge>
                    </div>
                    <p className="text-xs text-surface-400">
                      {formatDisplayDate(record.uploadedAt)} · {record.labValues?.length || 0} lab values
                    </p>
                    {record.labValues?.length > 0 && (
                      <>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {record.labValues.slice(0, 5).map((lab) => (
                            <Badge
                              key={lab.id}
                              variant={lab.isAbnormal ? 'danger' : 'default'}
                            >
                              {lab.parameter}: {lab.value} {lab.unit}
                            </Badge>
                          ))}
                          {record.labValues.length > 5 && (
                            <Badge variant="outline">+{record.labValues.length - 5} more</Badge>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {record.labValues?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRecord(record)
                          labValuesModal.open()
                        }}
                        className="text-sm text-brand-600 hover:underline"
                      >
                        View all values
                      </button>
                    )}
                    {record.fileUrl && (
                      <a
                        href={record.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-600 hover:underline"
                      >
                        View
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => removeRecord(record.id)}
                      className="p-1.5 text-surface-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={labValuesModal.isOpen} onClose={labValuesModal.close} title={`Lab values from ${selectedRecord?.title || 'record'}`}>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {selectedRecord?.labValues?.length > 0 ? (
            selectedRecord.labValues.map((lab) => (
              <div
                key={lab.id}
                className="flex items-start justify-between p-3 rounded-lg bg-surface-50 border border-surface-100"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm text-surface-900">{capitalize(lab.parameter)}</p>
                  <p className="text-xs text-surface-500">{lab.referenceRange ? `Reference: ${lab.referenceRange}` : 'No reference range'}</p>
                </div>
                <div className="text-right ml-3">
                  <div className="font-semibold text-surface-900">{lab.value}</div>
                  <div className="text-xs text-surface-500">{lab.unit}</div>
                  {lab.isAbnormal && (
                    <Badge variant="danger" className="mt-1 text-xs">Abnormal</Badge>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-surface-500 text-center py-4">No lab values extracted</p>
          )}
        </div>
      </Modal>
    </div>
  )
}
