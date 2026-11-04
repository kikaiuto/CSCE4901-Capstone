import { useCallback, useState } from 'react'
import { useMutation } from '@/core/app/data'
import { signInWithPassword, type Credentials, type Session } from '@/core/app/session'
import { ApiError } from '@/core/lib/api'

export interface SignInProblem {
  form?: string
  email?: string
}

export interface SignInErrors extends SignInProblem {
  password?: string
}

const MISMATCH = "That email and password don't match this workspace."
const UNREACHABLE = "Can't reach the server. Check your connection and try again."
const UNKNOWN = 'Something went wrong. Try again.'

function mentionsEmail(details: Record<string, unknown>): boolean {
  const detail = details.detail
  if (!Array.isArray(detail)) return false
  return detail.some((item) => {
    const loc = (item as { loc?: unknown }).loc
    return Array.isArray(loc) && loc.includes('email')
  })
}

export function describeFailure(error: unknown): SignInProblem {
  if (!(error instanceof ApiError)) return { form: UNKNOWN }
  if (error.code === 'network') return { form: UNREACHABLE }
  if (error.status === 401) return { form: MISMATCH }
  if (error.status === 422) {
    return mentionsEmail(error.details)
      ? { email: 'Enter a valid email address' }
      : { form: error.message }
  }
  return { form: error.message }
}

export function useSignIn(organizationId: string | null) {
  const [email, setEmailState] = useState('')
  const [password, setPasswordState] = useState('')
  const [errors, setErrors] = useState<SignInErrors>({})
  const mutation = useMutation<Credentials, Session>(signInWithPassword)

  const setEmail = useCallback((value: string) => {
    setEmailState(value)
    setErrors((current) => (current.email ? { ...current, email: undefined } : current))
  }, [])

  const setPassword = useCallback((value: string) => {
    setPasswordState(value)
    setErrors((current) => (current.password ? { ...current, password: undefined } : current))
  }, [])

  const submit = useCallback(async (): Promise<boolean> => {
    if (mutation.pending || organizationId === null) return false

    const trimmedEmail = email.trim()
    const missing: SignInErrors = {}
    if (!trimmedEmail) missing.email = 'Enter your email'
    if (!password) missing.password = 'Enter your password'
    setErrors(missing)
    if (missing.email || missing.password) return false

    try {
      await mutation.run({ organizationId, email: trimmedEmail, password })
      return true
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return false
      setErrors(describeFailure(cause))
      return false
    }
  }, [email, password, organizationId, mutation])

  return {
    email,
    setEmail,
    password,
    setPassword,
    errors,
    submitting: mutation.pending,
    submit,
  }
}
