# telemed-ia-document-generation-portal

> document-generation bounded context: web UI (remote)

Part of team telemed-ia, Grupo 2. Governance and documentation live in
[telemed-ia-docs](https://github.com/code-corhuila/telemed-ia-docs).

## Branching

Three permanent branches. None accepts a direct commit.

develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/...  hotfix/...

Promotion happens by re-application (git cherry-pick -x).

main requires 1 approval from @ariel5253.

## What lives in this repo

The document-generation domain UI. Exposes ./routes via Native Federation.
Mounted inside the shell's injector (`telemed-ia-front`): it uses the shell's
`HttpClient` and its interceptor (token, `X-Correlation-Id`, timeout, errors).
Does NOT implement its own HTTP client or session (norm 5.4.1).

`src/app/shell-contract.ts` declares what the shell guarantees: a failed request
rejects with its `ApiError` (`status`, `code`, `message`, `details`, `traceId`),
mirrored from `telemed-ia-front/src/app/core/http/api-error.ts`. The page reads
failures with `asApiError`.

## How to run

npm ci
npm start   # runs on port 4204

## Related documentation

- telemed-ia-docs/00-governance/branching-policy.md
- telemed-ia-docs/05-architecture/decisions/records/
- Anexo H of the repo norm.

## Deploy

See [deploy/README.md](deploy/README.md) for instructions to build
and run the portal as a Docker container.
