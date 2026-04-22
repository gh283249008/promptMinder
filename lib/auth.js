import { auth } from '@clerk/nextjs/server'
import { ApiError } from './api-error.js'
import { db } from './db.js'
import { cliTokens } from '@/drizzle/schema/index.js'
import { eq } from 'drizzle-orm'
import { authenticateCliToken, extractBearerToken } from './cli-token-auth.js'

export async function requireUserId(request) {
  const bearerToken = extractBearerToken(request)
  if (bearerToken) {
    const cliToken = await authenticateCliToken(db, bearerToken)

    if (!cliToken?.userId) {
      throw new ApiError(401, 'Authentication required')
    }

    await db
      .update(cliTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(cliTokens.id, cliToken.id))

    return cliToken.userId
  }

  const { userId } = await auth()
  if (!userId) {
    throw new ApiError(401, 'Authentication required')
  }
  return userId
}
