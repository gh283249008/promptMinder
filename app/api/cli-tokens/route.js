import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db.js'
import { requireUserId } from '@/lib/auth.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { ApiError, assert } from '@/lib/api-error.js'
import { cliTokens } from '@/drizzle/schema/index.js'
import { hashCliToken } from '@/lib/cli-token-auth.js'

function createCliTokenValue() {
  return `pm_${crypto.randomBytes(24).toString('hex')}`
}

function sanitizeTokenName(value) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function serializeCliToken(row) {
  return {
    id: row.id,
    name: row.name,
    created_at: row.createdAt,
    last_used_at: row.lastUsedAt,
    revoked_at: row.revokedAt,
    is_revoked: Boolean(row.revokedAt),
  }
}

export async function GET() {
  try {
    const userId = await requireUserId()

    const rows = await db
      .select({
        id: cliTokens.id,
        name: cliTokens.name,
        createdAt: cliTokens.createdAt,
        lastUsedAt: cliTokens.lastUsedAt,
        revokedAt: cliTokens.revokedAt,
      })
      .from(cliTokens)
      .where(eq(cliTokens.userId, userId))
      .orderBy(desc(cliTokens.createdAt))

    return NextResponse.json({ tokens: rows.map(serializeCliToken) })
  } catch (error) {
    return handleApiError(error, 'Unable to load CLI tokens')
  }
}

export async function POST(request) {
  try {
    const userId = await requireUserId()
    const body = await request.json().catch(() => ({}))
    const name = sanitizeTokenName(body?.name)

    assert(name, 400, 'Token name is required')
    assert(name.length <= 80, 400, 'Token name must be 80 characters or fewer')

    const plainTextToken = createCliTokenValue()
    const tokenHash = hashCliToken(plainTextToken)

    const rows = await db
      .insert(cliTokens)
      .values({
        userId,
        name,
        tokenHash,
      })
      .returning({
        id: cliTokens.id,
        name: cliTokens.name,
        createdAt: cliTokens.createdAt,
        lastUsedAt: cliTokens.lastUsedAt,
        revokedAt: cliTokens.revokedAt,
      })

    const created = rows[0]
    if (!created) {
      throw new ApiError(500, 'Failed to create CLI token')
    }

    return NextResponse.json(
      {
        token: serializeCliToken(created),
        plain_text_token: plainTextToken,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error, 'Unable to create CLI token')
  }
}
