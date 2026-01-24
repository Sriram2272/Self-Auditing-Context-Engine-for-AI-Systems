# Evidence-Aware QA System

## Overview

This is an AI-powered question answering system that combines Retrieval-Augmented Generation (RAG) with knowledge graphs to provide trustworthy, evidence-backed answers. The application ingests documents, extracts structured knowledge, and answers questions by citing specific sources and showing reasoning chains.

Key capabilities:
- Document ingestion with automatic chunking for RAG retrieval
- Knowledge graph extraction (entities and relationships) from documents
- Multi-hop reasoning with step-by-step explanations
- Evidence highlighting and source credibility scoring
- Contradiction detection between sources
- Interactive knowledge graph visualization

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme variables supporting light/dark modes
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Framework**: Express.js 5 running on Node.js with TypeScript
- **API Pattern**: REST endpoints for document management, chat sessions, and Q&A
- **LLM Integration**: OpenAI API via Replit AI Integrations for answer generation, knowledge extraction, and contradiction detection
- **Build System**: esbuild for server bundling, Vite for client bundling

### RAG Pipeline
- Documents are chunked into overlapping segments (500 chars with 100 char overlap)
- TF-IDF similarity scoring for chunk retrieval
- Evidence is ranked by relevance and highlighted in responses
- Three sample documents pre-loaded: Machine Learning, Climate Change, Business Strategy

### LLM Fallback
- When OpenAI API is unavailable, system uses regex-based entity extraction
- Basic reasoning steps generated from evidence without LLM
- Answers composed from evidence excerpts with fallback message

### Knowledge Graph
- Entities extracted via LLM with fallback to regex-based NER
- Relationships stored as edges between entities
- Graph visualization rendered on HTML canvas with zoom/pan controls

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for type definitions, `shared/models/` for Drizzle table definitions
- **Migrations**: Generated via `drizzle-kit push` command
- **Current Implementation**: In-memory storage in `server/storage.ts` with interface ready for database migration

### Session Management
- Chat sessions track conversation history with messages
- Each message can contain structured answer data including evidence, graph facts, and reasoning steps
- Sessions are domain-scoped for focused knowledge retrieval

## External Dependencies

### AI Services
- **OpenAI API**: Used via Replit AI Integrations (`AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`)
- Models used: `gpt-5.1` for text generation, `gpt-image-1` for image generation

### Database
- **PostgreSQL**: Connection via `DATABASE_URL` environment variable
- **Session Storage**: connect-pg-simple for Express session persistence

### Replit Integrations
Located in `server/replit_integrations/` and `client/replit_integrations/`:
- **Audio**: Voice chat with speech-to-text and text-to-speech capabilities
- **Chat**: Basic conversation storage and streaming responses
- **Image**: Image generation endpoints
- **Batch**: Rate-limited batch processing utilities for LLM calls

### Key NPM Packages
- `drizzle-orm` / `drizzle-zod`: Database ORM and schema validation
- `@tanstack/react-query`: Server state management
- `zod`: Runtime type validation for API requests
- Radix UI primitives: Accessible component foundations