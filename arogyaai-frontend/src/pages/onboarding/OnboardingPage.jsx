import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { userService } from '@/services'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/contexts/ToastContext'
import { Button, Input, Select, Badge, Card, CardContent } from '@/components/ui'
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

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const toast = useToast()
  const { register, handleSubmit, control, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      targetCalories: 2000,
      targetProteinG: 50,
      targetSleepHrs: 8,
      targetWaterMl: 2000,
      activityLevel: 'MODERATELY_ACTIVE',
    },
  })

  const watched = useWatch({ control })
  const calculated = useMemo(
    () => deriveHealthTargets(watched),
    [watched.heightCm, watched.weightKg, watched.age, watched.gender, watched.activityLevel]
  )

  const applyRecommended = () => {
    if (!calculated.targetCalories) {
      toast.error('Enter height, weight, age, and gender to calculate targets')
      return
    }
    setValue('targetCalories', calculated.targetCalories)
    setValue('targetProteinG', calculated.targetProteinG)
    setValue('targetWaterMl', calculated.targetWaterMl)
    setValue('targetSleepHrs', calculated.targetSleepHrs)
    toast.success('Targets calculated from your profile')
  }

  const onSubmit = async (data) => {
    try {
      const payload = {
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
      }

      await userService.updateProfile(payload)
      await refreshUser()
      toast.success('Profile set up successfully')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl text-surface-900 mb-2">
            Let&apos;s personalize your experience
          </h1>
          <p className="text-surface-500 mb-8">
            Tell us about yourself — we&apos;ll calculate your BMI and daily targets.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white rounded-2xl border border-surface-100 p-6 shadow-card space-y-4">
              <h3 className="font-semibold text-surface-900">Physical info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Height (cm)" type="number" step="0.1" {...register('heightCm', { required: true })} />
                <Input label="Weight (kg)" type="number" step="0.1" {...register('weightKg', { required: true })} />
                <Input label="Age" type="number" {...register('age', { required: true })} />
                <Select label="Gender" {...register('gender', { required: true })}>
                  <option value="">Select gender</option>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </Select>
              </div>
              <Select label="Activity level" {...register('activityLevel')}>
                {ACTIVITY_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </Select>

              {calculated.bmi != null && (
                <Card className="bg-surface-50 border-surface-100 shadow-none">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-surface-400">Your BMI</p>
                        <p className="text-2xl font-semibold tabular-nums">{calculated.bmi}</p>
                      </div>
                      {calculated.bmiCategory && (
                        <Badge variant={calculated.bmiCategory.variant}>
                          {calculated.bmiCategory.label}
                        </Badge>
                      )}
                    </div>
                    {calculated.bmr != null && (
                      <p className="text-xs text-surface-500 mt-2">
                        Estimated BMR: {calculated.bmr} kcal/day
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-surface-100 p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-surface-900">Daily targets</h3>
                <Button type="button" variant="secondary" size="sm" onClick={applyRecommended}>
                  Auto-calculate
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Target calories" type="number" {...register('targetCalories')} />
                <Input label="Target protein (g)" type="number" {...register('targetProteinG')} />
                <Input label="Target sleep (hours)" type="number" step="0.5" {...register('targetSleepHrs')} />
                <Input label="Target water (ml)" type="number" {...register('targetWaterMl')} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-surface-100 p-6 shadow-card space-y-4">
              <h3 className="font-semibold text-surface-900">Health context</h3>
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

            <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
              Complete setup
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
