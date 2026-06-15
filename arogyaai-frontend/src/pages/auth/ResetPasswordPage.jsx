import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authService } from '@/services'
import { Button, Input } from '@/components/ui'
import { getErrorMessage } from '@/utils/errors'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm()

  const onSubmit = async ({ password }) => {
    if (!token) {
      setError('root', { message: 'Invalid or missing reset link' })
      return
    }

    try {
      await authService.resetPassword(token, password)
      navigate('/login', {
        replace: true,
        state: { message: 'Password reset successful. Please sign in.' },
      })
    } catch (err) {
      setError('root', { message: getErrorMessage(err) })
    }
  }

  if (!token) {
    return (
      <div>
        <h2 className="font-display text-3xl text-surface-900 mb-2">Invalid link</h2>
        <p className="text-surface-500 mb-6">
          This password reset link is invalid or has expired.
        </p>
        <Link to="/forgot-password">
          <Button className="w-full">Request a new link</Button>
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="font-display text-3xl text-surface-900 mb-2">Set new password</h2>
      <p className="text-surface-500 mb-8">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 6 characters"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' },
          })}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value, formValues) =>
              value === formValues.password || 'Passwords do not match',
          })}
        />

        {errors.root && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Reset password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-500">
        <Link to="/login" className="text-brand-600 font-medium hover:text-brand-700">
          Back to sign in
        </Link>
      </p>
    </motion.div>
  )
}
