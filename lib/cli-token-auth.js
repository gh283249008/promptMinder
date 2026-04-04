import crypto from 'crypto'
import { and, eq, isNull } from 'drizzle-orm'
import { cliTokens } from '@/drizzle/schema/index.js'

export function hashCliToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function extractBearerToken(request) {
  const headerValue = request?.headers?.get?.('authorization') || request?.headers?.get?.('Authorization')
  if (!headerValue) {
    return null
  }

  const match = headerValue.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    return null
  }

  const token = match[1].trim()
  return token || null
}

export async function authenticateCliToken(db, token) {
  if (!token) {
    return null
  }

  const tokenHash = hashCliToken(token)
  const rows = await db
    .select({
      id: cliTokens.id,
      userId: cliTokens.userId,
    })
    .from(cliTokens)
    .where(and(eq(cliTokens.tokenHash, tokenHash), isNull(cliTokens.revokedAt)))
    .limit(1)

  return rows[0] || null
}
