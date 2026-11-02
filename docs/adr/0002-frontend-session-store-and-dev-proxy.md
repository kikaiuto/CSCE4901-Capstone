# ADR 0002 — Frontend session store and dev proxy

- **Status:** accepted
- **Date:** 2026-10-26

## Context

PR #13 gives the backend real authentication: `POST /api/base/auth/login`
returns a bearer token and `GET /api/base/auth/me` returns the caller's user id,
organization id, role, and email. Nothing on the frontend could use it. There was
no API client, no notion of a session, and the signed-in user was a fixture
constant that three core files imported directly from the base addon
(`useAccess`, the module rail, and the Today screen through core). That coupling
runs the wrong way: core is supposed to be the framework half, and it was
reading business fixtures to decide what the rail shows.

Two environment facts shaped the shape of the fix. The backend has no CORS
middleware, and Compose runs the frontend on port 5173 and the backend on 8000,
so a browser call from one to the other is blocked. And the backend's error
handler already fixes a response envelope, `{error, message, details}`, which
every screen will need to read the same way.

## Decision

**Session store in core.** `core/app/session.ts` holds the session (token, user,
organization) in a module-level store exposed two ways: `getSession()` for
synchronous reads such as the access matrix, and `useSession()` through
`useSyncExternalStore` for components that must re-render when it changes. It
persists to `sessionStorage` so a page refresh during development does not drop
back to sign-in, and a tab close ends the session. A real sign-in records the
token's expiry from the login response, and the store treats an expired entry as
signed out, so a tab left open past the hour lands on sign-in rather than on a
screen whose first request will fail. Anything in storage that does not match
the session shape, such as an entry written by an older build, is ignored.

**Core never imports a user from an addon.** `useAccess` reads the role from the
session. The module rail reads the user and organization from it. The registry's
rail items became a function so they follow the session instead of being frozen
at import time, and the sign-in screen's module list no longer depends on who is
signed in. Until the sign-in screen is wired to the backend, it signs in the base
addon's demo user; the test harness does the same before each test. Both are
assembly points, so `addonDeps.test.ts` lists `test/setup.ts` alongside the
others.

**One API client.** `core/lib/api.ts` owns `fetch`. It builds URLs from
`VITE_API_URL` (empty by default, meaning same origin), attaches the bearer
token, and converts failures into one `ApiError` carrying the status, the
backend's error code, its message, and its details. `session.authorized()` wraps
it with the current token and signs the user out on a 401, so an expired token
lands the person back on sign-in rather than on a broken screen.

**Dev proxy instead of CORS.** The Vite dev server (and `vite preview`) proxies
`/api` and `/health` to the backend, so the browser only ever talks to its own
origin. The target is `API_PROXY_TARGET`, read from the shell or a `.env` file,
defaulting to `localhost:8000` and set to the backend container in Compose. The
Dockerfile's nginx `serve` stage has no such proxy, so a deployed bundle needs
either an nginx `/api` location or `VITE_API_URL` at build time plus CORS on the
backend. That is deployment work and is deferred with the rest of it; this
decision only removes CORS from the local critical path.

**Role vocabulary in core.** The six roles moved to `core/app/roles.ts` with a
mapper from the backend's lowercase names to the title-case names the screens
use. The base fixtures re-export them, so existing imports still work.

## Consequences

- Wiring the sign-in screen to the backend is now a change to that one screen:
  call `signInWithPassword` and show the `ApiError` message on failure.
- Screens that read the user do so through `useSignedIn()`, which throws if
  rendered outside a signed-in shell. The app shell guards that by redirecting a
  visitor without a session to `/`, remembering where they were so sign-in can
  return them there.
- Two gaps remain on the backend side and were raised on PR #13: `/auth/me`
  returns no display name and no organization name, so the session falls back to
  the email and an empty organization name until those fields exist; and login
  still needs an organization UUID the sign-in screen does not collect.
- `VITE_API_URL` is no longer set in Compose. Setting it points the client at a
  different origin and reintroduces the need for CORS.
