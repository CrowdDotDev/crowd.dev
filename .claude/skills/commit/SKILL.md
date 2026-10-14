---
name: commit
description: Generate a commit message and commit staged changes using git commit -s -S.
allowed-tools: Bash, AskUserQuestion
---

Commit the current staged changes.

1. Run `git diff --staged`. If empty, tell the user there is nothing staged and stop.
2. Run `git log --oneline -5` to understand this repo's commit message style.
3. Run `git branch --show-current` to get the branch name. If it matches `<type>/issue-<number>-<description>`, the commit body is `Refs linuxfoundation/lfx-cdp-insights-ops#<number>`. Otherwise ask the user for the tracking issue number in `linuxfoundation/lfx-cdp-insights-ops`; if they have none, commit without a body.
4. Generate a single commit message following Conventional Commits format: `type: description`. Subject max 72 characters, lowercase, no trailing period, no issue reference. No scope required unless meaningful. The only body line is the `Refs` line from step 3. No extra trailers, no Co-Authored-By. (The `Signed-off-by` trailer is added automatically by `-s`.)
   - Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
5. Run `git commit -s -S -m "<subject>" -m "<body>"` using exactly the generated message (omit the second `-m` when there is no body).
6. Output only the commit hash and subject line from the result.
