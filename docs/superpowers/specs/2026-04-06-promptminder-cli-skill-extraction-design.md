# PromptMinder CLI Skill Extraction Design

## Summary

This design extracts the PromptMinder CLI agent skill from the CLI package into a standalone GitHub-ready repository directory named `promptminder-cli-skill`, so it can be published through the `skills.sh` ecosystem and installed via `npx skills add <repo>`.

The current bundled CLI skill remains available as a compatibility path. The standalone repository becomes the canonical distribution target and the preferred installation path in documentation.

## Goals

- Create a self-contained repository directory for the PromptMinder CLI skill.
- Align the skill package structure and metadata with the Agent Skills / `skills.sh` publication model.
- Reposition CLI-bundled skills as deprecated-but-supported compatibility behavior.
- Update PromptMinder documentation so the standalone skill repository is the primary public path.
- Keep the current CLI behavior intact to avoid breaking existing users.

## Non-Goals

- Removing or rewriting the `promptminder skills list/install/path` commands.
- Changing the runtime behavior of the PromptMinder CLI or `promptminder-agent`.
- Publishing the new repository to GitHub or filing the `vercel-labs/skills` indexing issue in this change.
- Building a multi-skill catalog; this work covers the PromptMinder CLI skill only.

## Current State

The current skill lives inside the CLI package at `packages/promptminder-cli/skills/promptminder-cli/SKILL.md`. The package README presents bundled installation through `promptminder skills install`, and the CLI implementation contains bundled skill listing and installation logic.

This makes the skill easy to install from the CLI package, but it is not structured as its own distributable repository for `skills.sh` indexing. Documentation also still treats the bundled route as the main installation path.

## Proposed Architecture

### 1. Standalone repository directory

Add a new top-level directory: `promptminder-cli-skill/`.

This directory is designed to be copied or pushed as its own Git repository without depending on the monorepo package layout. It becomes the canonical source for the public PromptMinder CLI skill.

Required initial contents:

- `promptminder-cli-skill/SKILL.md`
- `promptminder-cli-skill/README.md`
- `promptminder-cli-skill/LICENSE`

Optional supporting files may be added only if they clearly help installation or maintenance. Avoid unnecessary scaffolding.

### 2. Canonical content source

The standalone repository content is treated as the source of truth.

The existing bundled skill under `packages/promptminder-cli/skills/promptminder-cli/` remains in place for compatibility, but project documentation should explicitly state that the standalone repository is the preferred and canonical distribution path.

### 3. Compatibility strategy

CLI commands for bundled skills remain functional:

- `promptminder skills list`
- `promptminder skills install`
- `promptminder skills path`

These commands are not removed in this phase. Instead, documentation shifts their positioning from recommended primary path to deprecated compatibility path.

## Repository Content Design

### `promptminder-cli-skill/SKILL.md`

This file is the only required artifact for standards-based installation and must include YAML frontmatter suitable for public distribution.

The content should preserve the most useful operational guidance from the existing bundled skill:

- what `promptminder` and `promptminder-agent` do
- how authentication works
- how `PROMPTMINDER_TOKEN` is resolved
- how `--team` scopes workspace access
- stdout/stderr JSON behavior
- how `promptminder-agent` uses dot-notation actions and JSON input
- common operator mistakes and fixes

The frontmatter should be updated for standalone distribution, including at minimum:

- `name`
- `description`

And, if appropriate for the chosen open standard and project conventions:

- `version`
- `license`
- repository or author metadata

The file should stay concise and installation-focused rather than turning into a full CLI manual.

### `promptminder-cli-skill/README.md`

The README should explain:

- what the skill is for
- which agent tools it targets
- how to install it directly from GitHub with `npx skills add <owner>/<repo>`
- that `skills.sh` indexing requires a manual GitHub issue request
- how to verify installation
- which repository URL and skill name to use in the indexing request

It should also include a short publishing checklist so the directory can be promoted to a standalone GitHub repository without guesswork.

### `promptminder-cli-skill/LICENSE`

Use MIT to match the CLI package license unless repository-level licensing constraints require a different choice.

## Monorepo Documentation Changes

### `packages/promptminder-cli/README.md`

Revise the Agent Skills section so it:

- introduces the standalone repository as the preferred installation path
- shows the direct install flow for the external repository
- labels `promptminder skills install` as deprecated compatibility behavior
- avoids implying the bundled path is the long-term primary distribution model

The command examples should remain accurate for users who still depend on the bundled path.

### `README.md`

Add or adjust a short section near the CLI quick start to point users to the new standalone skill repository.

This change should keep the main product README concise while making the public distribution story discoverable from the root of the project.

### Canonical-source note

If needed for future maintenance clarity, add a brief note in the relevant documentation that:

- the standalone repository is the canonical public source
- the bundled CLI copy is retained for backwards compatibility

This note should be small and explicit rather than introducing a large maintenance guide.

## Content Consistency Rules

To reduce drift between the standalone repository and the bundled copy:

1. The standalone repository wording is considered authoritative.
2. The bundled copy may remain as-is for now unless a small sync update is needed for obvious correctness.
3. Documentation should not claim that bundled and standalone content are equally preferred.
4. New usage guidance should be written against the standalone repository first.

This phase does not require building an automated sync system. It only establishes a clear canonical-source policy.

## Implementation Constraints

- Do not remove existing CLI code paths for bundled skills.
- Do not introduce breaking changes to existing CLI commands.
- Keep the standalone directory self-contained and portable.
- Follow existing repository formatting and JavaScript/Markdown style.
- Keep installation instructions concrete and copy-pastable.

## Validation Plan

The implementation should verify:

1. The new `promptminder-cli-skill/` directory contains the required repository files.
2. `promptminder-cli-skill/SKILL.md` includes valid YAML frontmatter.
3. The CLI package README now promotes the standalone repository first.
4. Bundled CLI skill commands are documented as deprecated compatibility behavior, not removed.
5. The root README references the new standalone skill path in the CLI-related documentation.

## Risks and Mitigations

### Drift between standalone and bundled copies

Risk:
The standalone skill and bundled skill may diverge over time.

Mitigation:
Make the standalone repository the explicit canonical source in documentation and keep compatibility messaging narrow and intentional.

### User confusion about install paths

Risk:
Users may not know whether to use the standalone repository or the CLI bundled install.

Mitigation:
Lead every public-facing document with the standalone path and label the bundled route as deprecated compatibility behavior.

### Premature CLI deprecation pressure

Risk:
Changing wording too aggressively may imply that the bundled commands no longer work.

Mitigation:
Use deprecation wording that preserves trust: supported today, but no longer the recommended primary path.

## Testing Strategy

This work is documentation and packaging oriented, so testing focuses on correctness and consistency:

- inspect file structure
- inspect markdown content
- search for outdated wording that still positions bundled install as primary
- run lightweight verification commands if needed for repository consistency

No application runtime behavior changes are required in this phase.

## Expected Outcome

After implementation:

- PromptMinder has a dedicated `promptminder-cli-skill/` directory that can be pushed as an independent repository.
- The skill content is ready for GitHub-first distribution and later `skills.sh` indexing.
- CLI docs point users to the standalone repository first.
- Existing bundled CLI skill commands remain available, but clearly framed as compatibility behavior.
