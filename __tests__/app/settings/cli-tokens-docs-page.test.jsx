import React from 'react';
import { render, screen } from '@testing-library/react';
import CliTokensDocsPage from '@/app/settings/cli-tokens/docs/page';
import { useLanguage } from '@/contexts/LanguageContext';

jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>;
});

jest.mock('lucide-react', () => ({
  AlertTriangle: (props) => <svg data-testid="alert-triangle-icon" {...props} />,
  ArrowLeft: (props) => <svg data-testid="arrow-left-icon" {...props} />,
  BookOpenText: (props) => <svg data-testid="book-open-text-icon" {...props} />,
  TerminalSquare: (props) => <svg data-testid="terminal-square-icon" {...props} />,
  Wrench: (props) => <svg data-testid="wrench-icon" {...props} />,
  Bot: (props) => <svg data-testid="bot-icon" {...props} />,
  ExternalLink: (props) => <svg data-testid="external-link-icon" {...props} />,
  Copy: (props) => <svg data-testid="copy-icon" {...props} />,
  Check: (props) => <svg data-testid="check-icon" {...props} />,
}));

describe('CLI Tokens docs page', () => {
  it('应该渲染英文详细文档', () => {
    useLanguage.mockReturnValue({
      language: 'en',
      t: {
        cliTokens: {
          docs: {
            badge: 'Documentation',
            title: 'CLI + Skills guide',
            description: 'Detailed setup instructions for PromptMinder CLI, promptminder-agent, and skill installation.',
            quickstartTitle: 'Quick start',
            skillsTitle: 'Skills install',
            compatibilityTitle: 'Compatibility path',
            troubleshootingTitle: 'Troubleshooting',
          },
        },
      },
    });

    render(<CliTokensDocsPage />);

    expect(screen.getByText('CLI + Skills guide')).toBeInTheDocument();
    expect(screen.getByText('promptminder-agent prompt.list')).toBeInTheDocument();
    expect(screen.getByText(/npx skills add aircrushin\/promptminder-cli-skill/)).toBeInTheDocument();
    expect(screen.getByText(/promptminder skills install/)).toBeInTheDocument();
    expect(screen.getByText('npm i -g @aircrushin/promptminder-cli')).toHaveClass('text-[#f8fafc]');
  });

  it('应该渲染中文详细文档', () => {
    useLanguage.mockReturnValue({
      language: 'zh',
      t: {
        cliTokens: {
          docs: {
            badge: '文档',
            title: 'CLI 与 Skills 使用说明',
            description: '集中说明 PromptMinder CLI、promptminder-agent 和 skill 安装方式。',
            quickstartTitle: '快速开始',
            skillsTitle: 'Skills 安装',
            compatibilityTitle: '兼容安装路径',
            troubleshootingTitle: '常见问题排查',
          },
        },
      },
    });

    render(<CliTokensDocsPage />);

    expect(screen.getByText('CLI 与 Skills 使用说明')).toBeInTheDocument();
    expect(screen.getByText('promptminder-agent prompt.list')).toBeInTheDocument();
    expect(screen.getByText(/npx skills add aircrushin\/promptminder-cli-skill/)).toBeInTheDocument();
    expect(screen.getByText(/promptminder skills install/)).toBeInTheDocument();
    expect(screen.getByText('npm i -g @aircrushin/promptminder-cli')).toHaveClass('text-[#f8fafc]');
  });
});
