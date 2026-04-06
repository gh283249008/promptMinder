# PromptMinder CLI Skill Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the PromptMinder CLI skill into a standalone `promptminder-cli-skill/` repository directory, then update monorepo documentation so the standalone repo is the primary installation path and bundled CLI skills are documented as deprecated compatibility behavior.

**Architecture:** The implementation adds a self-contained top-level skill repository directory with `SKILL.md`, `README.md`, and `LICENSE`, using the current bundled CLI skill as source material. Existing CLI code and bundled skill files remain unchanged, while README content in the CLI package and root project is rewritten to make the standalone repository canonical and the bundled install path explicitly deprecated.

**Tech Stack:** Markdown, existing PromptMinder monorepo docs, git, ripgrep

---

### Task 1: Create the standalone repository directory

**Files:**
- Create: `promptminder-cli-skill/SKILL.md`
- Create: `promptminder-cli-skill/README.md`
- Create: `promptminder-cli-skill/LICENSE`

- [ ] **Step 1: Verify the standalone repository directory does not already exist**

Run: `test -e promptminder-cli-skill && echo "exists"`
Expected: no output

- [ ] **Step 2: Write the standalone skill file**

Use this content for `promptminder-cli-skill/SKILL.md`:

````markdown
---
name: promptminder-cli
description: Use when running promptminder or promptminder-agent commands, setting PROMPTMINDER_TOKEN, passing --team for workspace scoping, handling JSON stderr errors like "Missing token" or HTTP 401, or using the agent wrapper with dot-notation actions and --input JSON.
version: 1.0.0
license: MIT
---

# PromptMinder CLI

## Overview

`promptminder` is a JSON-in / JSON-out CLI for managing prompts, tags, and teams via the PromptMinder API. Every success response goes to **stdout**; every error goes to **stderr** as `{"error":{"message":"...","status":null}}`.

Install the CLI first:

```bash
npm i -g @aircrushin/promptminder-cli
```

## Auth & Token

Token resolution order: `--token` flag -> `PROMPTMINDER_TOKEN` env var -> saved config.

```bash
# One-time interactive login (saves token to ~/.promptminder/config.json)
promptminder auth login --token pm_xxx

# CI / scripts — prefer env var, no saved state needed
export PROMPTMINDER_TOKEN=pm_xxx
promptminder prompt list
```

`promptminder auth logout` removes the saved token.

## Quick Reference

```text
promptminder auth login --token <token>
promptminder team list
promptminder prompt list   [--team <id>] [--tag <tag>] [--search <text>] [--page <n>] [--limit <n>]
promptminder prompt get    <id> [--team <id>]
promptminder prompt create --title <text> --content <text> [--description <text>] [--tags <csv>] [--version <text>] [--team <id>]
promptminder prompt update <id> [--title <text>] [--content <text>] [--team <id>]
promptminder prompt delete <id> --yes [--team <id>]
promptminder tag list      [--team <id>] [--include-public <true|false>]
promptminder tag create    --name <text> [--team <id>]
promptminder tag update    <id> --name <text> [--team <id>]
promptminder tag delete    <id> --yes [--team <id>]
```

Run `promptminder help` for up-to-date full usage.

## Team Scoping

Pass `--team <uuid>` to target a non-personal workspace. Omitting `--team` targets the personal workspace. The flag is always `--team`, never `--team-id`.

```bash
promptminder prompt list --team team-uuid-xyz
```

## Content Input Sources

`prompt create` and `prompt update` accept content three ways — use exactly one:

| Flag | When to use |
|------|-------------|
| `--content "..."` | Inline short text |
| `--content-file path/to/file.txt` | Content from a local file |
| `--stdin` | Pipe content from another command |

## Agent Wrapper (`promptminder-agent`)

Use `promptminder-agent` in scripts and AI agent pipelines. Actions use **dot notation**, not space-separated subcommands. Input is a single `--input` JSON object, not individual flags.

```bash
# List prompts
promptminder-agent prompt.list

# Get a specific prompt
promptminder-agent prompt.get --input '{"id":"prompt-id"}'

# Create a prompt in a team
promptminder-agent prompt.create --input '{"title":"SQL helper","content":"Write clean SQL","team":"team-uuid"}'

# Pipe JSON from a file
cat payload.json | promptminder-agent prompt.create --stdin
```

Available actions: `team.list`, `prompt.list`, `prompt.get`, `prompt.create`, `prompt.update`, `prompt.delete`, `tag.list`, `tag.create`, `tag.update`, `tag.delete`.

Run `promptminder-agent help` for the full list with input field requirements.

## Error Triage

