# Cameraman AI

## Overview

A full-stack all-in-one AI productivity and study platform with 6 sections. 100% free, no sign-up required.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/cameraman-ai)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM (not used in this app, data is in-memory)
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2 for general, gpt-5.3-codex for code)
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Styling**: Tailwind CSS v4, framer-motion, react-syntax-highlighter, react-markdown

## Features

1. **General AI** - Chat interface with streaming responses, image upload and analysis
2. **Study AI** - Paste text/upload PDF/image/enter YouTube URL → generate notes or quiz
3. **Flashcard AI** - Create flashcards manually or auto-generate from content, 3D flip animation
4. **Checklist AI** - Daily task manager with checkbox, edit, delete
5. **Coder AI** - Language selector + description → generates code with syntax highlighting
6. **About Me** - Profile page for @arya_the_cameraman

## Structure

```text
artifacts/
├── cameraman-ai/         # React + Vite frontend (port assigned by Replit)
│   ├── src/
│   │   ├── components/sections/  # GeneralAI, StudyAI, FlashcardAI, ChecklistAI, CoderAI, AboutMe
│   │   ├── components/layout/    # Navbar
│   │   ├── hooks/               # use-chat-stream.ts
│   │   └── pages/               # Home.tsx
│   └── public/images/           # avatar.png
└── api-server/           # Express API server
    └── src/routes/
        └── ai.ts         # All AI routes: /api/ai/chat, /api/ai/study, /api/ai/flashcards, /api/ai/code, /api/ai/upload
lib/
├── api-spec/openapi.yaml # OpenAPI spec
├── api-client-react/     # Generated React Query hooks
├── api-zod/              # Generated Zod schemas
├── integrations-openai-ai-server/  # OpenAI server integration
└── db/                   # Drizzle ORM schema
```

## API Routes

- `POST /api/ai/chat` - Streaming chat with optional image upload
- `POST /api/ai/study` - Generate notes or quiz from content
- `POST /api/ai/flashcards` - Generate flashcard pairs from content
- `POST /api/ai/code` - Generate code in chosen language
- `POST /api/ai/upload` - Upload PDF/image/text and extract content

## AI Models

- `gpt-5.2` - General chat, study notes, quiz, flashcards, image analysis
- `gpt-5.3-codex` - Code generation (Responses API only)

## Design

Dark brown palette: background `#1a110a` range, cards `#2c1f14` range, primary accent amber/beige.
