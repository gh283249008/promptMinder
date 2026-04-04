#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');

const EXIT_CODES = {
  SUCCESS: 0,
  BUSINESS_ERROR: 1,
  CONFIG_ERROR: 2,
  NETWORK_ERROR: 3,
};

const CONFIG_DIR = path.join(os.homedir(), '.promptminder');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

function printJson(value, stream = process.stdout) {
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
}

function fail(message, exitCode = EXIT_CODES.CONFIG_ERROR, status = null) {
  printJson({
    error: {
      message,
      status,
    },
  }, process.stderr);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const parsed = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--') {
      continue;
    }

    if (!token.startsWith('--')) {
      parsed._.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith('--')) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

function readConfigFile() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return {};
    }
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (error) {
    fail(`Unable to read config file at ${CONFIG_PATH}: ${error.message}`);
  }
}

function writeConfigFile(nextConfig) {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(nextConfig, null, 2));
  } catch (error) {
    fail(`Unable to write config file at ${CONFIG_PATH}: ${error.message}`);
  }
}

function removeConfigToken() {
  const current = readConfigFile();
  const next = { ...current };
  delete next.token;
  writeConfigFile(next);
}

function resolveRuntimeConfig(args) {
  const fileConfig = readConfigFile();
  return {
    baseUrl: args['base-url'] || process.env.PROMPTMINDER_BASE_URL || fileConfig.baseUrl || null,
    token: args.token || process.env.PROMPTMINDER_TOKEN || fileConfig.token || null,
    timeout: Number(args.timeout || 30000),
  };
}

function requireValue(value, message) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    fail(message);
  }
  return value.trim();
}

function ensureDeleteConfirmed(args) {
  if (!args.yes) {
    fail('Destructive commands require --yes');
  }
}

async function readStdin() {
  if (process.stdin.isTTY) {
    fail('--stdin was set but no stdin stream is available');
  }

  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function resolvePromptContent(args) {
  const sources = [args.content ? 'inline' : null, args['content-file'] ? 'file' : null, args.stdin ? 'stdin' : null]
    .filter(Boolean);

  if (sources.length > 1) {
    fail('Use only one of --content, --content-file, or --stdin');
  }

  if (args.content !== undefined) {
    return args.content;
  }

  if (args['content-file']) {
    try {
      return fs.readFileSync(path.resolve(process.cwd(), args['content-file']), 'utf8');
    } catch (error) {
      fail(`Unable to read content file: ${error.message}`);
    }
  }

  if (args.stdin) {
    return readStdin();
  }

  return undefined;
}

function buildHeaders(config, teamId) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.token}`,
  };

  if (teamId) {
    headers['X-Team-Id'] = teamId;
  }

  return headers;
}

async function requestJson(config, { method = 'GET', endpoint, query = null, body, teamId }) {
  const baseUrl = requireValue(config.baseUrl, 'Missing base URL. Pass --base-url or set PROMPTMINDER_BASE_URL.');
  const token = requireValue(config.token, 'Missing token. Pass --token or run promptminder auth login.');
  const url = new URL(endpoint, baseUrl);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: buildHeaders({ ...config, token }, teamId),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await response.text();
    let data = null;

    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch (_error) {
        data = { raw: rawText };
      }
    }

    if (!response.ok) {
      const message = data?.error || data?.message || `HTTP ${response.status}`;
      const exitCode = response.status === 401 ? EXIT_CODES.CONFIG_ERROR : EXIT_CODES.BUSINESS_ERROR;
      fail(message, exitCode, response.status);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      fail(`Request timed out after ${config.timeout}ms`, EXIT_CODES.NETWORK_ERROR);
    }

    fail(`Network error: ${error.message}`, EXIT_CODES.NETWORK_ERROR);
  }
}

function usage() {
  return `
