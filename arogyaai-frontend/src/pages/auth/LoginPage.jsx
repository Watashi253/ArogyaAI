import { useForm } from 'react-hook-form'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button, Input } from '@/components/ui'
import { getErrorMessage } from '@/utils/errors'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = location.state?.message
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm()

  useEffect(() => {
    if (successMessage) {
      window.history.replaceState({}, document.title)
    }
  }, [successMessage])

  const onSubmit = async (data) => {
    try {
      const user = await login(data)
      navigate(user?.profile ? '/' : '/onboarding', { replace: true })
    } catch (err) {
      setError('root', { message: getErrorMessage(err) })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="font-display text-3xl text-surface-900 mb-2">Welcome back</h2>
      <p className="text-surface-500 mb-8">Sign in to continue your health journey.</p>

      {successMessage && (
        <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg mb-4">
          {successMessage}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />
        <div>
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required' })}
          />
          <div className="mt-1.5 text-right">
            <Link
              to="/forgot-password"
              className="text-xs text-brand-600 font-medium hover:text-brand-700"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {errors.root && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-500">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="text-brand-600 font-medium hover:text-brand-700">
          Create one
        </Link>
      </p>
    </motion.div>
  )
}
