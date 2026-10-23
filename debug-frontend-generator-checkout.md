# Debug Session: frontend-generator-checkout
- **Status**: [OPEN]
- **Issue**: Frontend deployment fails while checking out `nciyuan9264/pam-generate` at commit `609f369d9dee06920c9d40abebc2d2b38ee4631f`; GitHub returns `Repository not found`.
- **Debug Server**: http://127.0.0.1:7778/event
- **Log File**: `.dbg/trae-debug-log-frontend-generator-checkout.ndjson`

## Reproduction Steps
1. Trigger the game frontend deployment workflow.
2. Wait for the `actions/checkout@v4` step for `nciyuan9264/pam-generate`.
3. Observe three failed fetch attempts with `Repository not found`.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | The pam-generate repository does not exist under the configured GitHub owner/name | High | Low | Rejected: local origin is `github.com/nciyuan9264/pam-generate.git` |
| B | The repository is private and the workflow token cannot read another repository | High | Low | Confirmed: cross-repository checkout has no explicit token and GitHub returns `Repository not found` |
| C | The pinned commit was never pushed to the remote repository | Medium | Low | Rejected: `origin/main` is pinned commit `609f369...` |
| D | Deploy does not need generator checkout and the step is an unnecessary dependency | Medium | Medium | Confirmed: only `check:generated` invokes the generator; deploy artifacts use committed generated code |

## Log Evidence
1. `.dbg/trae-debug-log-frontend-generator-checkout.ndjson:1`: configured repository name matches the local remote.
2. `.dbg/trae-debug-log-frontend-generator-checkout.ndjson:2`: checkout uses only the source repository token.
3. `.dbg/trae-debug-log-frontend-generator-checkout.ndjson:3`: pinned commit exists on `origin/main`.
4. `.dbg/trae-debug-log-frontend-generator-checkout.ndjson:4`: generator is only required by `check:generated`.

## Verification Conclusion
The deploy workflow unnecessarily checks out a private sibling repository. The frontend repository `GITHUB_TOKEN` cannot read it, so GitHub returns `Repository not found`. Deployment can use committed generated sources and run lint, tests, and build without generator access.

### Pre-fix vs Post-fix
- Pre-fix: deployment stopped before dependency installation because checkout of the private `pam-generate` repository returned `Repository not found`.
- Post-fix: Deploy contains no cross-repository checkout.
- Local verification with pnpm 9: frozen install, lint, 50 test files / 157 tests, and production build all pass.
- Remote verification: `Deploy to Aliyun OSS #300` for commit `463969d` completed successfully in about 1 minute 15 seconds.
