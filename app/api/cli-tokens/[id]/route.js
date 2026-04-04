import { NextResponse } from 'next/server'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db.js'
import { requireUserId } from '@/lib/auth.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { ApiError } from '@/lib/api-error.js'
import { cliTokens } from '@/drizzle/schema/index.js'

async function getTokenId(paramsPromise) {
  const { id } = await paramsPromise
  if (!id) {
    throw new Error('CLI token id missing in route params')
  }
  return id
}

export async function DELETE(_request, { params }) {
  try {
    const userId = await requireUserId()
    const tokenId = await getTokenId(params)

    const rows = await db
      .update(cliTokens)
      .set({ revokedAt: new Date() })
      .where(and(
        eq(cliTokens.id, tokenId),
        eq(cliTokens.userId, userId),
        isNull(cliTokens.revokedAt)
      ))
      .returning({ id: cliTokens.id })

    if (!rows[0]) {
      throw new ApiError(404, 'CLI token not found')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'Unable to revoke CLI token')
  }
}
