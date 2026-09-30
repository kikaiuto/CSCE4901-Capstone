import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/core/components/ui/Button'
import { Field } from '@/core/components/ui/Field'

const MODULES = ['Sales', 'Inventory', 'Procurement', 'Accounting']

export function SignInScreen() {
  const navigate = useNavigate()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate('/home')
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
          <div className="animate-rise w-full max-w-[26rem] rounded-card border border-line bg-surface p-9">
            <h1 className="display text-3xl">Sign in</h1>
            <p className="mt-2 text-md text-ink-muted">Use your work email.</p>

            <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
              <Field
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="name@company.com"
                defaultValue="dana@acmesupply.com"
              />
              <Field
                label="Password"
                type="password"
                name="password"
                autoComplete="current-password"
                defaultValue="placeholder"
              />

              <Button type="submit" variant="primary" shortcut="↵" className="mt-2 h-10 w-full">
                Sign in
              </Button>
            </form>

            <div className="mt-5 flex items-center justify-between text-base">
              <button
                type="button"
                aria-disabled="true"
                title="Not wired up yet"
                className="text-ink-muted"
              >
                Forgot password?
              </button>
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
              {MODULES.join(' · ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
