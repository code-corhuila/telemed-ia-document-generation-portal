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
