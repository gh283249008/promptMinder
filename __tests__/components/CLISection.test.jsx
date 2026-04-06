import React from 'react';
import { render, screen } from '@testing-library/react';
import { CLISection } from '@/components/landing/cli-section';

jest.mock('framer-motion', () => {
  const motionProxy = new Proxy({}, {
    get: (_, tag) => {
      return ({ children, variants, initial, whileInView, viewport, transition, animate, ...props }) =>
        React.createElement(tag, props, children);
    },
  });

  return {
    motion: motionProxy,
    AnimatePresence: ({ children }) => children,
  };
});

describe('CLISection', () => {
  it('应该同时展示 CLI 和 Agent Skill 两个安装步骤', () => {
    render(<CLISection />);

    expect(screen.getByText('Step 1 · Install CLI')).toBeInTheDocument();
    expect(screen.getByText('Step 2 · Install Agent Skill')).toBeInTheDocument();
    expect(screen.getByText('npm install -g @aircrushin/promptminder-cli')).toBeInTheDocument();
    expect(screen.getByText('npx skills add aircrushin/promptminder-cli-skill')).toBeInTheDocument();
  });
});
