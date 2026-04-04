'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { SignInButton, useUser } from '@clerk/nextjs'
import { Terminal, Copy, Plus, KeyRound, Trash2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { apiClient, ApiError } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { useClipboard } from '@/lib/clipboard'

function formatDateTime(value) {
  if (!value) return '未使用'

  try {
    return new Date(value).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(value)
  }
}

function buildInstallSnippet(token) {
  return [
    `export PROMPTMINDER_TOKEN=${token}`,
    `promptminder auth login --token ${token}`,
    'promptminder team list',
  ].join('\n')
}

export default function CliTokensPage() {
  const { isLoaded, isSignedIn } = useUser()
  const { toast } = useToast()
  const { copy } = useClipboard('已复制到剪贴板', '复制失败')
  const [tokens, setTokens] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [revokingId, setRevokingId] = useState(null)
  const [name, setName] = useState('agent-prod')
  const [newSecret, setNewSecret] = useState(null)
  const [revokeTarget, setRevokeTarget] = useState(null)

  const installSnippet = useMemo(() => {
    if (!newSecret) return ''
    return buildInstallSnippet(newSecret)
  }, [newSecret])

  const loadTokens = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await apiClient.getCliTokens()
      setTokens(Array.isArray(result?.tokens) ? result.tokens : [])
    } catch (error) {
      const message = error instanceof ApiError ? error.message : '无法加载 CLI tokens'
      toast({
        title: '加载失败',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setIsLoading(false)
      return
    }
    loadTokens()
  }, [isLoaded, isSignedIn, loadTokens])

  const handleCreate = useCallback(async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast({
        title: '名称必填',
        description: '请先输入 token 名称，例如 agent-prod。',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)
    try {
      const result = await apiClient.createCliToken(trimmedName)
      setNewSecret(result?.plain_text_token || null)
      setTokens((prev) => {
        const nextToken = result?.token
        if (!nextToken) return prev
        return [nextToken, ...prev]
      })
      setName('agent-prod')
      toast({
        title: '创建成功',
        description: '明文 token 只会显示这一次，请立即复制保存。',
      })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : '无法创建 CLI token'
      toast({
        title: '创建失败',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }, [name, toast])

  const handleRevoke = useCallback(async () => {
    if (!revokeTarget) return

    setRevokingId(revokeTarget.id)
    try {
      await apiClient.revokeCliToken(revokeTarget.id)
      setTokens((prev) => prev.map((token) => (
        token.id === revokeTarget.id
          ? { ...token, revoked_at: new Date().toISOString(), is_revoked: true }
          : token
      )))
      toast({
        title: '已吊销',
        description: `Token "${revokeTarget.name}" 已失效。`,
      })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : '无法吊销 CLI token'
      toast({
        title: '吊销失败',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setRevokingId(null)
      setRevokeTarget(null)
    }
  }, [revokeTarget, toast])

  if (!isLoaded) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">Loading...</CardContent>
        </Card>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Terminal className="h-5 w-5" />
              CLI Tokens
            </CardTitle>
            <CardDescription>
              登录后即可自助创建、查看和吊销 PromptMinder CLI token。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <SignInButton mode="modal" redirectUrl="/settings/cli-tokens">
              <Button>登录后继续</Button>
            </SignInButton>
            <Button asChild variant="outline">
              <Link href="https://www.prompt-minder.com" target="_blank">
                打开官网
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <KeyRound className="h-4 w-4" />
          Settings
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">CLI Tokens</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          每个 token 都代表你的账户权限。新 token 只会显示一次，适合给本地 CLI、自动化脚本和 AI agent 使用。
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>创建新 token</CardTitle>
          <CardDescription>
            建议一个 agent 或集成一个 token，名称用环境或用途区分，例如 `agent-prod`、`cursor-dev`。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="agent-prod"
              maxLength={80}
            />
            <Button onClick={handleCreate} disabled={isCreating}>
              <Plus className="h-4 w-4" />
              {isCreating ? '创建中...' : '创建 token'}
            </Button>
          </div>

          {newSecret && (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-amber-950">请立即保存明文 token</p>
                  <p className="text-sm text-amber-900">
                    出于安全原因，这段值不会再次显示。复制后请放进环境变量或密钥管理系统。
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => copy(newSecret)}>
                  <Copy className="h-4 w-4" />
                  复制
                </Button>
              </div>

              <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
                <code>{newSecret}</code>
              </pre>

              <Separator />

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">推荐的环境变量配置</p>
                  <p className="text-sm text-muted-foreground">
                    现在只需要配置 token。CLI 会默认连接 `https://www.prompt-minder.com`。
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => copy(installSnippet)}>
                  <Copy className="h-4 w-4" />
                  复制命令
                </Button>
              </div>

              <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
                <code>{installSnippet}</code>
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>现有 tokens</CardTitle>
          <CardDescription>
            已吊销 token 会立即失效。为了便于审计，列表会保留历史记录。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-sm text-muted-foreground">正在加载...</div>
          ) : tokens.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
              还没有 CLI token。先创建一个，然后在命令行里执行 `promptminder auth login` 或配置环境变量。
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{token.name}</span>
                      <Badge variant={token.is_revoked ? 'outline' : 'success'}>
                        {token.is_revoked ? '已吊销' : '生效中'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>创建时间：{formatDateTime(token.created_at)}</p>
                      <p>最近使用：{formatDateTime(token.last_used_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!token.is_revoked && (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={revokingId === token.id}
                        onClick={() => setRevokeTarget(token)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {revokingId === token.id ? '吊销中...' : '吊销'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>如何使用</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. 安装 CLI：`npm i -g @aircrushin/promptminder-cli`</p>
          <p>2. 打开这个页面创建 token</p>
          <p>3. 在命令行里设置 `PROMPTMINDER_TOKEN`，或执行 `promptminder auth login --token ...`</p>
          <p>4. 运行 `promptminder team list` 或 `promptminder prompt list` 验证即可</p>
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(revokeTarget)} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认吊销 token？</AlertDialogTitle>
            <AlertDialogDescription>
              吊销后，这个 token 将无法继续调用 CLI 和 agent 封装能力。这个操作不能恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke}>
              确认吊销
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
