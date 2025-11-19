# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

**Note: This project uses pnpm, not npm**

- `pnpm dev` - Start development server
- `pnpm build` - Create production build
- `pnpm preview` - Preview production build
- `pnpm check` - Run Svelte type checking
- `pnpm check:watch` - Run type checking in watch mode
- `pnpm format` - Format code with Prettier
- `pnpm lint` - Run linting (Prettier + ESLint)

## Database Commands

- `pnpm db:push` - Push schema changes to database (uses drizzle-kit)
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio for database management

## Architecture Overview

This is a SvelteKit application for scheduling meetings, similar to When2Meet. The tech stack includes:

**Framework & Language:**

- SvelteKit with TypeScript
- Svelte 5 (using modern runes syntax: `$state`, `$derived`, `$props`)

**Database & ORM:**

- PostgreSQL with standard postgres driver
- Drizzle ORM for database operations
- Database schemas split across two files:
    - `src/lib/server/db/schema.ts` - Main app schema (events, participants)
    - `src/lib/server/db/auth-schema.ts` - Authentication schema (users, sessions, accounts)

**Authentication:**

- Better Auth for authentication
- Email/password authentication enabled
- Integration through `src/hooks.server.ts`

**UI & Styling:**

- TailwindCSS v4 for styling
- shadcn-svelte components in `src/lib/components/ui/`
- Custom components for time selection and event management

**Key Data Models:**

- **Event**: Has organizer, timezone, available time ranges, optional weekly recurrence
- **Participant**: Links to events, stores time selections as JSONB arrays
- **TimeSelection**: Custom type for start/end time pairs, stored as JSONB

**Core Components:**

- `TimeSelector` component handles interactive time grid selection
- Uses pointer events for drag selection with add/remove modes
- Supports custom cell rendering via snippets

**Environment Requirements:**

- `DATABASE_URL` environment variable required for PostgreSQL connection

The application uses a custom time selection system where users can drag to select available time slots on a grid, with support for both adding and removing selections.

## Svelte 5 Syntax Reference

**IMPORTANT**: This project uses Svelte 5 with runes mode. Always check latest Svelte 5 docs via Context7 before making code changes, as training data may contain outdated Svelte 4 syntax.

### Key Svelte 5 Runes Patterns:

**State Management:**

```svelte
// ✅ Svelte 5
let count = $state(0);
let todos = $state([{ done: false, text: 'task' }]);

// ❌ Svelte 4 (deprecated)
let count = 0;
export let someProp;
```

**Props Declaration:**

```svelte
// ✅ Svelte 5
let { name, age = 25, ...rest } = $props();

// ❌ Svelte 4 (deprecated)
export let name;
export let age = 25;
```

**Derived Values:**

```svelte
// ✅ Svelte 5
let doubled = $derived(count * 2);
let complex = $derived.by(() => {
  // Complex computation
  return result;
});

// ❌ Svelte 4 (deprecated)
$: doubled = count * 2;
```

**Side Effects:**

```svelte
// ✅ Svelte 5
$effect(() => {
  if (count > 5) alert('Too high!');
});

// ❌ Svelte 4 (deprecated)
$: if (count > 5) alert('Too high!');
```

**Bindable Props:**

```svelte
// ✅ Svelte 5 (for two-way binding) let {(value = $bindable())} = $props(); // ❌ Svelte 4 (deprecated)
export let value;
```

**Component Events:**

```svelte
// ✅ Svelte 5 (callback props) let {onSubmit} = $props(); // ❌ Svelte 4 (deprecated) import {createEventDispatcher}
from 'svelte'; const dispatch = createEventDispatcher();
```

### Important Notes:

- No `$:` reactive statements in runes mode
- No `export let` for props
- No `$$props` or `$$restProps`
- Use Context7 tool with `/sveltejs/svelte` library ID for latest docs

## UI Components

**IMPORTANT**: Always use shadcn-svelte components when available. Components are located in `src/lib/components/ui/`.

**Available Components:**

- Avatar, Badge, Button, Calendar, Card, Command, Dialog
- Dropdown Menu, Input, Label, Popover, Select, Separator, Sonner

**Adding New Components:**
If you need a shadcn-svelte component that's not yet added:

```bash
npx shadcn-svelte@latest add [component-name]
```

Examples:

```bash
npx shadcn-svelte@latest add sheet
npx shadcn-svelte@latest add table
npx shadcn-svelte@latest add tabs
```

**Usage Pattern:**

```svelte
import {Button} from '$lib/components/ui/button'; import {Input} from '$lib/components/ui/input'; import
{Card} from '$lib/components/ui/card';
```

The project uses `components.json` for shadcn-svelte configuration.
