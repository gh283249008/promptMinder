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

## Publish

Before publishing:

1. Login with `npm login`.
2. Publish from this package directory:

```bash
cd packages/promptminder-cli
npm publish --access public
```
