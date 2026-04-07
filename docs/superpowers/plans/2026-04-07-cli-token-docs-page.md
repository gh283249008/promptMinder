# CLI Token Docs Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a detailed CLI and skills documentation page under `settings/cli-tokens` that matches the existing visual language and is reachable from the current token management page.

**Architecture:** Keep the current `app/settings/cli-tokens/page.js` as the token management surface and add a sibling route at `app/settings/cli-tokens/docs/page.js` for long-form documentation. Reuse the same black-and-white terminal-inspired layout cues and local translation lookup through `useLanguage()` so the new page feels native to the existing settings area.

**Tech Stack:** Next.js App Router, React client components, existing `useLanguage()` i18n, Tailwind utility classes, Jest + React Testing Library.

---

### Task 1: Lock the behavior with tests

**Files:**
- Modify: `__tests__/app/settings/cli-tokens-page.test.jsx`
- Create: `__tests__/app/settings/cli-tokens-docs-page.test.jsx`

- [ ] **Step 1: Write the failing tests**

```jsx
expect(screen.getByRole('link', { name: /full cli docs|查看完整文档/i })).toBeInTheDocument();
expect(screen.getByText(/promptminder-agent/i)).toBeInTheDocument();
expect(screen.getByText(/npx skills add aircrushin\/promptminder-cli-skill/i)).toBeInTheDocument();
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test __tests__/app/settings/cli-tokens-page.test.jsx __tests__/app/settings/cli-tokens-docs-page.test.jsx`
Expected: FAIL because the docs entry link and docs route content do not exist yet.

### Task 2: Implement the new docs page and entry point

**Files:**
- Modify: `app/settings/cli-tokens/page.js`
- Create: `app/settings/cli-tokens/docs/page.js`
- Modify: `messages/zh.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add the entry link copy and docs translation content**

Add translation keys for:
- link label from the main page to the docs page
- docs page title, description, section headings, cards, code blocks, and troubleshooting copy

- [ ] **Step 2: Implement the docs page**

Render sections for:
- quick start
- CLI quick reference
- agent wrapper usage
- skills installation and recommended path
- compatibility note for `promptminder skills install`
- common mistakes and troubleshooting

- [ ] **Step 3: Add the docs entry point on the main token page**

Place a secondary link in the header area and/or how-to section so users can discover the new page without interrupting the existing token workflow.

- [ ] **Step 4: Re-run tests to verify they pass**

Run: `pnpm test __tests__/app/settings/cli-tokens-page.test.jsx __tests__/app/settings/cli-tokens-docs-page.test.jsx`
Expected: PASS

### Task 3: Verify broader safety

**Files:**
- Modify: `app/settings/cli-tokens/page.js`
- Create: `app/settings/cli-tokens/docs/page.js`
- Modify: `messages/zh.json`
- Modify: `messages/en.json`
- Modify: `__tests__/app/settings/cli-tokens-page.test.jsx`
- Create: `__tests__/app/settings/cli-tokens-docs-page.test.jsx`

- [ ] **Step 1: Run lint**

Run: `pnpm lint`
Expected: PASS with no ESLint errors from the new page or updated tests.
