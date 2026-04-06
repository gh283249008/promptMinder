import { config as loadEnv } from 'dotenv'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

loadEnv({ path: '.env.local' })
loadEnv()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const MIGRATIONS_FOLDER = path.join(ROOT, 'drizzle', 'migrations')
const JOURNAL_PATH = path.join(MIGRATIONS_FOLDER, 'meta', '_journal.json')

function readMigrationFiles () {
  if (!fs.existsSync(JOURNAL_PATH)) {
    throw new Error(`Can't find meta/_journal.json at ${JOURNAL_PATH}`)
  }
  const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, 'utf8'))
  const migrations = []
  for (const entry of journal.entries) {
    const migrationPath = path.join(MIGRATIONS_FOLDER, `${entry.tag}.sql`)
    const query = fs.readFileSync(migrationPath, 'utf8')
    const sqlChunks = query
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean)
    const hash = crypto.createHash('sha256').update(query).digest('hex')
    migrations.push({
      tag: entry.tag,
      sql: sqlChunks,
      folderMillis: entry.when,
      hash
    })
  }
  return migrations
}

function parseBaselineThroughTag () {
  const i = process.argv.indexOf('--through')
  if (i === -1 || !process.argv[i + 1]) {
    return null
  }
  return process.argv[i + 1]
}

const baselineOnly = process.argv.includes('--baseline')
const throughTag = parseBaselineThroughTag()

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Define it in .env or .env.local.')
  process.exit(1)
}

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  onnotice: () => {}
})

function formatBaselineHint (journalTags) {
  return (
    'This database already has tables from an older setup, but drizzle.__drizzle_migrations does not list the matching migration hashes.\n' +
    'Record history up to the last migration your schema already reflects, then migrate again:\n' +
    `  pnpm db:baseline -- --through 0002_team_prompt_workflow\n` +
    'Then:\n' +
    '  pnpm db:migrate\n' +
    `Journal tags: ${journalTags.join(', ')}`
  )
}

try {
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `

  let migrations = readMigrationFiles()
  const journalTags = migrations.map((m) => m.tag)

  if (baselineOnly) {
    if (!throughTag) {
      console.error(
        'Baseline requires a journal tag so unapplied migrations are not marked done.\n' +
          'Example: pnpm db:baseline -- --through 0002_team_prompt_workflow\n' +
          'Then run: pnpm db:migrate'
      )
      process.exit(1)
    }
    const cut = migrations.findIndex((m) => m.tag === throughTag)
    if (cut === -1) {
      console.error(`Unknown migration tag "${throughTag}". Journal tags: ${migrations.map((m) => m.tag).join(', ')}`)
      process.exit(1)
    }
    migrations = migrations.slice(0, cut + 1)
    for (const m of migrations) {
      const existing = await sql`
        select 1 from drizzle.__drizzle_migrations where hash = ${m.hash} limit 1
      `
      if (existing.length > 0) {
        continue
      }
      await sql`
        insert into drizzle.__drizzle_migrations ("hash", "created_at")
        values (${m.hash}, ${m.folderMillis})
      `
      console.log(`Baseline recorded: ${m.tag}`)
    }
    console.log('Baseline completed. Run pnpm db:migrate to apply any newer migrations.')
  } else {
    for (let i = 0; i < migrations.length; i++) {
      const m = migrations[i]
      const existing = await sql`
        select 1 from drizzle.__drizzle_migrations where hash = ${m.hash} limit 1
      `
      if (existing.length > 0) {
        continue
      }
      if (i === 0) {
        const [row] = await sql`
          select exists (
            select 1 from information_schema.tables
            where table_schema = 'public' and table_name = 'favorites'
          ) as exists
        `
        if (row?.exists) {
          console.error(formatBaselineHint(journalTags))
          process.exit(1)
        }
      }
      console.log(`Applying migration ${m.tag}...`)
      try {
        await sql.begin(async (tx) => {
          for (const stmt of m.sql) {
            await tx.unsafe(stmt)
          }
          await tx`
            insert into drizzle.__drizzle_migrations ("hash", "created_at")
            values (${m.hash}, ${m.folderMillis})
          `
        })
      } catch (e) {
        if (e && e.code === '42P07') {
          console.error(e.message)
          console.error(formatBaselineHint(journalTags))
          process.exit(1)
        }
        throw e
      }
    }
    console.log('Migration completed successfully.')
  }
} finally {
  await sql.end({ timeout: 5 })
}
