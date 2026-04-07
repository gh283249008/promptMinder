import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CliTokensPage from '@/app/settings/cli-tokens/page';
import { useUser } from '@clerk/nextjs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';

jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
  SignInButton: ({ children }) => children,
}));

jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getCliTokens: jest.fn(),
    createCliToken: jest.fn(),
    revokeCliToken: jest.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

jest.mock('next/link', () => {
  return ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>;
});

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }) => <div>{children}</div>,
  AlertDialogAction: ({ children, ...props }) => <button {...props}>{children}</button>,
  AlertDialogCancel: ({ children, ...props }) => <button {...props}>{children}</button>,
  AlertDialogContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  AlertDialogDescription: ({ children, ...props }) => <div {...props}>{children}</div>,
  AlertDialogFooter: ({ children, ...props }) => <div {...props}>{children}</div>,
  AlertDialogHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
  AlertDialogTitle: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

jest.mock('lucide-react', () => ({
  Terminal: (props) => <svg data-testid="terminal-icon" {...props} />,
  Copy: (props) => <svg data-testid="copy-icon" {...props} />,
  Plus: (props) => <svg data-testid="plus-icon" {...props} />,
  KeyRound: (props) => <svg data-testid="key-icon" {...props} />,
  Trash2: (props) => <svg data-testid="trash-icon" {...props} />,
  ExternalLink: (props) => <svg data-testid="external-link-icon" {...props} />,
  Check: (props) => <svg data-testid="check-icon" {...props} />,
}));

