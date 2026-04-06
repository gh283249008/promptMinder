# @aircrushin/promptminder-cli

PromptMinder command line client for managing prompts, tags, and teams over the PromptMinder HTTP API.

## Install

```bash
npm i -g @aircrushin/promptminder-cli
```

## Get a token

Create your token in the web app:

```text
https://www.prompt-minder.com/settings/cli-tokens
```

Copy it once and keep it in your shell or secret manager.

## Environment

Set the token in the shell where the CLI runs:

```bash
export PROMPTMINDER_TOKEN=pm_xxx
```

PowerShell:

```powershell
$env:PROMPTMINDER_TOKEN = "pm_xxx"
```

The CLI is hard-wired to `https://www.prompt-minder.com`.

## Usage

```bash
promptminder auth login --token pm_xxx
promptminder help
promptminder team list
promptminder prompt list
promptminder prompt get <promptId>
promptminder prompt create --title "My Prompt" --content "Hello"
promptminder tag list
```

## Agent wrapper

The package also ships a whitelist wrapper intended for AI agents:

```bash
promptminder-agent prompt.list
promptminder-agent prompt.get --input '{"id":"prompt-id"}'
promptminder-agent prompt.create --input '{"title":"My Prompt","content":"Hello"}'
```

## Agent Skills

The package ships Agent Skills — reference guides that teach AI coding agents (Cursor, Claude Code, Codex) how to use the CLI correctly. Skills cover auth, team scoping, JSON output handling, the `promptminder-agent` wrapper, and common mistakes.

Install skills into your Cursor user directory (`~/.cursor/skills/`):

```bash
promptminder skills install
```

Other targets:

```bash
promptminder skills install --target cursor-project   # .cursor/skills/ in cwd (team/repo scope)
promptminder skills install --target claude           # ~/.claude/skills/
promptminder skills install --target codex            # ~/.agents/skills/
```

Use `--force` to overwrite an existing installation, `--skill <name>` to install a single skill.

List bundled skills:

```bash
promptminder skills list
```

Print the bundled skills directory path:

```bash
promptminder skills path
```

Skills follow the [agentskills.io specification](https://agentskills.io/specification).

## Publish

Before publishing:

1. Login with `npm login`.
2. Publish from this package directory:

```bash
cd packages/promptminder-cli
npm publish --access public
```
