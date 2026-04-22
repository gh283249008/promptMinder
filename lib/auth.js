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

  // CLI token 也不存在 → 使用 admin password 认证
  // 管理员模式下，所有 API 调用都视为管理员
  if (!process.env.ADMIN_PASSWORD) {
    return 'admin'
  }

  throw new ApiError(401, 'Authentication required')
}
