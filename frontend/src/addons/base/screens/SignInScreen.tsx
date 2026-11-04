import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { operationLabels } from '@/core/app/registry'
import type { SessionOrganization } from '@/core/app/session'
import { Avatar } from '@/core/components/ui/Avatar'
import { Button } from '@/core/components/ui/Button'
import { Field } from '@/core/components/ui/Field'
import { Icon } from '@/core/components/ui/Icon'
import { demoWorkspaces } from '../fixtures/org'
import { useSignIn } from '../hooks/useSignIn'

export const WORKSPACE_STORAGE_KEY = 'sector7.workspace'

function rememberedWorkspace(): SessionOrganization | null {
  try {
    const id = localStorage.getItem(WORKSPACE_STORAGE_KEY)
    return demoWorkspaces.find((workspace) => workspace.id === id) ?? null
  } catch {
    return null
  }
}

function remember(workspace: SessionOrganization | null) {
  try {
    if (workspace) localStorage.setItem(WORKSPACE_STORAGE_KEY, workspace.id)
    else localStorage.removeItem(WORKSPACE_STORAGE_KEY)
  } catch {
    return
  }
}

function safeReturnPath(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from
  if (typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')) return from
  return '/home'
}

function InertLink({ children, className }: { children: string; className?: string }) {
  return (
    <button type="button" aria-disabled="true" title="Not wired up yet" className={className}>
      {children}
    </button>
  )
}

function WorkspaceStep({ onChoose }: { onChoose: (workspace: SessionOrganization) => void }) {
  return (
    <>
      <h1 className="display text-2xl">Choose your workspace</h1>
      <p className="mt-2 text-md text-ink-muted">Pick the organization you work in.</p>

      <ul className="mt-7 flex flex-col gap-2" aria-label="Workspaces">
        {demoWorkspaces.map((workspace) => (
          <li key={workspace.id}>
            <button
              type="button"
              onClick={() => onChoose(workspace)}
              className="flex h-14 w-full items-center gap-3 rounded-control border border-line-strong bg-surface px-3 text-left transition-colors hover:bg-raised focus-visible:border-accent focus-visible:outline-none"
            >
              <Avatar name={workspace.name} shape="square" className="size-8 text-xs" />
              <span className="flex-1 truncate text-base font-medium text-ink">
                {workspace.name}
              </span>
              <Icon name="chevron-right" className="text-ink-faint" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex justify-center text-base">
        <InertLink className="text-accent">Create an organization</InertLink>
      </div>
    </>
  )
}

function CredentialsStep({
  workspace,
  onChange,
  onSignedIn,
}: {
  workspace: SessionOrganization
  onChange: () => void
  onSignedIn: () => void
}) {
  const { email, setEmail, password, setPassword, errors, submitting, submit } = useSignIn(
    workspace.id,
  )
  const [showPassword, setShowPassword] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  useEffect(() => {
    if (errors.email) emailRef.current?.focus()
    else if (errors.password) passwordRef.current?.focus()
  }, [errors])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (await submit()) onSignedIn()
  }

  return (
    <>
      <div className="flex items-start gap-3">
        <Avatar name={workspace.name} shape="square" className="mt-0.5 size-10 text-sm" />
        <div className="min-w-0">
          <h1 className="display text-xl leading-tight">Sign in to {workspace.name}</h1>
          <button
            type="button"
            onClick={onChange}
            className="mt-0.5 text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Use a different workspace
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-4">
        <Field
          ref={emailRef}
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="name@company.com"
          value={email}
          error={errors.email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Field
          ref={passwordRef}
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="current-password"
          value={password}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
          labelEnd={<InertLink className="text-xs text-ink-muted">Forgot password?</InertLink>}
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

        {errors.form && (
          <p
            role="alert"
            className="rounded-control bg-negative-soft px-3 py-2 text-sm text-negative"
          >
            {errors.form}
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
    </>
  )
}

export function SignInScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const [workspace, setWorkspace] = useState<SessionOrganization | null>(rememberedWorkspace)

  function choose(next: SessionOrganization | null) {
    remember(next)
    setWorkspace(next)
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
          <div
            key={workspace?.id ?? 'choose'}
            className="rise w-full max-w-[26rem] rounded-card border border-line bg-surface p-9"
          >
            {workspace ? (
              <CredentialsStep
                workspace={workspace}
                onChange={() => choose(null)}
                onSignedIn={() => navigate(safeReturnPath(location.state), { replace: true })}
              />
            ) : (
              <WorkspaceStep onChoose={choose} />
            )}

            <p className="mt-7 border-t border-line pt-5 text-center text-base text-ink-faint">
              {operationLabels.join(' · ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
