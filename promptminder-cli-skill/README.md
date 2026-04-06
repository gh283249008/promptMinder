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