| Stderr message | Cause | Fix |
|---|---|---|
| `Missing token. Pass --token or run promptminder auth login.` | No token found | Set `PROMPTMINDER_TOKEN` or run `auth login` |
| HTTP 401 | Token invalid or expired | Re-run `auth login` with a fresh token |
| `Destructive commands require --yes` | Delete without confirmation flag | Add `--yes` |
| `Use only one of --content, --content-file, or --stdin` | Multiple content sources | Keep only one |

## Common Mistakes

- **Wrong agent wrapper syntax**: `promptminder-agent prompt list` fails — use `promptminder-agent prompt.list` (dot notation).
- **Wrong team flag**: `--team-id` does not exist — use `--team <uuid>`.
- **Piping with jq**: pipe `promptminder prompt list | jq .` — stdout is always JSON.
- **Token in CI**: prefer `PROMPTMINDER_TOKEN` env var; avoid checking in the token or running interactive `auth login` in pipelines.
````

- [ ] **Step 3: Write the standalone repository README**

Use this content for `promptminder-cli-skill/README.md`:

````markdown
# promptminder-cli-skill

Agent Skill for teaching AI coding agents how to use the PromptMinder CLI and `promptminder-agent` wrapper correctly.

## What This Skill Covers

- PromptMinder CLI authentication and token setup
- Personal workspace vs `--team` workspace scoping
- JSON stdout / stderr handling
- `promptminder-agent` dot-notation actions
- Common usage mistakes and recovery steps

## Supported Tools

This repository is intended for tools that support the Agent Skills open format, including:

- Claude Code
- Cursor
- GitHub Copilot
- OpenAI Codex CLI
- Windsurf

## Install

Install the PromptMinder CLI first:

```bash
npm i -g @aircrushin/promptminder-cli
```

Install the skill directly from GitHub:

```bash
npx skills add aircrushin/promptminder-cli-skill
```

## Verify Installation

```bash
npx skills find promptminder-cli
```

Expected result: the `promptminder-cli` skill appears in the local skill index.

## Publishing To skills.sh

`skills.sh` does not auto-index GitHub repositories. After pushing this repository to GitHub, submit an indexing request:

```bash
gh issue create --repo vercel-labs/skills \
  --title "Request to index skill: aircrushin/promptminder-cli-skill" \
  --body "## Skill Information
- **Repository:** https://github.com/aircrushin/promptminder-cli-skill
- **Skill name:** promptminder-cli
- **Install:** \`npx skills add aircrushin/promptminder-cli-skill\`
- **License:** MIT

## Description
PromptMinder CLI skill for AI agents. Covers authentication, team scoping, JSON IO conventions, the promptminder-agent wrapper, and common operator mistakes."
```

Users can still install the skill directly with `npx skills add aircrushin/promptminder-cli-skill` while the indexing request is under review.

## Repository Layout

```text
promptminder-cli-skill/
├── SKILL.md
├── README.md
└── LICENSE
```

## Publishing Checklist

1. Create the GitHub repository `aircrushin/promptminder-cli-skill`.
2. Push the contents of this directory to the repository root.
3. Confirm `npx skills add aircrushin/promptminder-cli-skill` works.
4. Submit the `vercel-labs/skills` indexing issue.
5. Confirm `npx skills find promptminder-cli` can discover the skill after indexing.
````

- [ ] **Step 4: Write the standalone repository license**

Use this content for `promptminder-cli-skill/LICENSE`:

```text
MIT License

Copyright (c) 2026 aircrushin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 5: Verify the standalone repository files exist and the frontmatter is present**

Run: `test -f promptminder-cli-skill/SKILL.md && test -f promptminder-cli-skill/README.md && test -f promptminder-cli-skill/LICENSE && rg -n "^name: promptminder-cli$|^version: 1.0.0$|^license: MIT$" promptminder-cli-skill/SKILL.md`
Expected:

```text
2:name: promptminder-cli
4:version: 1.0.0
5:license: MIT
```

- [ ] **Step 6: Commit the standalone repository scaffolding**

Run:

```bash
git add promptminder-cli-skill/SKILL.md promptminder-cli-skill/README.md promptminder-cli-skill/LICENSE
git commit -m "docs: add standalone promptminder cli skill repo"
```

Expected: a new commit is created with the three standalone repository files.

### Task 2: Update the CLI package README

**Files:**
- Modify: `packages/promptminder-cli/README.md`

- [ ] **Step 1: Write the failing content check**

Run: `rg -n "promptminder skills install|standalone repository|deprecated compatibility" packages/promptminder-cli/README.md`
Expected:

```text
[matches for "promptminder skills install", but no matches for "standalone repository" or "deprecated compatibility"]
```

- [ ] **Step 2: Replace the Agent Skills section with standalone-first messaging**

Replace the existing `## Agent Skills` section in `packages/promptminder-cli/README.md` with this content:

