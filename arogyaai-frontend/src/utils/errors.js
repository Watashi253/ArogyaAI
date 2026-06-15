export function getErrorMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback

  if (typeof error === 'string') return error

  const data = error.response?.data
  if (data?.error) return data.error
  if (data?.message) return data.message

  if (error.message) return error.message

  return fallback
}
