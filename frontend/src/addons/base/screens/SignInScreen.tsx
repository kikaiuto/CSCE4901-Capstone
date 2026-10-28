import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Button } from '@/core/components/ui/Button'
import { Field } from '@/core/components/ui/Field'
import { Select } from '@/core/components/ui/Select'
import { operationLabels } from '@/core/app/registry'
import { signInWithPassword } from '@/core/app/session'
import { ApiError } from '@/core/lib/api'
import { demoWorkspaces } from '../fixtures/org'

interface FieldErrors {
  email?: string
  password?: string
}

interface Problem {
  form?: string
  email?: string
}

function describeFailure(error: unknown): Problem {
  if (!(error instanceof ApiError)) return { form: 'Something went wrong. Try again.' }
  if (error.status === 401) return { form: "That email and password don't match this workspace." }
  if (error.status === 422) return { email: 'Enter a valid email address' }
  if (error.code === 'network') {
    return { form: "Can't reach the server. Check your connection and try again." }
  }
  return { form: error.message }
}

const workspaceOptions = demoWorkspaces.map((workspace) => ({
  value: workspace.id,
  label: workspace.name,
}))

export function SignInScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/home'

  const [workspace, setWorkspace] = useState(workspaceOptions[0]?.value ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const trimmedEmail = email.trim()
    const missing: FieldErrors = {}
    if (!trimmedEmail) missing.email = 'Enter your email'
    if (!password) missing.password = 'Enter your password'

    setFormError(null)
    setFieldErrors(missing)
    if (missing.email || missing.password) return

    setSubmitting(true)
    try {
      await signInWithPassword({ organizationId: workspace, email: trimmedEmail, password })
      navigate(from, { replace: true })
    } catch (error) {
      const problem = describeFailure(error)
      if (problem.email) setFieldErrors({ email: problem.email })
      if (problem.form) setFormError(problem.form)
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-canvas">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: 'radial-gradient(var(--color-line-strong) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative">
        <div className="px-gutter py-8">
          <span className="display text-lg">Sector 7</span>
        </div>

        <div className="flex justify-center px-gutter pt-16">
          <div className="rise w-full max-w-[26rem] rounded-card border border-line bg-surface p-9">
            <h1 className="display text-3xl">Sign in</h1>
            <p className="mt-2 text-md text-ink-muted">Use your work email.</p>

            <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-4">
              <Select
                label="Workspace"
                name="workspace"
                value={workspace}
                onChange={(event) => setWorkspace(event.target.value)}
                options={workspaceOptions}
              />
              <Field
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                error={fieldErrors.email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined })
                }}
              />
              <Field
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                error={fieldErrors.password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined })
                }}
                labelEnd={
                  <button
                    type="button"
                    aria-disabled="true"
                    title="Not wired up yet"
                    className="text-xs text-ink-muted"
                  >
                    Forgot password?
                  </button>
                }
                trailing={
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((current) => !current)}
                    className="rounded-control px-1.5 py-0.5 text-xs font-medium text-ink-muted hover:text-ink"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                }
              />

              {formError && (
                <p
                  role="alert"
                  className="rounded-control bg-negative-soft px-3 py-2 text-sm text-negative"
                >
                  {formError}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                shortcut="↵"
                loading={submitting}
                className="mt-2 h-10 w-full"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-5 flex justify-end text-base">
              <button
                type="button"
                aria-disabled="true"
                title="Not wired up yet"
                className="text-accent"
              >
                Create an organization
              </button>
            </div>

            <p className="mt-7 border-t border-line pt-5 text-center text-base text-ink-faint">
              {operationLabels.join(' · ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
