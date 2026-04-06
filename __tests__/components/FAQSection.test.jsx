import React from 'react';
import { render, screen } from '@testing-library/react';
import { FAQSection } from '@/components/landing/faq-section';
import en from '@/messages/en.json';
import zh from '@/messages/zh.json';

jest.mock('framer-motion', () => {
  const motionProxy = new Proxy({}, {
    get: (_, tag) => {
      return ({ children, variants, initial, whileInView, viewport, transition, animate, exit, ...props }) =>
        React.createElement(tag, props, children);
    },
  });

  return {
    motion: motionProxy,
    AnimatePresence: ({ children }) => children,
  };
});

jest.mock('@/lib/geo-utils', () => ({
  generateFAQPageSchema: jest.fn(() => ({
    '@type': 'FAQPage',
    mainEntity: [],
  })),
}));

describe('FAQSection', () => {
  it('中文私有部署答案应去掉“企业版用户可以”前缀', () => {
    render(<FAQSection language="zh" t={zh.faq} />);

    expect(screen.getByText('可以选择私有部署方案，我们提供完整的部署支持和技术服务。')).toBeInTheDocument();
    expect(screen.queryByText('企业版用户可以选择私有部署方案，我们提供完整的部署支持和技术服务。')).not.toBeInTheDocument();
  });

  it('英文 FAQ 不应再展示私有部署问题', () => {
    render(<FAQSection language="en" t={en.faq} />);

    expect(screen.queryByText('Is private deployment supported?')).not.toBeInTheDocument();
  });
});
