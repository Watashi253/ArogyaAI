import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useAuth } from '@/hooks/useAuth'
import { userService } from '@/services'
import { useToast } from '@/contexts/ToastContext'
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
} from '@/components/ui'
import { deriveHealthTargets } from '@/utils/healthCalculations'
import { getErrorMessage } from '@/utils/errors'

const ACTIVITY_LEVELS = [
  { value: 'SEDENTARY', label: 'Sedentary' },
  { value: 'LIGHTLY_ACTIVE', label: 'Lightly active' },
  { value: 'MODERATELY_ACTIVE', label: 'Moderately active' },
  { value: 'VERY_ACTIVE', label: 'Very active' },
]

const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
]

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  const profile = user?.profile

  const { register, handleSubmit, control, setValue, formState: { isSubmitting } } = useForm({
    values: {
      heightCm: profile?.heightCm || '',
      weightKg: profile?.weightKg || '',
      age: profile?.age || '',
      gender: profile?.gender || '',
      activityLevel: profile?.activityLevel || 'MODERATELY_ACTIVE',
      targetCalories: profile?.targetCalories || 2000,
      targetProteinG: profile?.targetProteinG || 50,
      targetSleepHrs: profile?.targetSleepHrs || 8,
      targetWaterMl: profile?.targetWaterMl || 2000,
      conditions: profile?.conditions?.join(', ') || '',
      allergies: profile?.allergies?.join(', ') || '',
    },
  })

  const watched = useWatch({ control })

  const calculated = useMemo(
    () => deriveHealthTargets(watched),
    [watched.heightCm, watched.weightKg, watched.age, watched.gender, watched.activityLevel]
  )

  const applyRecommended = () => {
    if (calculated.targetCalories) setValue('targetCalories', calculated.targetCalories)
    if (calculated.targetProteinG) setValue('targetProteinG', calculated.targetProteinG)
    if (calculated.targetWaterMl) setValue('targetWaterMl', calculated.targetWaterMl)
    if (calculated.targetSleepHrs) setValue('targetSleepHrs', calculated.targetSleepHrs)
    toast.success('Recommended targets applied')
  }

  const onSubmit = async (data) => {
    try {
      await userService.updateProfile({
        heightCm: Number(data.heightCm) || undefined,
        weightKg: Number(data.weightKg) || undefined,
        age: Number(data.age) || undefined,
        gender: data.gender || undefined,
        activityLevel: data.activityLevel,
        targetCalories: Number(data.targetCalories),
        targetProteinG: Number(data.targetProteinG),
        targetSleepHrs: Number(data.targetSleepHrs),
        targetWaterMl: Number(data.targetWaterMl),
        conditions: data.conditions
          ? data.conditions.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        allergies: data.allergies
          ? data.allergies.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      })
      await refreshUser()
      toast.success('Profile updated')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Manage your health profile and personalized daily targets."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-surface-400">Name</p>
                <p className="text-sm font-medium">{user?.name}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400">Email</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400">Member since</p>
                <p className="text-sm font-medium">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              </div>
            </CardContent>
          </Card>

          {calculated.bmi != null && (
            <Card>
              <CardHeader>
                <CardTitle>Body metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-surface-400 mb-1">BMI</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-semibold tabular-nums">{calculated.bmi}</p>
                    {calculated.bmiCategory && (
                      <Badge variant={calculated.bmiCategory.variant}>
                        {calculated.bmiCategory.label}
                      </Badge>
                    )}
                  </div>
                </div>
                {calculated.bmr != null && (
                  <div>
                    <p className="text-xs text-surface-400">Basal metabolic rate</p>
                    <p className="text-lg font-semibold tabular-nums">{calculated.bmr} kcal/day</p>
                  </div>
                )}
                {calculated.targetCalories != null && (
                  <div className="pt-3 border-t border-surface-100">
                    <p className="text-xs text-surface-400 mb-2">Recommended daily targets</p>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-surface-400">Calories</dt>
                        <dd className="font-medium tabular-nums">{calculated.targetCalories}</dd>
                      </div>
                      <div>
                        <dt className="text-surface-400">Protein</dt>
                        <dd className="font-medium tabular-nums">{calculated.targetProteinG}g</dd>
                      </div>
                      <div>
                        <dt className="text-surface-400">Water</dt>
                        <dd className="font-medium tabular-nums">{calculated.targetWaterMl}ml</dd>
                      </div>
                      <div>
                        <dt className="text-surface-400">Sleep</dt>
                        <dd className="font-medium tabular-nums">{calculated.targetSleepHrs}h</dd>
                      </div>
                    </dl>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full mt-3"
                      onClick={applyRecommended}
                    >
                      Apply recommended targets
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Health profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-surface-700 mb-3">Physical info</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Height (cm)" type="number" step="0.1" {...register('heightCm')} />
                  <Input label="Weight (kg)" type="number" step="0.1" {...register('weightKg')} />
                  <Input label="Age" type="number" {...register('age')} />
                  <Select label="Gender" {...register('gender')}>
                    <option value="">Select</option>
                    {GENDERS.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </Select>
                  <Select label="Activity level" className="sm:col-span-2" {...register('activityLevel')}>
                    {ACTIVITY_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-surface-700 mb-3">Health context</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Existing conditions"
                    hint="Comma-separated, e.g. diabetes, hypertension"
                    {...register('conditions')}
                  />
                  <Input
                    label="Allergies"
                    hint="Comma-separated"
                    {...register('allergies')}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-surface-700 mb-3">Daily targets</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Target calories" type="number" {...register('targetCalories')} />
                  <Input label="Target protein (g)" type="number" {...register('targetProteinG')} />
                  <Input label="Target water (ml)" type="number" {...register('targetWaterMl')} />
                  <Input label="Target sleep (hours)" type="number" step="0.5" {...register('targetSleepHrs')} />
                </div>
              </div>

              <Button type="submit" isLoading={isSubmitting}>Save changes</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
