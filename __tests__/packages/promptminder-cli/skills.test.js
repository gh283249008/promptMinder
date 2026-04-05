/**
 * @jest-environment node
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

// Resolve the module from the workspace root since Jest runs from there
const cliModule = require('../../../packages/promptminder-cli/lib/cli');
const {
  parseFrontmatter,
  listBundledSkills,
  resolveTargetDir,
  handleSkills,
  BUNDLED_SKILLS_DIR,
} = cliModule;

// ---------------------------------------------------------------------------
// parseFrontmatter
// ---------------------------------------------------------------------------
describe('parseFrontmatter', () => {
  it('应该解析有效的YAML frontmatter', () => {
    const text = '---\nname: my-skill\ndescription: Use when foo.\n---\n\n# Body';
    const fm = parseFrontmatter(text);
    expect(fm.name).toBe('my-skill');
    expect(fm.description).toBe('Use when foo.');
  });

  it('应该在没有frontmatter时返回空对象', () => {
    expect(parseFrontmatter('# No frontmatter here')).toEqual({});
  });

  it('应该去除值两侧的引号', () => {
    const text = "---\nname: 'quoted-name'\n---";
    expect(parseFrontmatter(text).name).toBe('quoted-name');
  });
});

// ---------------------------------------------------------------------------
// listBundledSkills
// ---------------------------------------------------------------------------
describe('listBundledSkills', () => {
  it('应该返回至少一个包含SKILL.md的技能目录', () => {
    const skills = listBundledSkills();
    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBeGreaterThan(0);
    skills.forEach((name) => {
      const skillFile = path.join(BUNDLED_SKILLS_DIR, name, 'SKILL.md');
      expect(fs.existsSync(skillFile)).toBe(true);
    });
  });

  it('应该包含 promptminder-cli 技能', () => {
    const skills = listBundledSkills();
    expect(skills).toContain('promptminder-cli');
  });
});

// ---------------------------------------------------------------------------
// resolveTargetDir
// ---------------------------------------------------------------------------
describe('resolveTargetDir', () => {
  const home = os.homedir();
  let originalExit;
  let originalStderr;

  beforeEach(() => {
    originalExit = process.exit.bind(process);
    originalStderr = process.stderr.write.bind(process.stderr);
    process.stderr.write = () => {};
    process.exit = (code) => { throw new Error(`process.exit(${code})`); };
  });

  afterEach(() => {
    process.exit = originalExit;
    process.stderr.write = originalStderr;
  });

  it('cursor-user 应该解析到 ~/.cursor/skills', () => {
    expect(resolveTargetDir('cursor-user')).toBe(path.join(home, '.cursor', 'skills'));
  });

  it('cursor-project 应该解析到 ./.cursor/skills', () => {
    const cwd = '/some/project';
    expect(resolveTargetDir('cursor-project', cwd)).toBe(path.join(cwd, '.cursor', 'skills'));
  });

  it('claude 应该解析到 ~/.claude/skills', () => {
    expect(resolveTargetDir('claude')).toBe(path.join(home, '.claude', 'skills'));
  });

  it('codex 应该解析到 ~/.agents/skills', () => {
    expect(resolveTargetDir('codex')).toBe(path.join(home, '.agents', 'skills'));
  });

  it('未知 target 应该调用fail并退出', () => {
    expect(() => resolveTargetDir('unknown')).toThrow(/process\.exit/);
  });
});

// ---------------------------------------------------------------------------
// handleSkills — skills list
// ---------------------------------------------------------------------------
describe('handleSkills list', () => {
  let output;
  let originalWrite;
  let originalExit;

  beforeEach(() => {
    output = '';
    originalWrite = process.stdout.write.bind(process.stdout);
    originalExit = process.exit.bind(process);
    process.stdout.write = (chunk) => { output += chunk; };
    process.exit = (code) => { throw new Error(`process.exit(${code})`); };
  });

  afterEach(() => {
    process.stdout.write = originalWrite;
    process.exit = originalExit;
  });

  it('应该以JSON格式输出技能列表，包含name和description', () => {
    handleSkills({ _: ['skills', 'list'] });
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed.skills)).toBe(true);
    const pm = parsed.skills.find((s) => s.name === 'promptminder-cli');
    expect(pm).toBeDefined();
    expect(typeof pm.description).toBe('string');
    expect(pm.description.startsWith('Use when')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// handleSkills — skills path
// ---------------------------------------------------------------------------
describe('handleSkills path', () => {
  let output;
  let originalWrite;
  let originalExit;

  beforeEach(() => {
    output = '';
    originalWrite = process.stdout.write.bind(process.stdout);
    originalExit = process.exit.bind(process);
    process.stdout.write = (chunk) => { output += chunk; };
    process.exit = (code) => { throw new Error(`process.exit(${code})`); };
  });

  afterEach(() => {
    process.stdout.write = originalWrite;
    process.exit = originalExit;
  });

  it('应该输出包含skills_dir字段的JSON', () => {
    handleSkills({ _: ['skills', 'path'] });
    const parsed = JSON.parse(output);
    expect(typeof parsed.skills_dir).toBe('string');
    expect(fs.existsSync(parsed.skills_dir)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// handleSkills — skills install (into a temp dir)
// ---------------------------------------------------------------------------
describe('handleSkills install', () => {
  let tmpDir;
  let output;
  let originalWrite;
  let originalExit;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-skill-test-'));
    output = '';
    originalWrite = process.stdout.write.bind(process.stdout);
    originalExit = process.exit.bind(process);
    process.stdout.write = (chunk) => { output += chunk; };
    process.exit = (code) => { throw new Error(`process.exit(${code})`); };
  });

  afterEach(() => {
    process.stdout.write = originalWrite;
    process.exit = originalExit;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function makeArgs(extra = {}) {
    return {
      _: ['skills', 'install'],
      target: 'cursor-user',
      ...extra,
    };
  }

  it('应该将技能复制到目标目录并输出success:true', () => {
    // Monkey-patch resolveTargetDir by intercepting at a lower level:
    // pass through --target but override the resolved dir via process.cwd trick —
    // instead, test via direct fs comparison using BUNDLED_SKILLS_DIR.

    // Use a real cursor-project target scoped to tmpDir to stay isolated.
    const args = { _: ['skills', 'install'], target: 'cursor-project', force: true };

    // We need to intercept resolveTargetDir. Since handleSkills is a closure over
    // the module-internal function, the simplest approach is to spy on process.cwd.
    const origCwd = process.cwd.bind(process);
    process.cwd = () => tmpDir;

    try {
      handleSkills(args);
    } finally {
      process.cwd = origCwd;
    }

    const parsed = JSON.parse(output);
    expect(parsed.success).toBe(true);
    expect(Array.isArray(parsed.installed)).toBe(true);
    expect(parsed.installed).toContain('promptminder-cli');

    const installedSkillFile = path.join(tmpDir, '.cursor', 'skills', 'promptminder-cli', 'SKILL.md');
    expect(fs.existsSync(installedSkillFile)).toBe(true);
  });

  it('已存在的技能不传--force应被跳过并提示', () => {
    const origCwd = process.cwd.bind(process);
    process.cwd = () => tmpDir;

    // First install
    try { handleSkills({ _: ['skills', 'install'], target: 'cursor-project', force: true }); } finally {}
    output = '';

    // Second install without --force
    try {
      handleSkills({ _: ['skills', 'install'], target: 'cursor-project' });
    } finally {
      process.cwd = origCwd;
    }

    const parsed = JSON.parse(output);
    expect(parsed.success).toBe(true);
    expect(parsed.installed).toEqual([]);
    expect(parsed.skipped).toContain('promptminder-cli');
    expect(typeof parsed.hint).toBe('string');
  });

  it('--force应覆盖已存在的技能', () => {
    const origCwd = process.cwd.bind(process);
    process.cwd = () => tmpDir;

    try {
      handleSkills({ _: ['skills', 'install'], target: 'cursor-project', force: true });
      output = '';
      handleSkills({ _: ['skills', 'install'], target: 'cursor-project', force: true });
    } finally {
      process.cwd = origCwd;
    }

    const parsed = JSON.parse(output);
    expect(parsed.installed).toContain('promptminder-cli');
    expect(parsed.skipped).toBeUndefined();
  });

  it('指定--skill参数只安装该技能', () => {
    const origCwd = process.cwd.bind(process);
    process.cwd = () => tmpDir;

    try {
      handleSkills({ _: ['skills', 'install'], target: 'cursor-project', skill: 'promptminder-cli', force: true });
    } finally {
      process.cwd = origCwd;
    }

    const parsed = JSON.parse(output);
    expect(parsed.installed).toEqual(['promptminder-cli']);
  });

  it('指定不存在的--skill应报错', () => {
    const origCwd = process.cwd.bind(process);
    process.cwd = () => tmpDir;

    let stderrOutput = '';
    const origStderr = process.stderr.write.bind(process.stderr);
    process.stderr.write = (chunk) => { stderrOutput += chunk; };

    let exitCode = null;
    process.exit = (code) => { exitCode = code; throw new Error(`exit:${code}`); };

    try {
      handleSkills({ _: ['skills', 'install'], target: 'cursor-project', skill: 'nonexistent-skill' });
    } catch (_) {
      // expected exit
    } finally {
      process.cwd = origCwd;
      process.stderr.write = origStderr;
    }

    const errParsed = JSON.parse(stderrOutput);
    expect(errParsed.error.message).toMatch(/nonexistent-skill/);
    expect(exitCode).toBe(1);
  });
});
