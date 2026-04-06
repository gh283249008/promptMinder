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

## Publish

Before publishing:

1. Login with `npm login`.
2. Publish from this package directory:

```bash
cd packages/promptminder-cli
npm publish --access public
```