````markdown
## Agent Skills

The official PromptMinder Agent Skill now lives in the standalone repository `aircrushin/promptminder-cli-skill`. That repository is the canonical public source and the recommended installation path for tools that support the Agent Skills open format.

Install the skill directly from GitHub:

```bash
npx skills add aircrushin/promptminder-cli-skill
```

Verify installation:

```bash
npx skills find promptminder-cli
```

The CLI still ships bundled skills and `promptminder skills install`, but that path is now a deprecated compatibility option for existing users.

Install the bundled copy into your Cursor user directory (`~/.cursor/skills/`):

```bash
promptminder skills install
```

Other bundled install targets:

```bash
promptminder skills install --target cursor-project   # .cursor/skills/ in cwd (team/repo scope)
promptminder skills install --target claude           # ~/.claude/skills/
promptminder skills install --target codex            # ~/.agents/skills/
```

Use `--force` to overwrite an existing installation, `--skill <name>` to install a single bundled skill.

List bundled skills:

```bash
promptminder skills list
```

Print the bundled skills directory path:

```bash
promptminder skills path
```

Skills follow the [agentskills.io specification](https://agentskills.io/specification).
````

- [ ] **Step 3: Verify the README now prefers the standalone path**

Run: `rg -n "standalone repository|canonical public source|deprecated compatibility option|npx skills add aircrushin/promptminder-cli-skill" packages/promptminder-cli/README.md`
Expected:

```text
[matches for all four phrases]
```

- [ ] **Step 4: Commit the CLI README change**

Run:

```bash
git add packages/promptminder-cli/README.md
git commit -m "docs: point cli skill docs to standalone repo"
```

Expected: a new commit is created with the README rewrite only.

### Task 3: Update the root project README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write the failing content check**

Run: `rg -n "npx skills add aircrushin/promptminder-cli-skill|deprecated compatibility" README.md`
Expected: no output

- [ ] **Step 2: Add a standalone skill note near the CLI quick start**

Add this block immediately after the existing CLI quick start snippet in `README.md`:

````markdown
### CLI Agent Skill

如果你希望 Cursor、Claude Code、Codex CLI 等 AI agent 正确使用 PromptMinder CLI，优先安装独立 skill 仓库：

```bash
npx skills add aircrushin/promptminder-cli-skill
```

仓库地址：`https://github.com/aircrushin/promptminder-cli-skill`

CLI 当前仍保留 `promptminder skills install`，但该路径仅作为兼容旧安装方式的 deprecated compatibility 入口，后续以独立 skill 仓库为准。
````

- [ ] **Step 3: Verify the root README mentions the standalone path**

Run: `rg -n "CLI Agent Skill|npx skills add aircrushin/promptminder-cli-skill|deprecated compatibility" README.md`
Expected:

```text
[matches for all three phrases]
```

- [ ] **Step 4: Commit the root README change**

Run:

```bash
git add README.md
git commit -m "docs: add root readme skill distribution note"
```

Expected: a new commit is created with the root README addition only.

### Task 4: Run final verification

**Files:**
- Verify: `promptminder-cli-skill/SKILL.md`
- Verify: `promptminder-cli-skill/README.md`
- Verify: `promptminder-cli-skill/LICENSE`
- Verify: `packages/promptminder-cli/README.md`
- Verify: `README.md`

- [ ] **Step 1: Check the new standalone repository file set**

Run: `rg --files promptminder-cli-skill`
Expected:

```text
promptminder-cli-skill/LICENSE
promptminder-cli-skill/README.md
promptminder-cli-skill/SKILL.md
```

- [ ] **Step 2: Check the main wording changes across docs**

Run: `rg -n "aircrushin/promptminder-cli-skill|canonical public source|deprecated compatibility" promptminder-cli-skill/README.md packages/promptminder-cli/README.md README.md`
Expected: matches from all three files, confirming the standalone repository is primary and bundled install is compatibility-only.

- [ ] **Step 3: Inspect git status**

Run: `git status --short`
Expected: only the intended documentation files are changed or committed; no unrelated files appear.

- [ ] **Step 4: Commit any remaining verification-safe documentation changes**

Run:

```bash
git add promptminder-cli-skill/SKILL.md promptminder-cli-skill/README.md promptminder-cli-skill/LICENSE packages/promptminder-cli/README.md README.md
git commit -m "docs: finalize promptminder cli skill extraction"
```

Expected: if prior task commits were already created, this step may report nothing to commit; otherwise it creates the final documentation commit.
