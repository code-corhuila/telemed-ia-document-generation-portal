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
Consumes shell/apiClient and shell/session from telemed-ia-front.
Does NOT implement its own HTTP client or session (norm 5.4.1).

## How to run

npm ci
npm start   # runs on port 4204

## Related documentation

- telemed-ia-docs/00-governance/branching-policy.md
- telemed-ia-docs/05-architecture/decisions/records/
- Anexo H of the repo norm.

## Known gaps

- **`downloadUrl` expiration is not modeled.** The presigned URL is
  short-lived by contract with the `-api`, but the portal does not yet
  know when it expires. An `expiresAt` field may be added in PR #4 when
  the download flow is implemented and the portal needs to detect an
  expired URL and re-request it.

- **`DocumentDataSource` does not declare a failure contract yet.** The
  port returns a bare `Promise<readonly ConsultationDocument[]>`. The
  real adapter (in PR #4) will reject with the shell's `ApiError`; the
  contract will be made explicit at that point, when there is an actual
  failure path to exercise.

- **The `ConsultationDocument` test suite validates the mock's output,
  not an extractable domain invariant.** Once the real adapter exists,
  the nullability rules enforced by the discriminated union will be
  tested against the adapter's output, not just the fixture data.
