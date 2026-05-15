# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js App Router project. Route files live in `src/app`, including nested pages such as `profile/[id]`, `prompt/[id]`, `publish`, and the API route `api/presets/[id]/route.ts`. Shared UI components are in `src/components`, reusable services and helpers are in `src/lib`, and bundled prompt presets are in `src/data/presets/*.json` with exports from `src/data/presets/index.ts`. Static assets belong in `public`; global styles are in `src/app/globals.css` and `src/app/globals2.css`.

## Build, Test, and Development Commands

Use `pnpm`, which is the package manager documented by the project and backed by `pnpm-lock.yaml`.

- `pnpm install`: install dependencies.
- `pnpm dev`: run the local Next.js development server.
- `pnpm build`: create a production build.
- `pnpm start`: serve the production build after `pnpm build`.
- `pnpm lint`: run ESLint with the Next.js core-web-vitals and TypeScript configs.

## Coding Style & Naming Conventions

Write TypeScript with strict mode in mind. Use 2-space indentation, single quotes, and the existing semicolon-light style. Import local modules through the `@/*` path alias when it improves readability. Components use `PascalCase`, variables and functions use `camelCase`, route folders stay lowercase, and preset files follow the existing `p1.json`, `p2.json` pattern. Prefer Server Components by default; add `'use client'` only for state, effects, browser APIs, or event handlers.

## Testing Guidelines

There is no dedicated test script or test framework configured yet. For now, validate changes with `pnpm lint` and `pnpm build`. If adding tests, colocate them near the feature or add a clear `src/__tests__` structure, name files `*.test.ts` or `*.test.tsx`, and add the corresponding package script.

## Commit & Pull Request Guidelines

Recent history uses concise Conventional Commit-style prefixes, especially `feat:` and `style:`, with English or Chinese summaries. Keep messages imperative and scoped to one change, for example `feat: add preset filter state`. Pull requests should include a short description, validation commands run, linked issues when applicable, and screenshots for UI changes.

## Security & Configuration Tips

Local secrets belong in `.env.local`, which is ignored by Git. Supabase browser configuration expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; do not add service-role keys to client code.

## Agent-Specific Instructions

This repository uses Next.js `16.2.4`, whose local APIs and conventions may differ from older Next.js versions. Before editing Next.js behavior, read the relevant guide in `node_modules/next/dist/docs/` and follow any deprecation notes.
