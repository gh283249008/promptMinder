# @aircrushin/promptminder-cli

PromptMinder command line client for managing prompts, tags, and teams over the PromptMinder HTTP API.

## Install

```bash
npm i -g @aircrushin/promptminder-cli
```

## Environment

Set the API base URL and token in the shell where the CLI runs:

```bash
export PROMPTMINDER_BASE_URL=https://your-domain.com
export PROMPTMINDER_TOKEN=pm_xxx
```

PowerShell:

```powershell
$env:PROMPTMINDER_BASE_URL = "https://your-domain.com"
$env:PROMPTMINDER_TOKEN = "pm_xxx"
```

## Usage

```bash
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

1. Replace `@your-scope` with your real npm scope in `package.json`.
2. Login with `npm login`.
3. Publish from this package directory:

```bash
cd packages/promptminder-cli
npm publish --access public
```
