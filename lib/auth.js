import { ApiError } from './api-error.js'
import { db } from './db.js'
import { cliTokens } from '@/drizzle/schema/index.js'
import { eq } from 'drizzle-orm'
import { authenticateCliToken, extractBearerToken } from './cli-token-auth.js'

export async function requireUserId(request) {
  // CLI token 优先
  const bearerToken = extractBearerToken(request)
  if (bearerToken) {
    const cliToken = await authenticateCliToken(db, bearerToken)
    if (!cliToken?.userId) {
      throw new ApiError(401, 'Authentication required')
    }
    await db.update(cliTokens).set({ lastUsedAt: new Date() }).where(eq(cliTokens.id, cliToken.id))
    return cliToken.userId
  }

  // Cookie 认证（password auth 模式）
  if (process.env.ADMIN_PASSWORD) {
    const cookieStore = request.cookies
    const adminCookie = cookieStore.get('pm_admin')
    if (adminCookie && adminCookie.value === process.env.ADMIN_PASSWORD) {
      return 'admin'
    }
  }

  // 未启用认证时返回 admin
  if (!process.env.ADMIN_PASSWORD) {
    return 'admin'
  }

  throw new ApiError(401, 'Authentication required')
}
