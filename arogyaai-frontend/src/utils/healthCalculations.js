const ACTIVITY_MULTIPLIERS = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
}

export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

export function getBMICategory(bmi) {
  if (bmi == null) return null
  if (bmi < 18.5) return { label: 'Underweight', variant: 'warning' }
  if (bmi < 25) return { label: 'Normal', variant: 'success' }
  if (bmi < 30) return { label: 'Overweight', variant: 'warning' }
  return { label: 'Obese', variant: 'danger' }
}

export function calculateBMR({ weightKg, heightCm, age, gender }) {
  if (!weightKg || !heightCm || !age) return null

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age

  if (gender === 'MALE') return Math.round(base + 5)
  if (gender === 'FEMALE') return Math.round(base - 161)
  return Math.round(base - 78)
}

export function calculateDailyCalories(profile) {
  const bmr = calculateBMR(profile)
  if (!bmr) return null

  const multiplier = ACTIVITY_MULTIPLIERS[profile.activityLevel] || ACTIVITY_MULTIPLIERS.MODERATELY_ACTIVE
  return Math.round(bmr * multiplier)
}

export function calculateProteinTarget(weightKg) {
  if (!weightKg || weightKg <= 0) return 50
  return Math.round(Math.max(weightKg * 1.2, 50))
}

export function calculateWaterTarget(weightKg) {
  if (!weightKg || weightKg <= 0) return 2000
  return Math.round(Math.max(weightKg * 35, 1500))
}

export function calculateSleepTarget(age) {
  if (!age) return 8
  if (age < 18) return 9
  if (age >= 65) return 7.5
  return 8
}

export function deriveHealthTargets(fields) {
  const weightKg = Number(fields.weightKg) || null
  const heightCm = Number(fields.heightCm) || null
  const age = Number(fields.age) || null
  const gender = fields.gender || null
  const activityLevel = fields.activityLevel || 'MODERATELY_ACTIVE'

  const bmi = calculateBMI(weightKg, heightCm)
  const bmr = calculateBMR({ weightKg, heightCm, age, gender })
  const targetCalories = calculateDailyCalories({ weightKg, heightCm, age, gender, activityLevel })
  const targetProteinG = calculateProteinTarget(weightKg)
  const targetWaterMl = calculateWaterTarget(weightKg)
  const targetSleepHrs = calculateSleepTarget(age)

  return {
    bmi,
    bmiCategory: getBMICategory(bmi),
    bmr,
    targetCalories,
    targetProteinG,
    targetWaterMl,
    targetSleepHrs,
  }
}
