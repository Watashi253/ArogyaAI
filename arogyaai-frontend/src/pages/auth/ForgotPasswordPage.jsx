import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { authService } from '@/services'
import { Button, Input } from '@/components/ui'
import { getErrorMessage } from '@/utils/errors'

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [devResetUrl, setDevResetUrl] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm()

  const onSubmit = async ({ email }) => {
    try {
      const { data } = await authService.forgotPassword(email)
      setSubmitted(true)
      if (data.resetUrl) {
        setDevResetUrl(data.resetUrl)
      }
    } catch (err) {
      setError('root', { message: getErrorMessage(err) })
    }
  }

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="font-display text-3xl text-surface-900 mb-2">Check your email</h2>
        <p className="text-surface-500 mb-6">
          If an account exists for that address, we&apos;ve sent password reset instructions.
        </p>
        {devResetUrl && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm">
            <p className="font-medium text-amber-800 mb-1">Development mode</p>
            <p className="text-amber-700 mb-2">No email service configured. Use this link:</p>
            <Link to={devResetUrl.replace(/^https?:\/\/[^/]+/, '')} className="text-brand-600 break-all hover:underline">
              Reset your password
            </Link>
          </div>
        )}
        <Link to="/login">
          <Button variant="secondary" className="w-full">Back to sign in</Button>
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="font-display text-3xl text-surface-900 mb-2">Forgot password?</h2>
      <p className="text-surface-500 mb-8">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />

        {errors.root && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-500">
        Remember your password?{' '}
        <Link to="/login" className="text-brand-600 font-medium hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
