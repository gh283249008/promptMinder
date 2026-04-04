'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { SignInButton, useUser } from '@clerk/nextjs'
import { Terminal, Copy, Plus, KeyRound, Trash2, ExternalLink, Check } from 'lucide-react'
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
import { cn } from '@/lib/utils'

function formatDateTime(value) {
  if (!value) return '—'

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

function CopyButton({ text, label = '复制', className }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium border transition-all duration-150',
        copied
          ? 'bg-black text-white border-black'
          : 'bg-white text-black border-black hover:bg-black hover:text-white',
        className
      )}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? '已复制' : label}
    </button>
  )
}

export default function CliTokensPage() {
  const { isLoaded, isSignedIn } = useUser()
  const { toast } = useToast()
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
      toast({ title: '加载失败', description: message, variant: 'destructive' })
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
      toast({ title: '名称必填', description: '请先输入 token 名称，例如 agent-prod。', variant: 'destructive' })
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
      toast({ title: '创建成功', description: '明文 token 只会显示这一次，请立即复制保存。' })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : '无法创建 CLI token'
      toast({ title: '创建失败', description: message, variant: 'destructive' })
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
      toast({ title: '已吊销', description: `Token "${revokeTarget.name}" 已失效。` })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : '无法吊销 CLI token'
      toast({ title: '吊销失败', description: message, variant: 'destructive' })
    } finally {
      setRevokingId(null)
      setRevokeTarget(null)
    }
  }, [revokeTarget, toast])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 font-mono text-sm text-black/40">
          <span className="inline-block w-2 h-2 bg-black animate-pulse" />
          initializing...
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md border border-black">
          <div className="border-b border-black px-6 py-4 flex items-center gap-3">
            <Terminal className="h-4 w-4 text-black" />
            <span className="font-mono text-sm font-medium tracking-widest uppercase">CLI Tokens</span>
          </div>
          <div className="px-6 py-8 space-y-6">
            <div className="space-y-2">
              <p className="font-mono text-xs text-black/50 uppercase tracking-widest">Access Required</p>
              <p className="text-sm text-black/70 leading-relaxed">
                登录后即可自助创建、查看和吊销 PromptMinder CLI token。
              </p>
            </div>
            <div className="flex items-center gap-3">
              <SignInButton mode="modal" redirectUrl="/settings/cli-tokens">
                <button className="px-4 py-2 bg-black text-white text-sm font-mono font-medium hover:bg-black/80 transition-colors">
                  登录后继续
                </button>
              </SignInButton>
              <Link
                href="https://www.prompt-minder.com"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-black text-sm font-mono font-medium hover:bg-black hover:text-white transition-colors"
              >
                官网
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        {/* Page Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-3.5 w-3.5 text-black/40" />
            <span className="font-mono text-xs text-black/40 uppercase tracking-widest">Settings</span>
          </div>
          <div className="flex items-end gap-4">
            <h1 className="text-4xl font-bold tracking-tight text-black leading-none">CLI Tokens</h1>
            <div className="mb-1 flex items-center gap-1.5 pb-0.5">
              <span className="block w-1.5 h-1.5 bg-black animate-pulse" />
              <span className="font-mono text-xs text-black/40">secure</span>
            </div>
          </div>
          <p className="text-sm text-black/55 max-w-xl leading-relaxed">
            每个 token 代表你的账户权限。新 token 只会显示一次，适合给本地 CLI、自动化脚本和 AI agent 使用。
          </p>
        </div>

        {/* Create Token */}
        <section className="border border-black">
          <div className="border-b border-black px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-mono text-sm font-semibold tracking-wide uppercase">创建新 Token</h2>
              <p className="mt-0.5 font-mono text-xs text-black/45">
                建议一个 agent 配一个 token，用名称区分环境或用途
              </p>
            </div>
            <Plus className="h-4 w-4 text-black/30" />
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="agent-prod"
                maxLength={80}
                className="flex-1 px-3 py-2 border border-black font-mono text-sm bg-white text-black placeholder:text-black/30 outline-none focus:bg-black/[0.02] transition-colors"
              />
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-black text-white font-mono text-sm font-medium hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" />
                {isCreating ? '创建中...' : '创建 Token'}
              </button>
            </div>

            {newSecret && (
              <div className="border border-black">
                {/* Warning header */}
                <div className="bg-black text-white px-5 py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-mono text-xs font-semibold uppercase tracking-widest">⚠ 请立即保存明文 Token</p>
                    <p className="font-mono text-xs text-white/60">此值不会再次显示，请放进环境变量或密钥管理系统</p>
                  </div>
                  <CopyButton text={newSecret} label="复制 Token" className="border-white text-white bg-transparent hover:bg-white hover:text-black" />
                </div>

                {/* Token value */}
                <div className="bg-[#0a0a0a] px-5 py-4">
                  <pre className="font-mono text-xs text-white/90 overflow-x-auto whitespace-pre-wrap break-all">
                    <code>{newSecret}</code>
                  </pre>
                </div>

                {/* Quick setup */}
                <div className="border-t border-black px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs font-semibold uppercase tracking-wide text-black">快速配置命令</p>
                      <p className="font-mono text-xs text-black/45 mt-0.5">CLI 默认连接 https://www.prompt-minder.com</p>
                    </div>
                    <CopyButton text={installSnippet} label="复制命令" />
                  </div>
                  <div className="bg-[#0a0a0a] px-5 py-4">
                    <pre className="font-mono text-xs text-white/90 overflow-x-auto">
                      <code>{installSnippet}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Token List */}
        <section className="border border-black">
          <div className="border-b border-black px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-mono text-sm font-semibold tracking-wide uppercase">现有 Tokens</h2>
              <p className="mt-0.5 font-mono text-xs text-black/45">已吊销 token 立即失效，列表保留历史记录</p>
            </div>
            {!isLoading && tokens.length > 0 && (
              <span className="font-mono text-xs text-black/40">{tokens.length} 个</span>
            )}
          </div>

          {isLoading ? (
            <div className="px-6 py-12 flex items-center gap-3">
              <span className="block w-1.5 h-1.5 bg-black animate-pulse" />
              <span className="font-mono text-xs text-black/40">loading...</span>
            </div>
          ) : tokens.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Terminal className="h-8 w-8 text-black/15 mx-auto mb-4" />
              <p className="font-mono text-sm text-black/40">还没有 CLI token</p>
              <p className="font-mono text-xs text-black/30 mt-1">
                先创建一个，然后执行 <code className="bg-black/5 px-1">promptminder auth login</code>
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/10">
              {tokens.map((token, index) => (
                <div
                  key={token.id}
                  className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:bg-black/[0.02] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <span className="font-mono text-xs text-black/20 mt-0.5 w-5 text-right shrink-0 select-none">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-black">{token.name}</span>
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest border',
                            token.is_revoked
                              ? 'border-black/20 text-black/35 bg-transparent'
                              : 'border-black bg-black text-white'
                          )}
                        >
                          {token.is_revoked ? '已吊销' : '生效中'}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-black/40 flex flex-wrap gap-x-5 gap-y-1">
                        <span>创建 {formatDateTime(token.created_at)}</span>
                        <span>最近使用 {formatDateTime(token.last_used_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pl-9 sm:pl-0 shrink-0">
                    {!token.is_revoked && (
                      <button
                        disabled={revokingId === token.id}
                        onClick={() => setRevokeTarget(token)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-black/30 font-mono text-xs text-black/60 hover:border-black hover:text-black hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                      >
                        <Trash2 className="h-3 w-3" />
                        {revokingId === token.id ? '吊销中...' : '吊销'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* How to use */}
        <section className="border border-black">
          <div className="border-b border-black px-6 py-4">
            <h2 className="font-mono text-sm font-semibold tracking-wide uppercase">如何使用</h2>
          </div>
          <div className="px-6 py-5">
            <ol className="space-y-0 divide-y divide-black/8">
              {[
                {
                  step: '01',
                  text: '安装 CLI',
                  code: 'npm i -g @aircrushin/promptminder-cli',
                },
                {
                  step: '02',
                  text: '创建 Token',
                  desc: '在上方表单输入名称，点击「创建 Token」',
                },
                {
                  step: '03',
                  text: '配置认证',
                  code: 'promptminder auth login --token <YOUR_TOKEN>',
                },
                {
                  step: '04',
                  text: '验证连接',
                  code: 'promptminder team list',
                },
              ].map(({ step, text, code, desc }) => (
                <div key={step} className="flex items-start gap-5 py-4">
                  <span className="font-mono text-2xl font-bold text-black/10 leading-none shrink-0 w-8">{step}</span>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <p className="font-mono text-xs font-semibold uppercase tracking-wide text-black">{text}</p>
                    {code && (
                      <div className="flex items-center gap-3">
                        <code className="font-mono text-xs text-black/70 bg-black/5 px-2 py-1 flex-1 min-w-0 overflow-x-auto">
                          {code}
                        </code>
                        <CopyButton text={code} label="复制" />
                      </div>
                    )}
                    {desc && <p className="font-mono text-xs text-black/45">{desc}</p>}
                  </div>
                </div>
              ))}
            </ol>
          </div>
        </section>

      </div>

      {/* Revoke Dialog */}
      <AlertDialog open={Boolean(revokeTarget)} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent className="border border-black rounded-none shadow-none p-0 gap-0 max-w-md">
          <AlertDialogHeader className="border-b border-black px-6 py-5 space-y-1">
            <AlertDialogTitle className="font-mono text-sm font-semibold uppercase tracking-wide">
              确认吊销 Token？
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs text-black/55 leading-relaxed">
              吊销后，此 token 将无法继续调用 CLI 和 agent 封装能力。此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="px-6 py-4 flex flex-row items-center gap-3">
            <AlertDialogCancel className="flex-1 py-2 border border-black/30 font-mono text-xs text-black/60 hover:border-black hover:text-black hover:bg-transparent bg-transparent rounded-none shadow-none transition-colors">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="flex-1 py-2 bg-black text-white font-mono text-xs hover:bg-black/80 rounded-none shadow-none transition-colors"
            >
              确认吊销
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