promptminder auth login --base-url <url> --token <token>
promptminder auth logout
promptminder team list
promptminder prompt list [--team <id>] [--tag <tag>] [--search <text>] [--page <n>] [--limit <n>]
promptminder prompt get <id> [--team <id>]
promptminder prompt create --title <text> [--description <text>] [--content <text> | --content-file <path> | --stdin] [--tags <csv>] [--version <text>] [--team <id>]
promptminder prompt update <id> [--title <text>] [--description <text>] [--content <text> | --content-file <path> | --stdin] [--tags <csv>] [--version <text>] [--team <id>]
promptminder prompt delete <id> [--team <id>] --yes
promptminder tag list [--team <id>] [--include-public <true|false>]
promptminder tag create --name <text> [--team <id>]
promptminder tag update <id> --name <text> [--team <id>]
promptminder tag delete <id> [--team <id>] --yes
`.trim();
}

async function handleAuth(args) {
  const action = args._[1];

  if (action === 'login') {
    const baseUrl = requireValue(args['base-url'], '--base-url is required');
    const token = requireValue(args.token, '--token is required');
    const tempConfig = { baseUrl, token, timeout: Number(args.timeout || 30000) };
    const validation = await requestJson(tempConfig, { endpoint: '/api/teams' });
    writeConfigFile({ ...readConfigFile(), baseUrl, token });
    printJson({
      success: true,
      base_url: baseUrl,
      teams: validation?.teams || [],
    });
    return;
  }

  if (action === 'logout') {
    removeConfigToken();
    printJson({ success: true });
    return;
  }

  fail(`Unknown auth command: ${action || '(missing)'}\n${usage()}`);
}

async function handleTeam(args, config) {
  const action = args._[1];
  if (action !== 'list') {
    fail(`Unknown team command: ${action || '(missing)'}\n${usage()}`);
  }

  const response = await requestJson(config, { endpoint: '/api/teams' });
  printJson(response);
}

async function handlePrompt(args, config) {
  const action = args._[1];
  const promptId = args._[2];
  const teamId = args.team;

  if (action === 'list') {
    const response = await requestJson(config, {
      endpoint: '/api/prompts',
      query: {
        tag: args.tag,
        search: args.search,
        page: args.page,
        limit: args.limit,
      },
      teamId,
    });
    printJson(response);
    return;
  }

  if (action === 'get') {
    requireValue(promptId, 'prompt get requires <id>');
    const response = await requestJson(config, {
      endpoint: `/api/prompts/${promptId}`,
      teamId,
    });
    printJson(response);
    return;
  }

  if (action === 'create') {
    const title = requireValue(args.title, '--title is required');
    const content = await resolvePromptContent(args);
    requireValue(content, 'prompt create requires content via --content, --content-file, or --stdin');

    const response = await requestJson(config, {
      method: 'POST',
      endpoint: '/api/prompts',
      body: {
        title,
        description: args.description,
        content,
        tags: args.tags,
        version: args.version,
      },
      teamId,
    });
    printJson(response);
    return;
  }

  if (action === 'update') {
    requireValue(promptId, 'prompt update requires <id>');
    const content = await resolvePromptContent(args);
    const body = {};

    if (args.title !== undefined) body.title = args.title;
    if (args.description !== undefined) body.description = args.description;
    if (content !== undefined) body.content = content;
    if (args.tags !== undefined) body.tags = args.tags;
    if (args.version !== undefined) body.version = args.version;

    if (Object.keys(body).length === 0) {
      fail('prompt update requires at least one field to change');
    }

    const response = await requestJson(config, {
      method: 'POST',
      endpoint: `/api/prompts/${promptId}`,
      body,
      teamId,
    });
    printJson(response);
    return;
  }

  if (action === 'delete') {
    requireValue(promptId, 'prompt delete requires <id>');
    ensureDeleteConfirmed(args);
    const response = await requestJson(config, {
      method: 'DELETE',
      endpoint: `/api/prompts/${promptId}`,
      teamId,
    });
    printJson(response);
    return;
  }

  fail(`Unknown prompt command: ${action || '(missing)'}\n${usage()}`);
}

async function handleTag(args, config) {
  const action = args._[1];
  const tagId = args._[2];
  const teamId = args.team;

  if (action === 'list') {
    const includePublic = args['include-public'];
    const response = await requestJson(config, {
      endpoint: '/api/tags',
      query: {
        includePublic,
      },
      teamId,
    });
    printJson(response);
    return;
  }

  if (action === 'create') {
    const name = requireValue(args.name, '--name is required');
    const response = await requestJson(config, {
      method: 'POST',
      endpoint: '/api/tags',
      body: {
        name,
        scope: teamId ? 'team' : 'personal',
      },
      teamId,
    });
    printJson(response);
    return;
  }

  if (action === 'update') {
    requireValue(tagId, 'tag update requires <id>');
    const name = requireValue(args.name, '--name is required');
    const response = await requestJson(config, {
      method: 'PATCH',
      endpoint: '/api/tags',
      query: { id: tagId },
      body: { name },
      teamId,
    });
    printJson(response);
    return;
  }

  if (action === 'delete') {
    requireValue(tagId, 'tag delete requires <id>');
    ensureDeleteConfirmed(args);
    const response = await requestJson(config, {
      method: 'DELETE',
      endpoint: '/api/tags',
      query: { id: tagId },
      teamId,
    });
    printJson(response);
    return;
  }

  fail(`Unknown tag command: ${action || '(missing)'}\n${usage()}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];

  if (!command || command === 'help' || args.help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(EXIT_CODES.SUCCESS);
  }

  if (command === 'auth') {
    await handleAuth(args);
    return;
  }

  const config = resolveRuntimeConfig(args);

  if (command === 'team') {
    await handleTeam(args, config);
    return;
  }

  if (command === 'prompt') {
    await handlePrompt(args, config);
    return;
  }

  if (command === 'tag') {
    await handleTag(args, config);
    return;
  }

  fail(`Unknown command: ${command}\n${usage()}`);
}

main().catch((error) => {
  fail(error.message, EXIT_CODES.BUSINESS_ERROR);
});