describe('CLI Tokens page', () => {
  const toast = jest.fn();

  const englishTranslations = {
    cliTokens: {
      pageBadge: 'Settings',
      pageTitle: 'CLI Tokens',
      pageStatus: 'secure',
      pageDescription: 'Each token carries your account permissions. New tokens are shown once and work well for local CLI usage, automation scripts, and AI agents.',
      createTitle: 'Create new token',
      createDescription: 'Use one token per agent so you can distinguish environments and purposes by name.',
      createAction: 'Create token',
      creatingAction: 'Creating...',
      revealTitle: 'Save the plain-text token now',
      revealDescription: 'This value will not be shown again. Put it in an environment variable or a secret manager.',
      copyToken: 'Copy token',
      copyCommand: 'Copy commands',
      docsAction: 'Full CLI docs',
      quickSetupTitle: 'Quick setup commands',
      quickSetupDescription: 'The CLI connects to https://www.prompt-minder.com by default.',
      listTitle: 'Existing tokens',
      listDescription: 'Revoked tokens stop working immediately, and the list keeps the history.',
      listCount: '{count} tokens',
      listLoading: 'loading...',
      emptyTitle: 'No CLI tokens yet',
      emptyDescriptionPrefix: 'Create one first, then run',
      statusActive: 'Active',
      statusRevoked: 'Revoked',
      createdAt: 'Created {value}',
      lastUsedAt: 'Last used {value}',
      revokeAction: 'Revoke',
      revokingAction: 'Revoking...',
      howToUseTitle: 'How to use',
      steps: [
        { step: '01', text: 'Install CLI', code: 'npm i -g @aircrushin/promptminder-cli' },
        { step: '02', text: 'Create token', desc: 'Enter a name in the form above, then click "Create token".' },
        { step: '03', text: 'Authenticate', code: 'promptminder auth login --token <YOUR_TOKEN>' },
        { step: '04', text: 'Verify the connection', code: 'promptminder team list' },
      ],
      dialogTitle: 'Revoke this token?',
      dialogDescription: 'After revocation, this token can no longer access the CLI or agent wrapper. This action cannot be undone.',
      dialogCancel: 'Cancel',
      dialogConfirm: 'Confirm revoke',
      authTitle: 'Access required',
      authDescription: 'Sign in to create, inspect, and revoke PromptMinder CLI tokens.',
      authAction: 'Sign in to continue',
      officialSite: 'Website',
      loadingState: 'initializing...',
    },
    common: {
      copy: 'Copy',
      copied: 'Copied',
      loading: 'Loading...',
    },
  };

  const chineseTranslations = {
    cliTokens: {
      pageBadge: '设置',
      pageTitle: 'CLI Tokens',
      pageStatus: 'secure',
      pageDescription: '每个 token 代表你的账户权限。新 token 只会显示一次，适合给本地 CLI、自动化脚本和 AI agent 使用。',
      createTitle: '创建新 Token',
      createDescription: '建议一个 agent 配一个 token，用名称区分环境或用途',
      createAction: '创建 Token',
      creatingAction: '创建中...',
      revealTitle: '请立即保存明文 Token',
      revealDescription: '此值不会再次显示，请放进环境变量或密钥管理系统',
      copyToken: '复制 Token',
      copyCommand: '复制命令',
      docsAction: '查看完整文档',
      quickSetupTitle: '快速配置命令',
      quickSetupDescription: 'CLI 默认连接 https://www.prompt-minder.com',
      listTitle: '现有 Tokens',
      listDescription: '已吊销 token 立即失效，列表保留历史记录',
      listCount: '{count} 个',
      listLoading: 'loading...',
      emptyTitle: '还没有 CLI token',
      emptyDescriptionPrefix: '先创建一个，然后执行',
      statusActive: '生效中',
      statusRevoked: '已吊销',
      createdAt: '创建 {value}',
      lastUsedAt: '最近使用 {value}',
      revokeAction: '吊销',
      revokingAction: '吊销中...',
      howToUseTitle: '如何使用',
      steps: [
        { step: '01', text: '安装 CLI', code: 'npm i -g @aircrushin/promptminder-cli' },
        { step: '02', text: '创建 Token', desc: '在上方表单输入名称，点击「创建 Token」' },
        { step: '03', text: '配置认证', code: 'promptminder auth login --token <YOUR_TOKEN>' },
        { step: '04', text: '验证连接', code: 'promptminder team list' },
      ],
      dialogTitle: '确认吊销 Token？',
      dialogDescription: '吊销后，此 token 将无法继续调用 CLI 和 agent 封装能力。此操作不可恢复。',
      dialogCancel: '取消',
      dialogConfirm: '确认吊销',
      authTitle: 'Access Required',
      authDescription: '登录后即可自助创建、查看和吊销 PromptMinder CLI token。',
      authAction: '登录后继续',
      officialSite: '官网',
      loadingState: 'initializing...',
    },
    common: {
      copy: '复制',
      copied: '已复制',
      loading: '加载中...',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useToast.mockReturnValue({ toast });
    useUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    });
    apiClient.getCliTokens.mockResolvedValue({
      tokens: [
        {
          id: 'token-1',
          name: 'agent-prod',
          created_at: '2026-04-04T10:00:00.000Z',
          last_used_at: null,
          is_revoked: false,
        },
      ],
    });
  });

  it('应该根据英文语言渲染页面文案', async () => {
    useLanguage.mockReturnValue({ language: 'en', t: englishTranslations });

    render(<CliTokensPage />);

    expect(await screen.findByText('Create new token')).toBeInTheDocument();
    expect(screen.getByText('Existing tokens')).toBeInTheDocument();
    expect(screen.getByText('How to use')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Full CLI docs' })).toHaveAttribute('href', '/settings/cli-tokens/docs');
    expect(screen.getByText(/Each token carries your account permissions/)).toBeInTheDocument();
    expect(await screen.findByText('Active')).toBeInTheDocument();

    await waitFor(() => {
      expect(apiClient.getCliTokens).toHaveBeenCalled();
    });
  });

  it('应该根据中文语言渲染页面文案', async () => {
    useLanguage.mockReturnValue({ language: 'zh', t: chineseTranslations });

    render(<CliTokensPage />);

    expect(await screen.findByText('创建新 Token')).toBeInTheDocument();
    expect(screen.getByText('现有 Tokens')).toBeInTheDocument();
    expect(screen.getByText('如何使用')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '查看完整文档' })).toHaveAttribute('href', '/settings/cli-tokens/docs');
    expect(screen.getByText(/每个 token 代表你的账户权限/)).toBeInTheDocument();
    expect(await screen.findByText('生效中')).toBeInTheDocument();
  });
});
