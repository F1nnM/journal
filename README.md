# Journal

A minimalist mobile-first web app for personal journaling. One text entry per day, calendar overview, full-text search, and a distraction-free writing experience.

## Features

- One entry per day with auto-save
- Monthly calendar with dots on days that have entries
- Full-text search with highlighted snippets
- OIDC authentication (with dev mode bypass for local development)
- Dark/light theme toggle
- Mobile-first responsive design

## Tech Stack

Nuxt 3 monolith (SSR + API), tRPC for type-safe API, Drizzle ORM with PostgreSQL, nuxt-auth-utils for OIDC sessions, Tailwind CSS.

## Local Development

Prerequisites: [mise](https://mise.jdx.dev/), Docker

```bash
# Install tools (node, tilt, ctlptl, k3d)
mise install

# Start local k3d cluster + Tilt
mise run start

# Stop and tear down
mise run stop
```

This starts a k3d Kubernetes cluster with:
- The journal app (live-reloading via Tilt)
- A PostgreSQL instance
- Port-forwards: app on `localhost:3000`, Postgres on `localhost:5432`

Auth is bypassed in dev mode (no OIDC config needed). A dev user is created automatically.

### Running Tests

Tests run against a real PostgreSQL. With Tilt running:

```bash
npx vitest run
```

## Environment Variables

| Variable | Description |
|---|---|
| `NUXT_DATABASE_URL` | PostgreSQL connection string |
| `NUXT_SESSION_PASSWORD` | Cookie encryption key (min 32 chars) |
| `NUXT_OAUTH_OIDC_CLIENT_ID` | OIDC client ID |
| `NUXT_OAUTH_OIDC_CLIENT_SECRET` | OIDC client secret |
| `NUXT_OAUTH_OIDC_OPENID_CONFIG` | OIDC discovery URL (`<issuer>/.well-known/openid-configuration`) |
| `NUXT_OAUTH_OIDC_REDIRECT_URL` | OIDC callback URL |

When no `NUXT_OAUTH_OIDC_CLIENT_ID` is set, the app falls back to dev auth mode.

## Deployment

### Docker

```bash
docker build -t journal .
docker run -p 3000:3000 \
  -e NUXT_DATABASE_URL=postgresql://user:pass@host:5432/journal \
  -e NUXT_SESSION_PASSWORD=your-32-char-secret-key-here1234 \
  -e NUXT_OAUTH_OIDC_CLIENT_ID=your-client-id \
  -e NUXT_OAUTH_OIDC_CLIENT_SECRET=your-client-secret \
  -e NUXT_OAUTH_OIDC_OPENID_CONFIG=https://your-idp/.well-known/openid-configuration \
  -e NUXT_OAUTH_OIDC_REDIRECT_URL=https://your-domain/auth/oidc \
  journal
```

### Helm Chart

A Helm chart is included in `deploy/` and published to `oci://ghcr.io/f1nnm/journal-charts` on each push to main.

```bash
helm install journal oci://ghcr.io/f1nnm/journal-charts/journal \
  --set database.url=postgresql://user:pass@host:5432/journal \
  --set session.password=your-32-char-secret-key-here1234 \
  --set oidc.issuerUrl=https://your-idp \
  --set oidc.clientId=your-client-id \
  --set oidc.clientSecret=your-client-secret \
  --set oidc.redirectUrl=https://your-domain/auth/oidc \
  --set ingress.host=your-domain
```

#### Helm Values

```yaml
image:
  repository: ghcr.io/f1nnm/journal
  tag: latest

database:
  url: ""              # PostgreSQL connection string
  existingSecret:
    name: ""           # Use an existing secret for DATABASE_URL instead
    key: uri           # Key within that secret

oidc:
  issuerUrl: ""
  clientId: ""
  clientSecret: ""
  redirectUrl: ""

session:
  password: ""         # Min 32 chars

ingress:
  enabled: true
  className: nginx
  host: ""
  annotations: {}

resources:
  requests:
    cpu: 10m
    memory: 64Mi
  limits:
    memory: 256Mi
```

The `database.existingSecret` option is useful when the database URL is provided by an operator (e.g. CloudNative-PG creates a secret with a `uri` key automatically).

### CI/CD

The GitHub Actions workflow (`.github/workflows/release.yaml`) runs on push to `main` and:
1. Builds and pushes the Docker image to `ghcr.io/f1nnm/journal`
2. Packages and pushes the Helm chart to `oci://ghcr.io/f1nnm/journal-charts`
